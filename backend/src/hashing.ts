import crypto from "crypto";

export function calculateFileHash(file: Buffer): string {
  return crypto
    .createHash("sha256")
    .update(file)
    .digest("hex");
}