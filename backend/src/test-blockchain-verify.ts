import "dotenv/config";
import { Contract, JsonRpcProvider } from "ethers";
import { z } from "zod";

const env = z.object({
  SEPOLIA_RPC_URL: z.string().url(),
}).parse(process.env);

const CONTRACT_ADDRESS =
  "0xbeDeFB98AB802E8a99a4d5F8f7D26c28242d890f";

const CONTRACT_ABI = [
  "function verifyEvidence(string memory fileHash) public view returns (bool)",
  "function getEvidence(string memory fileHash) public view returns (string memory firNumber, uint256 timestamp, address uploadedBy)",
];

const provider = new JsonRpcProvider(env.SEPOLIA_RPC_URL);

const contract = new Contract(
  CONTRACT_ADDRESS,
  CONTRACT_ABI,
  provider
);

const fileHash =
  "14bbf5a04aff12d777155d034f032efb0e471926478a79782513c5f9274eb6cf";

async function main() {
  const exists = await contract.verifyEvidence(fileHash);

  console.log("Evidence exists on blockchain:", exists);

  if (!exists) {
    console.log("ERROR: Evidence was not found.");
    return;
  }

  const evidence = await contract.getEvidence(fileHash);

  console.log("\nBlockchain evidence record:");
  console.log("FIR Number:", evidence[0]);
  console.log("Timestamp:", evidence[1].toString());
  console.log("Uploaded By:", evidence[2]);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});