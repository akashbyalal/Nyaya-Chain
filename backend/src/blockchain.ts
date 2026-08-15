import "dotenv/config";
import { Contract, JsonRpcProvider, Wallet } from "ethers";
import { z } from "zod";

const env = z.object({
  SEPOLIA_RPC_URL: z.string().url(),
  SEPOLIA_PRIVATE_KEY: z.string().min(1),
}).parse(process.env);

const CONTRACT_ADDRESS =
  "0xbeDeFB98AB802E8a99a4d5F8f7D26c28242d890f";

const CONTRACT_ABI = [
  "function registerEvidence(string memory fileHash, string memory firNumber) public",
  "function verifyEvidence(string memory fileHash) public view returns (bool)",
  "function getEvidence(string memory fileHash) public view returns (string memory firNumber, uint256 timestamp, address uploadedBy)",
];

const provider = new JsonRpcProvider(env.SEPOLIA_RPC_URL);

const wallet = new Wallet(
  env.SEPOLIA_PRIVATE_KEY,
  provider
);

const contract = new Contract(
  CONTRACT_ADDRESS,
  CONTRACT_ABI,
  wallet
);

export async function registerEvidenceOnBlockchain(
  fileHash: string,
  firNumber: string
) {
  console.log("Registering evidence on Sepolia...");
  console.log("FIR:", firNumber);
  console.log("Hash:", fileHash);

  const transaction = await contract.registerEvidence(
    fileHash,
    firNumber
  );

  console.log("Transaction submitted:", transaction.hash);

  const receipt = await transaction.wait();

  console.log("Transaction confirmed:", receipt?.hash);

  return {
    transactionHash: transaction.hash,
    blockNumber: receipt?.blockNumber,
  };
}

export async function verifyEvidenceOnBlockchain(
  fileHash: string
) {
  const exists = await contract.verifyEvidence(fileHash);

  if (!exists) {
    return {
      exists: false,
      firNumber: null,
      timestamp: null,
      uploadedBy: null,
    };
  }

  const evidence = await contract.getEvidence(fileHash);

  return {
    exists: true,
    firNumber: evidence[0] as string,
    timestamp: evidence[1].toString(),
    uploadedBy: evidence[2] as string,
  };
}
