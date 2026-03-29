import { hre } from "hardhat";

async function main() {
    // Alfajores Testnet cUSD Token Address
    const cUSDAddress = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1"; 

    console.log("Deploying SupplyEscrow contract for Vunachain MVC...");

    // Assuming viem plugin is configured based on the original deploy script
    const supplyEscrow = await (hre as any).viem.deployContract("SupplyEscrow", [cUSDAddress]);

    console.log(`✅ SupplyEscrow deployed successfully to: ${supplyEscrow.address}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
