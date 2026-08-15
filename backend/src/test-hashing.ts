import fs from "fs";
import { calculateFileHash } from "./hashing.js";

const filePath = "./test-data/evidence.txt";

const fileBuffer = fs.readFileSync(filePath);
const hash = calculateFileHash(fileBuffer);

console.log("File:", filePath);
console.log("Size:", fileBuffer.length, "bytes");
console.log("SHA-256:", hash);