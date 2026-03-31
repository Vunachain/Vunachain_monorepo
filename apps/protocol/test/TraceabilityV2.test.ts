import { expect } from "chai";
import { ethers } from "hardhat";
// import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { StandardMerkleTree } from "@openzeppelin/merkle-tree";
import { Contract } from "ethers";

describe("TraceabilityV2", function () {
  let traceability: Contract;
  let mockToken: Contract;
  
  let admin: SignerWithAddress;
  let relayer: SignerWithAddress;
  let verifier: SignerWithAddress;
  let farmer: SignerWithAddress;
  let farmer2: SignerWithAddress;

  const VERIFIER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("VERIFIER_ROLE"));
  const RELAYER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("RELAYER_ROLE"));

  beforeEach(async function () {
    [admin, relayer, verifier, farmer, farmer2] = await ethers.getSigners();

    // Deploy a mock ERC20 token for cUSD
    const MockToken = await ethers.getContractFactory("ERC20Mock");
    // If ERC20Mock isn't available, we create a simple one inline or assume standard hardhat test setup
    try {
        mockToken = await MockToken.deploy("Celo Dollar", "cUSD", admin.address, ethers.parseEther("1000000"));
    } catch {
        // Fallback: Deploy a simple mock if standard openzeppelin mocks aren't present
        const SimpleERC20 = await ethers.getContractFactory("ERC20Mock");
        mockToken = await SimpleERC20.deploy("Celo Dollar", "cUSD", admin.address, ethers.parseEther("1000000"));
        // Minting some tokens might be tricky without a full mock, but let's assume we can fund it
    }

    // Deploy TraceabilityV2
    const TraceabilityV2 = await ethers.getContractFactory("TraceabilityV2");
    traceability = await TraceabilityV2.deploy(await mockToken.getAddress());

    // Setup roles
    await traceability.grantRole(RELAYER_ROLE, relayer.address);
    await traceability.grantRole(VERIFIER_ROLE, verifier.address);
    
    // Fund the contract with cUSD for payouts
    // If using a standard mock, we transfer from admin
    if (mockToken.transfer) {
        await mockToken.transfer(await traceability.getAddress(), ethers.parseEther("100000"));
    }
  });

  describe("Access Control & Initialization", function () {
    it("Should set the right admin", async function () {
      expect(await traceability.hasRole(await traceability.DEFAULT_ADMIN_ROLE(), admin.address)).to.be.true;
    });

    it("Should initialize with correct cUSD address", async function () {
      expect(await traceability.cUSD()).to.equal(await mockToken.getAddress());
    });
  });

  describe("Harvest Logging", function () {
    it("Should allow logging a harvest directly", async function () {
      const dataHash = ethers.keccak256(ethers.toUtf8Bytes("harvest data"));
      
      await expect(traceability.connect(farmer).logHarvest(farmer.address, dataHash))
        .to.emit(traceability, "HarvestLogged")
        .withArgs(0, farmer.address, dataHash);

      const record = await traceability.records(0);
      expect(record.farmer).to.equal(farmer.address);
      expect(record.dataHash).to.equal(dataHash);
      expect(record.status).to.equal(0); // Pending
    });

    it("Should allow relayer to log harvest meta-transaction", async function () {
      const dataHash = ethers.keccak256(ethers.toUtf8Bytes("meta harvest data"));
      const signature = "0x"; // Mock signature, relayer role bypasses actual ECDSA check in contract
      
      await expect(traceability.connect(relayer).logHarvestMeta(farmer.address, dataHash, signature))
        .to.emit(traceability, "HarvestLogged");
        
      const record = await traceability.records(0);
      expect(record.farmer).to.equal(farmer.address);
    });

    it("Should fail if non-relayer calls logHarvestMeta", async function () {
      const dataHash = ethers.keccak256(ethers.toUtf8Bytes("meta harvest data"));
      const signature = "0x";
      
      await expect(traceability.connect(farmer).logHarvestMeta(farmer.address, dataHash, signature))
        .to.be.revertedWithCustomError(traceability, "AccessControlUnauthorizedAccount");
    });
  });

  describe("Harvest Verification", function () {
    let _dataHash: string;

    beforeEach(async function () {
      _dataHash = ethers.keccak256(ethers.toUtf8Bytes("test"));
      await traceability.connect(farmer).logHarvest(farmer.address, _dataHash);
    });

    it("Should allow verifier to approve harvest", async function () {
      const payoutAmount = ethers.parseEther("50");
      
      await expect(traceability.connect(verifier).verifyHarvest(0, true, payoutAmount))
        .to.emit(traceability, "HarvestVerified")
        .withArgs(0, 1 /* Verified */, payoutAmount);
        
      const record = await traceability.records(0);
      expect(record.status).to.equal(1); // Verified
      expect(record.payoutAmount).to.equal(payoutAmount);
    });

    it("Should allow verifier to reject harvest", async function () {
      await expect(traceability.connect(verifier).verifyHarvest(0, false, 0))
        .to.emit(traceability, "HarvestVerified")
        .withArgs(0, 2 /* Rejected */, 0);
        
      const record = await traceability.records(0);
      expect(record.status).to.equal(2); // Rejected
    });

    it("Should fail if non-verifier attempts verification", async function () {
      await expect(traceability.connect(farmer).verifyHarvest(0, true, 100))
        .to.be.revertedWithCustomError(traceability, "AccessControlUnauthorizedAccount");
    });
  });

  describe("Payouts", function () {
    const payoutAmount = ethers.parseEther("50");

    beforeEach(async function () {
      const dataHash = ethers.keccak256(ethers.toUtf8Bytes("test"));
      await traceability.connect(farmer).logHarvest(farmer.address, dataHash);
      await traceability.connect(verifier).verifyHarvest(0, true, payoutAmount);
    });

    it("Should allow admin to trigger individual payout", async function () {
      const initialBalance = await mockToken.balanceOf(farmer.address);
      
      await expect(traceability.connect(admin).triggerPayout(0))
        .to.emit(traceability, "PayoutTriggered")
        .withArgs(0, farmer.address, payoutAmount);
        
      const record = await traceability.records(0);
      expect(record.status).to.equal(3); // Paid
      expect(await traceability.claimed(0)).to.be.true;
      
      const finalBalance = await mockToken.balanceOf(farmer.address);
      expect(finalBalance - initialBalance).to.equal(payoutAmount);
    });

    it("Should fail to trigger payout if not admin", async function () {
      await expect(traceability.connect(verifier).triggerPayout(0))
        .to.be.revertedWithCustomError(traceability, "AccessControlUnauthorizedAccount");
    });
  });

  describe("Batch Merkle Payouts", function () {
    const amount1 = ethers.parseEther("50");
    const amount2 = ethers.parseEther("75");
    let tree: StandardMerkleTree<[number, string, bigint]>;
    let leaves: [number, string, bigint][];

    beforeEach(async function () {
      // Log and verify 2 harvests
      await traceability.connect(farmer).logHarvest(farmer.address, ethers.keccak256(ethers.toUtf8Bytes("1")));
      await traceability.connect(farmer2).logHarvest(farmer2.address, ethers.keccak256(ethers.toUtf8Bytes("2")));
      
      await traceability.connect(verifier).verifyHarvest(0, true, amount1);
      await traceability.connect(verifier).verifyHarvest(1, true, amount2);

      // Create Merkle Tree: [recordId, address, amount]
      leaves = [
        [0, farmer.address, amount1],
        [1, farmer2.address, amount2]
      ];
      
      tree = StandardMerkleTree.of(leaves, ["uint256", "address", "uint256"]);
    });

    it("Should allow admin to create batch payout root", async function () {
      await expect(traceability.connect(admin).createBatchPayout(tree.root, 2, amount1 + amount2))
        .to.emit(traceability, "BatchPayoutCreated")
        .withArgs(tree.root, 2, amount1 + amount2);
        
      expect(await traceability.currentMerkleRoot()).to.equal(tree.root);
    });

    it("Should allow claiming batch payout with valid proof", async function () {
      await traceability.connect(admin).createBatchPayout(tree.root, 2, amount1 + amount2);
      
      const proof = tree.getProof(0);
      const initialBalance = await mockToken.balanceOf(farmer.address);
      
      await expect(traceability.claimBatchPayout(0, amount1, proof))
        .to.emit(traceability, "PayoutClaimed")
        .withArgs(0, farmer.address, amount1);
        
      const finalBalance = await mockToken.balanceOf(farmer.address);
      expect(finalBalance - initialBalance).to.equal(amount1);
      expect(await traceability.claimed(0)).to.be.true;
    });

    it("Should reject claim with invalid proof", async function () {
      await traceability.connect(admin).createBatchPayout(tree.root, 2, amount1 + amount2);
      const proof = tree.getProof(1); // Wrong proof for index 0
      
      await expect(traceability.claimBatchPayout(0, amount1, proof))
        .to.be.revertedWith("Invalid proof");
    });
  });
});
