"""
Hash utilities for Lean-Chain data verification.

Generates deterministic SHA-256 hashes of harvest data for on-chain storage.
Full data stored in PostgreSQL, hash stored on Celo for verification.
"""
import hashlib
import json
from typing import Optional
from eth_abi import encode as abi_encode


def generate_harvest_hash(
    farmer_id: str,
    crop_type: str,
    weight_kg: int,
    location: str,
    timestamp: Optional[int] = None
) -> bytes:
    """
    Generate deterministic SHA-256 hash of harvest data.
    
    Returns 32 bytes suitable for bytes32 in Solidity.
    
    Args:
        farmer_id: External UUID from Vunachain Backend
        crop_type: Type of crop (e.g., "Coffee", "Cocoa")
        weight_kg: Weight in kilograms
        location: GPS coordinates or Geohash
        timestamp: Optional Unix timestamp
        
    Returns:
        32-byte SHA-256 hash
    """
    # Canonical JSON for deterministic hashing
    data = {
        "farmer_id": farmer_id,
        "crop_type": crop_type.lower().strip(),
        "weight_kg": int(weight_kg),
        "location": location.strip()
    }
    
    if timestamp:
        data["timestamp"] = int(timestamp)
    
    # Sort keys for determinism
    json_str = json.dumps(data, sort_keys=True, separators=(',', ':'))
    return hashlib.sha256(json_str.encode('utf-8')).digest()


def generate_harvest_hash_hex(
    farmer_id: str,
    crop_type: str,
    weight_kg: int,
    location: str,
    timestamp: Optional[int] = None
) -> str:
    """
    Generate harvest hash as hex string with 0x prefix.
    
    Returns:
        Hex string like "0x1234..."
    """
    hash_bytes = generate_harvest_hash(
        farmer_id, crop_type, weight_kg, location, timestamp
    )
    return '0x' + hash_bytes.hex()


def verify_harvest_hash(
    expected_hash: bytes,
    farmer_id: str,
    crop_type: str,
    weight_kg: int,
    location: str,
    timestamp: Optional[int] = None
) -> bool:
    """
    Verify that provided data matches the expected hash.
    
    Used by auditors/verifiers to confirm on-chain hash matches source data.
    """
    computed_hash = generate_harvest_hash(
        farmer_id, crop_type, weight_kg, location, timestamp
    )
    return computed_hash == expected_hash


def generate_merkle_leaf(
    record_id: int,
    farmer_address: str,
    amount: int
) -> bytes:
    """
    Generate Merkle leaf for batch payout claims.
    
    Must match the leaf format in TraceabilityV2.sol:
    keccak256(abi.encodePacked(recordId, farmer, amount))
    
    Args:
        record_id: Harvest record ID
        farmer_address: Farmer wallet address (checksummed)
        amount: Payout amount in wei/smallest unit
        
    Returns:
        32-byte keccak256 hash
    """
    from web3 import Web3
    
    # Use solidity_keccak for abi.encodePacked compatibility
    return Web3.solidity_keccak(
        ['uint256', 'address', 'uint128'],
        [record_id, Web3.to_checksum_address(farmer_address), amount]
    )
