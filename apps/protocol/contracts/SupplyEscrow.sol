// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title SupplyEscrow
 * @dev The "Trust-Link Engine" MVP contract.
 * Implements On-Chain Forward Contracts and instant Escrow payouts.
 */
contract SupplyEscrow is AccessControl, ReentrancyGuard {
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    
    IERC20 public immutable cUSD;
    
    struct ForwardContract {
        address buyer;           // e.g. An Off-taker or Cooperative
        address farmer;          // The underlying producer
        uint256 basePricePerKg;  // Locked price formula (in cUSD decimals)
        uint256 inputDebt;       // Total debt owed by farmer (in cUSD decimals)
        uint256 escrowBalance;   // Actual deposited funds locking this contract
        bool isActive;
    }
    
    // Contract ID -> Contract Details
    uint256 public contractCount;
    mapping(uint256 => ForwardContract) public contracts;

    // Events
    event ContractCreated(uint256 indexed contractId, address indexed buyer, address indexed farmer, uint256 basePrice, uint256 debt);
    event EscrowFunded(uint256 indexed contractId, address indexed buyer, uint256 amount);
    event PayoutExecuted(uint256 indexed contractId, address indexed farmer, uint256 netPayout, uint256 debtSubtracted, uint256 weightKg);
    
    constructor(address _cUSDToken) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(VERIFIER_ROLE, msg.sender);
        cUSD = IERC20(_cUSDToken);
    }

    /**
     * @dev Create an immutable Forward Contract.
     * Lock the price per Kg and input debt.
     */
    function createContract(
        address _buyer,
        address _farmer,
        uint256 _basePricePerKg,
        uint256 _inputDebt
    ) external onlyRole(DEFAULT_ADMIN_ROLE) returns (uint256) {
        require(_buyer != address(0) && _farmer != address(0), "Invalid addresses");
        
        uint256 contractId = contractCount++;
        
        contracts[contractId] = ForwardContract({
            buyer: _buyer,
            farmer: _farmer,
            basePricePerKg: _basePricePerKg,
            inputDebt: _inputDebt,
            escrowBalance: 0,
            isActive: true
        });
        
        emit ContractCreated(contractId, _buyer, _farmer, _basePricePerKg, _inputDebt);
        return contractId;
    }

    /**
     * @dev Buyer deposits cUSD to lock their commitment and fund the escrow.
     * Note: Buyer must call `cUSD.approve(address(this), _amount)` first.
     */
    function fundEscrow(uint256 _contractId, uint256 _amount) external nonReentrant {
        ForwardContract storage fContract = contracts[_contractId];
        require(fContract.isActive, "Contract not active");
        require(msg.sender == fContract.buyer || hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Not authorized to fund");
        
        require(cUSD.transferFrom(msg.sender, address(this), _amount), "cUSD transfer failed");
        
        fContract.escrowBalance += _amount;
        
        emit EscrowFunded(_contractId, msg.sender, _amount);
    }
    
    /**
     * @dev The "Killer Feature". Digital Proof of Delivery immediately triggers payout.
     * Authenticated verifier (Field Agent App) logs delivery, contract calculates and deducts debt, then pays farmer.
     */
    function executeHarvestPayout(
        uint256 _contractId,
        uint256 _weightKg
    ) external onlyRole(VERIFIER_ROLE) nonReentrant {
        ForwardContract storage fContract = contracts[_contractId];
        require(fContract.isActive, "Contract not active");
        
        uint256 grossPayout = _weightKg * fContract.basePricePerKg;
        uint256 remainingDebt = fContract.inputDebt;
        
        uint256 netPayout = 0;
        uint256 debtDeducted = 0;
        
        // Subtract debt
        if (grossPayout >= remainingDebt) {
            netPayout = grossPayout - remainingDebt;
            debtDeducted = remainingDebt;
            fContract.inputDebt = 0; // Debt fully recovered
        } else {
            netPayout = 0;
            debtDeducted = grossPayout;
            fContract.inputDebt = remainingDebt - grossPayout; // Remaining debt carries over
        }
        
        // Ensure Escrow has funds!
        uint256 totalEscrowNeeded = netPayout;
        require(fContract.escrowBalance >= totalEscrowNeeded, "Insufficient Escrow Funds");
        
        fContract.escrowBalance -= totalEscrowNeeded;
        
        // Transfer the net amount natively to the Farmer's wallet
        if (netPayout > 0) {
            require(cUSD.transfer(fContract.farmer, netPayout), "Farmer transfer failed");
        }
        
        // (Optional Feature: Transfer the `debtDeducted` back to the cooperative/bank address. 
        // For MVP, if the buyer is the coop, we just keep it in escrow or send it to the buyer).
        if (debtDeducted > 0) {
            require(cUSD.transfer(fContract.buyer, debtDeducted), "Debt recovery transfer failed");
        }
        
        emit PayoutExecuted(_contractId, fContract.farmer, netPayout, debtDeducted, _weightKg);
    }
    
    /**
     * @dev Cancel contract and refund remaining escrow to buyer.
     */
    function cancelContract(uint256 _contractId) external onlyRole(DEFAULT_ADMIN_ROLE) nonReentrant {
        ForwardContract storage fContract = contracts[_contractId];
        require(fContract.isActive, "Already inactive");
        
        fContract.isActive = false;
        uint256 refundAmount = fContract.escrowBalance;
        
        if (refundAmount > 0) {
            fContract.escrowBalance = 0;
            require(cUSD.transfer(fContract.buyer, refundAmount), "Refund failed");
        }
    }
}
