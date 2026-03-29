"""
Batch Payment Processor for Merkle-based payouts.

Aggregates verified harvests and submits as single Merkle payout transaction.
Reduces gas costs by ~95% for high-volume payouts.
"""
import logging
from dataclasses import dataclass
from datetime import datetime
from typing import List, Dict, Any

from django.utils import timezone
from eth_utils import keccak

from .provider import celo_provider
from .hash_utils import generate_merkle_leaf

logger = logging.getLogger(__name__)


class MerkleTree:
    """
    Lightweight Merkle Tree implementation compatible with OpenZeppelin MerkleProof.
    """
    def __init__(self, leaves: List[bytes]):
        self.leaves = leaves
        # Sort leaves to ensure deterministic tree (optional but good practice)
        # However, for proofs we need the original order to find indices
        self.layers = [leaves]
        self._build_tree()

    def _build_tree(self):
        current_layer = self.layers[0]
        while len(current_layer) > 1:
            next_layer = []
            for i in range(0, len(current_layer), 2):
                if i + 1 < len(current_layer):
                    # Sort pairs for OpenZeppelin compatibility
                    left, right = sorted([current_layer[i], current_layer[i+1]])
                    next_layer.append(keccak(left + right))
                else:
                    # Odd number of leaves, promote the last one
                    next_layer.append(current_layer[i])
            self.layers.append(next_layer)
            current_layer = next_layer

    @property
    def root(self) -> bytes:
        return self.layers[-1][0] if self.layers[-1] else b''

    def get_proof(self, index: int) -> List[str]:
        proof = []
        for layer in self.layers[:-1]:
            is_right = index % 2
            pair_index = index - 1 if is_right else index + 1
            
            if pair_index < len(layer):
                proof.append(layer[pair_index].hex())
            
            index //= 2
        return proof

logger = logging.getLogger(__name__)


@dataclass
class PayoutRecord:
    """Single payout in a batch."""
    record_id: int
    farmer_address: str
    amount: int  # in wei/smallest unit


@dataclass
class MerkleBatch:
    """Completed Merkle batch ready for submission."""
    merkle_root: str
    total_records: int
    total_amount: int
    records: List[PayoutRecord]
    proofs: Dict[int, List[str]]  # record_id -> list of hex hashes
    created_at: datetime


