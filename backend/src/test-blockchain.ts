import { registerEvidenceOnBlockchain } from "./blockchain.js";

const fileHash =
  "14bbf5a04aff12d777155d034f032efb0e471926478a79782513c5f9274eb6cf";

const firNumber = "FIR-2026-15196042";

async function main() {
  try {
    const result = await registerEvidenceOnBlockchain(
      fileHash,
      firNumber
    );

    console.log("\nBlockchain registration successful:");
    console.log(result);
  } catch (error) {
    console.error("\nBlockchain registration failed:");
    console.error(error);
    process.exit(1);
  }
}

main();