import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  // Protocol wallet receives 3% launchpad fee on every Corpus Genesis
  const protocolWallet = process.env.VANTAGE_PROTOCOL_WALLET ?? deployer.address;
  console.log("Protocol wallet:", protocolWallet);

  // 1. Deploy VantageRegistry
  console.log("\nDeploying VantageRegistry...");
  const Registry = await ethers.getContractFactory("VantageRegistry");
  const registry = await Registry.deploy(protocolWallet);
  await registry.waitForDeployment();
  const registryAddr = await registry.getAddress();
  console.log("VantageRegistry deployed to:", registryAddr);

  // 2. Deploy VantageNameService (linked to Registry)
  console.log("\nDeploying VantageNameService...");
  const NameService = await ethers.getContractFactory("VantageNameService");
  const nameService = await NameService.deploy(registryAddr);
  await nameService.waitForDeployment();
  const nameServiceAddr = await nameService.getAddress();
  console.log("VantageNameService deployed to:", nameServiceAddr);

  console.log("\n--- Deployment Summary ---");
  console.log(`NEXT_PUBLIC_ARC_REGISTRY_ADDRESS=${registryAddr}`);
  console.log(`NEXT_PUBLIC_ARC_NAME_SERVICE_ADDRESS=${nameServiceAddr}`);
  console.log(`VANTAGE_PROTOCOL_WALLET=${protocolWallet}`);
  console.log(`Network: Arc Testnet (chainId: 5042002)`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