class PayoutBatchProcessor:
    """
    Aggregates verified harvests and submits as single Merkle payout.
    
    Flow:
    1. collect_pending_payouts() gathers verified harvests
    2. create_batch() generates Merkle tree
    3. submit_batch() submits root to blockchain
    4. Farmers can claim, or use batchDistribute for direct payout
    """
    
    def __init__(self):
        self.provider = celo_provider
        self.w3 = self.provider.get_w3()
    
    def collect_pending_payouts(self, max_records: int = 100) -> List[PayoutRecord]:
        """
        Collect pending payouts from the database.
        
        Returns list of verified harvests awaiting payout.
        """
        from blockchain_sync.models import OnChainHarvest
        
        pending = OnChainHarvest.objects.filter(
            status=1,  # Verified
            batch__isnull=True
        ).order_by('verified_at')[:max_records]
        
        records = []
        for harvest in pending:
            if harvest.payout_amount_cusd and harvest.farmer_address:
                records.append(PayoutRecord(
                    record_id=harvest.record_id,
                    farmer_address=harvest.farmer_address,
                    amount=int(harvest.payout_amount_cusd * 10**18)  # Convert to wei
                ))
        
        return records
    
    def create_batch(self, records: List[PayoutRecord]) -> MerkleBatch:
        """
        Generate Merkle tree from payout records and persist proofs.
        """
        if not records:
            raise ValueError("No records to batch")
        
        # Generate leaves (as bytes)
        leaves = []
        for record in records:
            leaf = generate_merkle_leaf(
                record.record_id,
                record.farmer_address,
                record.amount
            )
            leaves.append(leaf)
        
        # Build tree using custom implementation
        mt = MerkleTree(leaves)
        root = "0x" + mt.root.hex()
        
        from blockchain_sync.models import MerkleBatchModel, OnChainHarvest
        db_batch = MerkleBatchModel.objects.create(
            merkle_root=root,
            total_records=len(records),
            total_amount_cusd=sum(r.amount for r in records) / 10**18,
            status='CREATED'
        )
        
        proofs = {}
        for i, record in enumerate(records):
            # Generate proof using custom tree
            proof_hex = mt.get_proof(i)
            proofs[record.record_id] = proof_hex
            
            # Persist proof to the record
            OnChainHarvest.objects.filter(record_id=record.record_id).update(
                batch=db_batch,
                merkle_proof=proof_hex
            )
        
        return MerkleBatch(
            merkle_root=root,
            total_records=len(records),
            total_amount=sum(r.amount for r in records),
            records=records,
            proofs=proofs,
            created_at=timezone.now()
        )
    
    def submit_batch(self, batch: MerkleBatch) -> Dict[str, Any]:
        """
        Submit Merkle batch to blockchain.
        """
        try:
            contract = self._get_traceability_v2_contract()
            
            txn = contract.functions.createBatchPayout(
                bytes.fromhex(batch.merkle_root[2:]),
                batch.total_records,
                batch.total_amount
            ).build_transaction({
                'from': self._get_admin_address(),
                'nonce': self.w3.eth.get_transaction_count(self._get_admin_address()),
                'gas': 100000,
                'gasPrice': self.w3.eth.gas_price,
            })
            
            receipt = self.provider.send_transaction(txn)
            tx_hash = receipt.transactionHash.hex()
            
            logger.info(f"Batch payout submitted: {tx_hash}")
            
            # Update batch in database
            from blockchain_sync.models import MerkleBatchModel
            MerkleBatchModel.objects.filter(merkle_root=batch.merkle_root).update(
                transaction_hash=tx_hash,
                status='SUBMITTED'
            )
            
            return {
                "success": True,
                "transaction_hash": tx_hash,
                "merkle_root": batch.merkle_root,
                "total_records": batch.total_records,
                "total_amount": batch.total_amount
            }
            
        except Exception as e:
            logger.error(f"Batch submission failed: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def distribute_batch(self, batch: MerkleBatch) -> Dict[str, Any]:
        """
        Directly distribute payouts without requiring claims.
        """
        try:
            contract = self._get_traceability_v2_contract()
            
            record_ids = [r.record_id for r in batch.records]
            amounts = [r.amount for r in batch.records]
            
            txn = contract.functions.batchDistribute(
                record_ids,
                amounts
            ).build_transaction({
                'from': self._get_admin_address(),
                'nonce': self.w3.eth.get_transaction_count(self._get_admin_address()),
                'gas': 50000 + (30000 * len(batch.records)),
                'gasPrice': self.w3.eth.gas_price,
            })
            
            receipt = self.provider.send_transaction(txn)
            tx_hash = receipt.transactionHash.hex()
            
            logger.info(f"Batch distributed: {tx_hash}")
            
            # Update batch and records
            from blockchain_sync.models import MerkleBatchModel, OnChainHarvest
            MerkleBatchModel.objects.filter(merkle_root=batch.merkle_root).update(
                transaction_hash=tx_hash,
                status='CONFIRMED',
                is_distributed=True
            )
            
            OnChainHarvest.objects.filter(
                record_id__in=record_ids
            ).update(status=3)  # Paid
            
            return {
                "success": True,
                "transaction_hash": tx_hash,
                "records_paid": len(batch.records),
                "total_amount": batch.total_amount
            }
            
        except Exception as e:
            logger.error(f"Batch distribution failed: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    def _get_admin_address(self) -> str:
        """Get admin wallet address."""
        private_key = self.provider.get_private_key()
        if not private_key:
            raise ValueError("Admin private key not configured")
        
        account = self.w3.eth.account.from_key(private_key)
        return account.address
    
    def _get_traceability_v2_contract(self):
        """Get TraceabilityV2 contract instance."""
        import os
        from .constants import get_traceability_v2_abi
        
        address = os.getenv("TRACEABILITY_V2_ADDRESS_SEPOLIA")
        if self.provider.network == "mainnet":
            address = os.getenv("TRACEABILITY_V2_ADDRESS_MAINNET")
            
        if not address:
            raise ValueError("TraceabilityV2 contract address not configured")
            
        return self.provider.get_contract(address, get_traceability_v2_abi())


# Singleton instance
batch_processor = PayoutBatchProcessor()
