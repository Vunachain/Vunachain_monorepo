import os
import json
from django.conf import settings

# Load Traceability ABI (V1)
ABI_PATH = os.path.join(os.path.dirname(__file__), 'abis', 'Traceability.json')

def get_traceability_abi():
    with open(ABI_PATH, 'r') as f:
        data = json.load(f)
        return data['abi']

# Load TraceabilityV2 ABI
ABI_V2_PATH = os.path.join(os.path.dirname(__file__), 'abis', 'TraceabilityV2.json')

def get_traceability_v2_abi():
    """Load TraceabilityV2 ABI from compiled Hardhat artifacts."""
    if os.path.exists(ABI_V2_PATH):
        with open(ABI_V2_PATH, 'r') as f:
            data = json.load(f)
            return data['abi']
    # Fallback: Try loading from protocol artifacts
    protocol_path = os.path.join(
        settings.BASE_DIR.parent.parent, 
        'Vunachain_protocol', 'artifacts', 'contracts', 
        'TraceabilityV2.sol', 'TraceabilityV2.json'
    )
    if os.path.exists(protocol_path):
        with open(protocol_path, 'r') as f:
            data = json.load(f)
            return data['abi']
    raise FileNotFoundError("TraceabilityV2 ABI not found. Run 'npx hardhat compile' in Vunachain_protocol.")

# Contract Addresses (V1)
TRACEABILITY_ADDRESS_SEPOLIA = os.getenv("TRACEABILITY_ADDRESS_SEPOLIA", "0x0000000000000000000000000000000000000000")
CUSD_ADDRESS_SEPOLIA = "0x765DE816845861e75A25fCA122bb6898B8B1282a" # Verify for Sepolia

# Contract Addresses (V2) - Set after deployment
TRACEABILITY_V2_ADDRESS_SEPOLIA = os.getenv("TRACEABILITY_V2_ADDRESS_SEPOLIA", "")
TRACEABILITY_V2_ADDRESS_MAINNET = os.getenv("TRACEABILITY_V2_ADDRESS_MAINNET", "")

# Event Topics V1 (Keccak256 of event signatures)
HARVEST_LOGGED_TOPIC = "0xed37b42ccac45b7377ac3f858ab6be69a7e942043a4661665a2d2693a82b20b"
HARVEST_VERIFIED_TOPIC = "0x5c914e27d8d48c81aa60650e8850c3d07281b8ae4f947f2af445acfcb073e"
PAYOUT_TRIGGERED_TOPIC = "0x7884580f743f908c98258afac53f9e0929cd6787b3488df80e096df15409ef8f"

# Event Topics V2 (Computed via Keccak256)
HARVEST_LOGGED_V2_TOPIC = "0x2f8788117e7eff1d82e926ec794901d17c78024a50270940304540a733656f0d"
HARVEST_VERIFIED_V2_TOPIC = "0xf6391f5c32d9c69d2a47ea670b442974b53935d1edc7fd64eb21e047a839171b"
BATCH_PAYOUT_CREATED_TOPIC = "0xe75851eccf8ce8120445430ba924915befcd02a9e453f3e47dfd0ad3b862640e"
PAYOUT_CLAIMED_TOPIC = "0x42bedcec4b68e4a8fa2eab357829ddeb2f05b2bf2dd3d45d211f4a3430cd8c"

