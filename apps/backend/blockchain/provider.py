import os
import logging
from web3 import Web3
from django.conf import settings

logger = logging.getLogger(__name__)

class CeloProvider:
    """
    Singleton provider for interacting with the Celo blockchain.
    """
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(CeloProvider, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
            
        self.network = os.getenv("CELO_NETWORK", "sepolia") # Default to sepolia for development
        
        if self.network == "mainnet":
            self.rpc_url = settings.CELO_RPC_URL
        else:
            self.rpc_url = settings.CELO_SEPOLIA_RPC_URL
            
        self.w3 = Web3(Web3.HTTPProvider(self.rpc_url))
        
        if self.w3.is_connected():
            logger.info(f"Connected to Celo {self.network} via {self.rpc_url}")
        else:
            logger.error(f"Failed to connect to Celo {self.network}")

        self._initialized = True

    def get_w3(self):
        return self.w3

    def get_contract(self, address, abi):
        return self.w3.eth.contract(address=Web3.to_checksum_address(address), abi=abi)

    def get_traceability_contract(self):
        """
        Returns a Web3.py contract instance for the Traceability contract.
        """
        from .constants import TRACEABILITY_ADDRESS_SEPOLIA, get_traceability_abi
        address = TRACEABILITY_ADDRESS_SEPOLIA
        if self.network == "mainnet":
            address = os.getenv("TRACEABILITY_ADDRESS_MAINNET")
            
        return self.get_contract(address, get_traceability_abi())

    def get_private_key(self):
        """
        Retrieves the hot wallet private key securely.
        Prioritizes environment variables for easy deployment on platforms like Railway.
        """
        pk = os.getenv("CELO_PRIVATE_KEY")
        if not pk:
            logger.warning("CELO_PRIVATE_KEY not set in environment.")
        return pk

    def send_transaction(self, transaction_dict):
        """
        Signs and sends a transaction using the internal secure key.
        """
        private_key = self.get_private_key()
        if not private_key:
            raise ValueError("Cannot send transaction: Private key missing")
            
        signed_txn = self.w3.eth.account.sign_transaction(transaction_dict, private_key)
        txn_hash = self.w3.eth.send_raw_transaction(signed_txn.rawTransaction)
        return self.w3.eth.wait_for_transaction_receipt(txn_hash)


celo_provider = CeloProvider()
