package main

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
)

type ChainEvidence struct {
	Exists     bool   `json:"exists"`
	FIRNumber  string `json:"firNumber"`
	Timestamp  string `json:"timestamp"`
	UploadedBy string `json:"uploadedBy"`
}

type ReplayAttempt struct {
	Reverted bool   `json:"reverted"`
	TxHash   string `json:"txHash"`
	Error    string `json:"error"`
}

const ethersScript = `import { Contract, FetchRequest, JsonRpcProvider, Wallet } from "ethers";
const abi = [
  "function registerEvidence(string fileHash, string firNumber) public",
  "function verifyEvidence(string fileHash) public view returns (bool)",
  "function getEvidence(string fileHash) public view returns (string firNumber, uint256 timestamp, address uploadedBy)"
];
try {
  const rpcRequest = new FetchRequest(process.env.NYAYA_TEST_RPC_URL);
  rpcRequest.timeout = 10000;
  const provider = new JsonRpcProvider(rpcRequest);
  const wallet = new Wallet(process.env.NYAYA_TEST_PRIVATE_KEY, provider);
  const contract = new Contract(process.env.NYAYA_TEST_CONTRACT, abi, wallet);
  const operation = process.argv[1];
  const hash = process.argv[2];
  if (operation === "verify") {
    const exists = await contract.verifyEvidence(hash);
    if (!exists) console.log(JSON.stringify({exists: false}));
    else {
      const item = await contract.getEvidence(hash);
      console.log(JSON.stringify({exists: true, firNumber: item[0], timestamp: item[1].toString(), uploadedBy: item[2]}));
    }
  } else if (operation === "replay") {
    const firNumber = process.argv[3];
    let txHash = "";
    try {
      const tx = await contract.registerEvidence(hash, firNumber, {gasLimit: 200000});
      txHash = tx.hash;
      await tx.wait();
      console.log(JSON.stringify({reverted: false, txHash}));
    } catch (error) {
      txHash = txHash || error?.transaction?.hash || error?.receipt?.hash || "";
      const reason = error?.reason || error?.shortMessage || error?.message || "transaction failed";
      const reverted = error?.receipt?.status === 0 || error?.receipt?.status === 0n;
      console.log(JSON.stringify({reverted, txHash, error: String(reason).slice(0, 500)}));
    }
  }
  await provider.destroy();
} catch (error) {
  console.log(JSON.stringify({error: String(error?.shortMessage || error?.message || "blockchain request failed").slice(0, 500)}));
  process.exitCode = 1;
}`

func runEthereum(ctx context.Context, cfg Config, operation, hash, firNumber string) (json.RawMessage, error) {
	if cfg.SepoliaRPCURL == "" || cfg.SepoliaPrivateKey == "" {
		return nil, fmt.Errorf("SEPOLIA_RPC_URL and SEPOLIA_PRIVATE_KEY are required")
	}
	backendDir := filepath.Clean(filepath.Join("..", "backend"))
	if _, err := os.Stat(filepath.Join(backendDir, "node_modules", "ethers")); err != nil {
		return nil, fmt.Errorf("ethers is unavailable in backend/node_modules; install backend dependencies")
	}
	cmd := exec.CommandContext(ctx, "node", "--input-type=module", "-e", ethersScript, operation, hash, firNumber)
	cmd.Dir = backendDir
	cmd.Env = append(os.Environ(),
		"NYAYA_TEST_RPC_URL="+cfg.SepoliaRPCURL,
		"NYAYA_TEST_PRIVATE_KEY="+cfg.SepoliaPrivateKey,
		"NYAYA_TEST_CONTRACT="+EvidenceRegistryAddress,
	)
	output, err := cmd.Output()
	if err != nil {
		// Command errors can contain invocation details; deliberately omit them.
		if ctx.Err() != nil {
			return nil, fmt.Errorf("blockchain operation timed out")
		}
		return nil, fmt.Errorf("blockchain operation failed; check Sepolia RPC configuration and connectivity")
	}
	line := strings.TrimSpace(string(output))
	start := strings.LastIndex(line, "\n")
	if start >= 0 {
		line = line[start+1:]
	}
	if !json.Valid([]byte(line)) {
		return nil, fmt.Errorf("blockchain helper returned an invalid response")
	}
	var envelope map[string]json.RawMessage
	if err := json.Unmarshal([]byte(line), &envelope); err != nil {
		return nil, fmt.Errorf("decode blockchain response: %w", err)
	}
	if rawErr, ok := envelope["error"]; ok {
		if operation == "replay" {
			if _, hasReplayOutcome := envelope["reverted"]; hasReplayOutcome {
				return json.RawMessage(line), nil
			}
		}
		var message string
		_ = json.Unmarshal(rawErr, &message)
		return json.RawMessage(line), fmt.Errorf("blockchain operation: %s", message)
	}
	return json.RawMessage(line), nil
}
