"""
Meta-Transaction Relayer Service for Gasless Transactions.

Accepts signed messages from farmers and relays as blockchain transactions.
Vunachain backend pays gas fees, farmers need $0 balance to use the app.
"""
import logging
from typing import Optional, Dict, Any
from dataclasses import dataclass
from eth_account.messages import encode_defunct
from web3 import Web3

from .provider import celo_provider
from .hash_utils import generate_harvest_hash_hex

logger = logging.getLogger(__name__)


@dataclass
class SignedHarvestData:
    """Signed harvest data from farmer."""
    farmer_address: str
    farmer_id: str
    crop_type: str
    weight_kg: int
    location: str
    signature: str  # EIP-191 or EIP-712 signature


class MetaTransactionRelayer:
    """
    Gasless transaction relayer for Vunachain.
    
    Flow:
    1. Farmer signs harvest data off-chain (no gas needed)
    2. Frontend sends signed message to Django API
    3. This relayer validates signature matches farmer address
    4. Relayer submits transaction using treasury wallet
    5. Farmer receives confirmation
    """
    
    def __init__(self):
        self.provider = celo_provider
        self.w3 = self.provider.get_w3()
    
    def verify_signature(
        self, 
        message_hash: str, 
        signature: str, 
        expected_signer: str
    ) -> bool:
        """
        Verify EIP-191 signature matches expected signer.
        
        Args:
            message_hash: Hash of the signed data (hex string)
            signature: Signature from farmer wallet (hex string)
            expected_signer: Expected farmer address
            
        Returns:
            True if signature is valid and from expected signer
        """
        try:
            # Decode the message that was signed
            message = encode_defunct(hexstr=message_hash)
            
            # Recover signer address
            recovered_address = self.w3.eth.account.recover_message(
                message, 
                signature=signature
            )
            
            # Compare addresses (case-insensitive)
            return recovered_address.lower() == expected_signer.lower()
            
        except Exception as e:
            logger.error(f"Signature verification failed: {e}")
            return False
    
    def verify_typed_signature(
        self,
        typed_data: Dict[str, Any],
        signature: str,
        expected_signer: str
    ) -> bool:
        """
        Verify EIP-712 typed data signature.
        
        This is more secure than EIP-191 as it prevents phishing attacks.
        """
        try:
            from eth_account import Account
            
            recovered_address = Account.recover_message(
                signable_message_from_structured_data(typed_data),
                signature=signature
            )
            
            return recovered_address.lower() == expected_signer.lower()
            
        except Exception as e:
            logger.error(f"Typed signature verification failed: {e}")
            return False
    
    def relay_harvest_log(
        self, 
        signed_data: SignedHarvestData
    ) -> Dict[str, Any]:
        """
        Submit harvest log transaction on behalf of farmer.
        
        Args:
            signed_data: Signed harvest data from farmer
            
        Returns:
            dict with transaction hash or error
        """
        try:
            # Generate the data hash
            data_hash = generate_harvest_hash_hex(
                signed_data.farmer_id,
                signed_data.crop_type,
                signed_data.weight_kg,
                signed_data.location
            )
            
            # Verify signature (if provided)
            if signed_data.signature:
                is_valid = self.verify_signature(
                    data_hash,
                    signed_data.signature,
                    signed_data.farmer_address
                )
                
                if not is_valid:
                    return {
                        "success": False,
                        "error": "Invalid signature - does not match farmer address"
                    }
            
            # Get contract instance (V2)
            contract = self._get_traceability_v2_contract()
            
            # Build transaction
            txn = contract.functions.logHarvest(
                Web3.to_checksum_address(signed_data.farmer_address),
                bytes.fromhex(data_hash[2:])  # Remove 0x prefix
            ).build_transaction({
                'from': self._get_relayer_address(),
                'nonce': self.w3.eth.get_transaction_count(self._get_relayer_address()),
                'gas': 150000,  # Estimated gas for logHarvest
                'gasPrice': self.w3.eth.gas_price,
            })
            
            # Sign and send with relayer's private key
            receipt = self.provider.send_transaction(txn)
            
            logger.info(f"Relayed harvest log: {receipt.transactionHash.hex()}")
            
            return {
                "success": True,
                "transaction_hash": receipt.transactionHash.hex(),
                "data_hash": data_hash,
                "block_number": receipt.blockNumber
            }
            
        except Exception as e:
            logger.error(f"Relay failed: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def _get_relayer_address(self) -> str:
        """Get the relayer/treasury wallet address."""
        private_key = self.provider.get_private_key()
        if not private_key:
            raise ValueError("Relayer private key not configured")
        
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
meta_relayer = MetaTransactionRelayer()
