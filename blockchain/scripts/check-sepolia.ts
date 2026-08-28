import "dotenv/config";
import { ethers } from "ethers";

async function main() {
  const rpcUrl = process.env.SEPOLIA_RPC_URL;
  const privateKey = process.env.SEPOLIA_PRIVATE_KEY;

  if (!rpcUrl || !privateKey) {
    throw new Error("SEPOLIA_RPC_URL or SEPOLIA_PRIVATE_KEY is missing");
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);

  console.log("Wallet:", wallet.address);

  const network = await provider.getNetwork();
  console.log("Chain ID:", network.chainId.toString());

  const balance = await provider.getBalance(wallet.address);
  console.log("Sepolia ETH:", ethers.formatEther(balance));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});