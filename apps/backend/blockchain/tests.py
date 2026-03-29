"""
Tests for blockchain utilities.
"""
from django.test import TestCase
from decimal import Decimal
from unittest.mock import MagicMock, patch
from eth_utils import keccak
from .batch_processor import MerkleTree, PayoutBatchProcessor, PayoutRecord
from .hash_utils import generate_merkle_leaf, generate_harvest_hash

class MerkleTreeTests(TestCase):
    """Test suite for custom MerkleTree implementation."""

    def test_single_leaf_root(self):
        """Test root generation for a single leaf."""
        leaf = keccak(b"leaf1")
        mt = MerkleTree([leaf])
        self.assertEqual(mt.root, leaf)

    def test_two_leaves_root(self):
        """Test root generation for two leaves (OpenZeppelin compatible)."""
        l1 = keccak(b"a")
        l2 = keccak(b"b")
        left, right = sorted([l1, l2])
        expected_root = keccak(left + right)
        mt = MerkleTree([l1, l2])
        self.assertEqual(mt.root, expected_root)

    def test_get_proof(self):
        """Test proof generation for a specific leaf."""
        leaves = [keccak(bytes([i])) for i in range(4)]
        mt = MerkleTree(leaves)
        proof = mt.get_proof(0)
        self.assertEqual(len(proof), 2)
        self.assertEqual(proof[0], leaves[1].hex())

class PayoutBatchProcessorTests(TestCase):
    """Test suite for PayoutBatchProcessor."""

    def setUp(self):
        self.processor = PayoutBatchProcessor()
        self.processor.provider = MagicMock()
        self.processor.w3 = MagicMock()

    def test_collect_pending_payouts(self):
        """Test collecting pending payouts from OnChainHarvest."""
        from blockchain_sync.models import OnChainHarvest
        OnChainHarvest.objects.create(
            record_id=1, farmer_address="0x1", crop_type="C1",
            weight_kg=10, status=1, payout_amount_cusd=Decimal("1.5")
        )
        records = self.processor.collect_pending_payouts()
        self.assertEqual(len(records), 1)
        self.assertEqual(records[0].amount, 1.5 * 10**18)

    def test_create_batch(self):
        """Test creating a Merkle batch and persisting proofs."""
        records = [
            PayoutRecord(record_id=1, farmer_address="0x1111111111111111111111111111111111111111", amount=10**18),
        ]
        from blockchain_sync.models import OnChainHarvest
        OnChainHarvest.objects.create(record_id=1, farmer_address="0x1", crop_type="C1", weight_kg=10)

        batch = self.processor.create_batch(records)
        self.assertEqual(batch.total_records, 1)
        self.assertTrue(batch.merkle_root.startswith("0x"))

    @patch('blockchain.batch_processor.PayoutBatchProcessor._get_traceability_v2_contract')
    @patch('blockchain.batch_processor.PayoutBatchProcessor._get_admin_address')
    def test_submit_batch(self, mock_get_admin, mock_get_contract):
        """Test submitting a batch to the blockchain."""
        from blockchain_sync.models import MerkleBatchModel
        root = "0x" + "a" * 64
        MerkleBatchModel.objects.create(merkle_root=root, total_records=1, total_amount_cusd=1)
        
        batch = MagicMock()
        batch.merkle_root = root
        batch.total_records = 1
        batch.total_amount = 10**18
        
        mock_get_admin.return_value = "0xAdmin"
        mock_contract = MagicMock()
        mock_get_contract.return_value = mock_contract
        mock_contract.functions.createBatchPayout.return_value.build_transaction.return_value = {}
        self.processor.provider.send_transaction.return_value.transactionHash.hex.return_value = "0xTX"
        
        result = self.processor.submit_batch(batch)
        self.assertTrue(result['success'])

class HashUtilsTests(TestCase):
    """Test suite for hash utilities."""

    def test_generate_merkle_leaf(self):
        """Test that merkle leaf generation matches expected Solidity format."""
        addr = "0x1234567890123456789012345678901234567890"
        leaf = generate_merkle_leaf(1, addr, 100)
        self.assertEqual(len(leaf), 32)

    def test_generate_harvest_hash(self):
        """Test deterministic harvest hash generation."""
        h1 = generate_harvest_hash("f1", "Coffee", 100, "Loc1")
        h2 = generate_harvest_hash("f1", "COFFEE ", 100, " Loc1")
        self.assertEqual(h1, h2)
