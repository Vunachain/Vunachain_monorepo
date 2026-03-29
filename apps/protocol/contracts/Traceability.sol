// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title Traceability
 * @dev Secure logging of harvest data and automated cUSD payouts for Vunachain.
 */
contract Traceability is AccessControl {
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    
    IERC20 public immutable cUSD;

    enum Status { Pending, Verified, Rejected, Paid }

    struct HarvestRecord {
        address farmer;
        string farmerId; // External UUID from Vunachain Backend
        string cropType;
        uint256 weightKg;
        string location; // Lat/Long string or Geohash
        uint256 timestamp;
        Status status;
        uint256 payoutAmount;
    }

    uint256 public recordCount;
    mapping(uint256 => HarvestRecord) public records;

    event HarvestLogged(uint256 indexed recordId, address indexed farmer, string farmerId);
    event HarvestVerified(uint256 indexed recordId, Status status);
    event PayoutTriggered(uint256 indexed recordId, address indexed farmer, uint256 amount);

    constructor(address _cUSDToken) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        cUSD = IERC20(_cUSDToken);
    }

    /**
     * @dev Farmers or Field Agents log a new harvest.
     */
    function logHarvest(
        address _farmer,
        string memory _farmerId,
        string memory _cropType,
        uint256 _weightKg,
        string memory _location
    ) external returns (uint256) {
        uint256 recordId = recordCount++;
        records[recordId] = HarvestRecord({
            farmer: _farmer,
            farmerId: _farmerId,
            cropType: _cropType,
            weightKg: _weightKg,
            location: _location,
            timestamp: block.timestamp,
            status: Status.Pending,
            payoutAmount: 0
        });

        emit HarvestLogged(recordId, _farmer, _farmerId);
        return recordId;
    }

    /**
     * @dev Field Agents verify the harvest data.
     */
    function verifyHarvest(uint256 _recordId, bool _approved, uint256 _payoutAmount) external onlyRole(VERIFIER_ROLE) {
        require(records[_recordId].status == Status.Pending, "Record already processed");
        
        if (_approved) {
            records[_recordId].status = Status.Verified;
            records[_recordId].payoutAmount = _payoutAmount;
        } else {
            records[_recordId].status = Status.Rejected;
        }

        emit HarvestVerified(_recordId, records[_recordId].status);
    }

    /**
     * @dev Execute cUSD payout to the farmer. Requires contract to have cUSD balance.
     */
    function triggerPayout(uint256 _recordId) external onlyRole(DEFAULT_ADMIN_ROLE) {
        HarvestRecord storage record = records[_recordId];
        require(record.status == Status.Verified, "Harvest must be verified");
        require(record.payoutAmount > 0, "No payout amount set");

        record.status = Status.Paid;
        
        require(cUSD.transfer(record.farmer, record.payoutAmount), "cUSD transfer failed");

        emit PayoutTriggered(_recordId, record.farmer, record.payoutAmount);
    }

}
