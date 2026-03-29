import { hre } from "hardhat";

async function main() {
    const cUSDAddress = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1"; // Alfajores

    console.log("Deploying Traceability contract...");

    const traceability = await (hre as any).viem.deployContract("Traceability", [cUSDAddress]);

    console.log(`Traceability deployed to: ${traceability.address}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
