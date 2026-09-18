export const CONTRACT_ADDRESS = "0xbeDeFB98AB802E8a99a4d5F8f7D26c28242d890f"

export const CONTRACT_ABI = [
  "function registerEvidence(string fileHash, string firNumber) external",
  "function verifyEvidence(string fileHash) external view returns (bool)",
  "function getEvidence(string fileHash) external view returns (string firNumber, uint256 timestamp, address uploadedBy)",
  "event EvidenceRegistered(string indexed fileHash, string firNumber, address indexed uploadedBy, uint256 timestamp)",
]
