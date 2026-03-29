// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

/**
 * @title TraceabilityV2
 * @dev Lean-Chain optimized contract: stores proofs not data.
 * 
 * Key optimizations:
 * 1. Hash-only storage - full data in PostgreSQL, hash on-chain
 * 2. Batch payout support via Merkle proofs
 * 3. Gas-efficient struct packing
 */
contract TraceabilityV2 is AccessControl {
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    bytes32 public constant RELAYER_ROLE = keccak256("RELAYER_ROLE");
    
    IERC20 public immutable cUSD;

    enum Status { Pending, Verified, Rejected, Paid }

    /**
     * @dev Gas-optimized harvest record.
     * - dataHash: SHA-256 of off-chain JSON (farmerId, cropType, weightKg, location)
     * - Saves ~90% gas vs storing full strings
     */
    struct HarvestRecord {
        address farmer;           // 20 bytes
        bytes32 dataHash;         // 32 bytes - hash of off-chain data
        uint64 timestamp;         // 8 bytes - packed with status
        Status status;            // 1 byte
        uint128 payoutAmount;     // 16 bytes - max ~340 undecillion cUSD
    }

    uint256 public recordCount;
    mapping(uint256 => HarvestRecord) public records;
    
    // Batch payout tracking
    bytes32 public currentMerkleRoot;
    mapping(bytes32 => bool) public processedRoots;
    mapping(uint256 => bool) public claimed;

    // Events
    event HarvestLogged(uint256 indexed recordId, address indexed farmer, bytes32 dataHash);
    event HarvestVerified(uint256 indexed recordId, Status status, uint128 payoutAmount);
    event PayoutTriggered(uint256 indexed recordId, address indexed farmer, uint128 amount);
    event BatchPayoutCreated(bytes32 indexed merkleRoot, uint256 totalRecords, uint256 totalAmount);
    event PayoutClaimed(uint256 indexed recordId, address indexed farmer, uint128 amount);

    constructor(address _cUSDToken) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(RELAYER_ROLE, msg.sender); // Admin can also relay
        cUSD = IERC20(_cUSDToken);
    }

    // ============ Core Functions ============

    /**
     * @dev Log a new harvest with hash-only storage.
     * @param _farmer Farmer wallet address
     * @param _dataHash SHA-256 hash of off-chain harvest data JSON
     * 
     * Can be called by:
     * - Farmer directly (if they have gas)
     * - Relayer on behalf of farmer (gasless meta-tx)
     */
    function logHarvest(
        address _farmer,
        bytes32 _dataHash
    ) external returns (uint256) {
        require(_farmer != address(0), "Invalid farmer address");
        require(_dataHash != bytes32(0), "Invalid data hash");
        
        uint256 recordId = recordCount++;
        records[recordId] = HarvestRecord({
            farmer: _farmer,
            dataHash: _dataHash,
            timestamp: uint64(block.timestamp),
            status: Status.Pending,
            payoutAmount: 0
        });

        emit HarvestLogged(recordId, _farmer, _dataHash);
        return recordId;
    }

    /**
     * @dev Relayer-submitted harvest log (meta-transaction pattern).
     * Farmer signs data off-chain, relayer submits on-chain.
     * @param _farmer Farmer wallet address (recovered from signature)
     * @param _dataHash Hash of harvest data
     * @param _signature Farmer's EIP-712 signature (verified off-chain by relayer)
     */
    function logHarvestMeta(
        address _farmer,
        bytes32 _dataHash,
        bytes calldata _signature
    ) external onlyRole(RELAYER_ROLE) returns (uint256) {
        // Signature verification happens in the relayer service
        // Contract trusts RELAYER_ROLE to only submit valid signatures
        return this.logHarvest(_farmer, _dataHash);
    }

    /**
     * @dev Verify harvest data after field agent inspection.
     */
    function verifyHarvest(
        uint256 _recordId, 
        bool _approved, 
        uint128 _payoutAmount
    ) external onlyRole(VERIFIER_ROLE) {
        HarvestRecord storage record = records[_recordId];
        require(record.status == Status.Pending, "Already processed");
        
        if (_approved) {
            record.status = Status.Verified;
            record.payoutAmount = _payoutAmount;
        } else {
            record.status = Status.Rejected;
        }

        emit HarvestVerified(_recordId, record.status, _payoutAmount);
    }

    // ============ Individual Payout ============

    /**
     * @dev Trigger immediate cUSD payout for a single harvest.
     * Use for urgent/priority payouts. For bulk, use batch functions.
     */
    function triggerPayout(uint256 _recordId) external onlyRole(DEFAULT_ADMIN_ROLE) {
        HarvestRecord storage record = records[_recordId];
        require(record.status == Status.Verified, "Not verified");
        require(record.payoutAmount > 0, "No payout amount");
        require(!claimed[_recordId], "Already paid");

        record.status = Status.Paid;
        claimed[_recordId] = true;
        
        require(cUSD.transfer(record.farmer, record.payoutAmount), "Transfer failed");

        emit PayoutTriggered(_recordId, record.farmer, record.payoutAmount);
    }

    // ============ Batch Payout (Merkle) ============

    /**
     * @dev Set a new Merkle root for batch payout claims.
     * Called by backend after aggregating verified harvests.
     * @param _merkleRoot Root of Merkle tree containing (recordId, farmer, amount) leaves
     * @param _totalRecords Number of records in this batch
     * @param _totalAmount Total cUSD for this batch (for logging)
     */
    function createBatchPayout(
        bytes32 _merkleRoot,
        uint256 _totalRecords,
        uint256 _totalAmount
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_merkleRoot != bytes32(0), "Invalid root");
        require(!processedRoots[_merkleRoot], "Root already used");
        
        currentMerkleRoot = _merkleRoot;
        processedRoots[_merkleRoot] = true;

        emit BatchPayoutCreated(_merkleRoot, _totalRecords, _totalAmount);
    }

    /**
     * @dev Farmer claims payout from a Merkle batch.
     * Alternatively, backend can call this on their behalf.
     * @param _recordId Harvest record ID
     * @param _amount Payout amount
     * @param _merkleProof Proof of inclusion in batch
     */
    function claimBatchPayout(
        uint256 _recordId,
        uint128 _amount,
        bytes32[] calldata _merkleProof
    ) external {
        HarvestRecord storage record = records[_recordId];
        require(record.status == Status.Verified, "Not verified");
        require(!claimed[_recordId], "Already claimed");
        
        // Verify Merkle proof (matches OZ StandardMerkleTree)
        bytes32 leaf = keccak256(bytes.concat(keccak256(abi.encode(_recordId, record.farmer, _amount))));
        require(
            MerkleProof.verify(_merkleProof, currentMerkleRoot, leaf),
            "Invalid proof"
        );

        record.status = Status.Paid;
        claimed[_recordId] = true;
        
        require(cUSD.transfer(record.farmer, _amount), "Transfer failed");

        emit PayoutClaimed(_recordId, record.farmer, _amount);
    }

    /**
     * @dev Batch distribute payouts directly (admin pays gas, no claims needed).
     * Most gas-efficient for small batches where claim overhead isn't worth it.
     * @param _recordIds Array of record IDs
     * @param _amounts Array of payout amounts
     */
    function batchDistribute(
        uint256[] calldata _recordIds,
        uint128[] calldata _amounts
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_recordIds.length == _amounts.length, "Length mismatch");
        require(_recordIds.length <= 50, "Max 50 per batch"); // Gas limit safety
        
        for (uint256 i = 0; i < _recordIds.length; i++) {
            uint256 recordId = _recordIds[i];
            HarvestRecord storage record = records[recordId];
            
            if (record.status != Status.Verified || claimed[recordId]) {
                continue; // Skip invalid/already claimed
            }
            
            record.status = Status.Paid;
            claimed[recordId] = true;
            
            require(cUSD.transfer(record.farmer, _amounts[i]), "Transfer failed");
            
            emit PayoutClaimed(recordId, record.farmer, _amounts[i]);
        }
    }

    // ============ View Functions ============

    /**
     * @dev Verify a data hash matches expected off-chain data.
     * Used by auditors/verifiers to confirm on-chain hash matches source data.
     */
    function verifyDataHash(
        uint256 _recordId,
        bytes32 _expectedHash
    ) external view returns (bool) {
        return records[_recordId].dataHash == _expectedHash;
    }

    /**
     * @dev Get record details.
     */
    function getRecord(uint256 _recordId) external view returns (
        address farmer,
        bytes32 dataHash,
        uint64 timestamp,
        Status status,
        uint128 payoutAmount,
        bool isPaid
    ) {
        HarvestRecord storage record = records[_recordId];
        return (
            record.farmer,
            record.dataHash,
            record.timestamp,
            record.status,
            record.payoutAmount,
            claimed[_recordId]
        );
    }
}
