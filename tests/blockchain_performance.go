package main

import (
	"bufio"
	"context"
	"crypto/sha256"
	"encoding/csv"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"math/big"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
	"sync"
	"time"
)

var blockchainLevels = []int{10, 50, 100, 500, 1000}

const maximumConcurrentTransactions = 100

type chainPreflight struct {
	ChainID      string `json:"chainId"`
	BalanceWei   string `json:"balanceWei"`
	FeeWei       string `json:"feeWei"`
	EstimatedGas string `json:"estimatedGas"`
	BlockNumber  int64  `json:"blockNumber"`
}

type blockchainTrial struct {
	Concurrency      int    `json:"concurrency"`
	TransactionIndex int    `json:"transactionIndex"`
	SubmittedAt      string `json:"submittedAt"`
	ConfirmationAt   string `json:"confirmationAt"`
	LatencyMS        string `json:"latencyMs"`
	TransactionHash  string `json:"transactionHash"`
	BlockNumber      string `json:"blockNumber"`
	GasUsed          string `json:"gasUsed"`
	Success          bool   `json:"success"`
	Error            string `json:"error"`
}

type blockchainBatch struct {
	ElapsedMS float64           `json:"elapsedMs"`
	Results   []blockchainTrial `json:"results"`
}

type blockchainWorkItem struct {
	Index    int    `json:"index"`
	FileHash string `json:"fileHash"`
	FIR      string `json:"firNumber"`
}

const blockchainNodeScript = `import fs from "node:fs";
import http from "node:http";
import { Contract, FetchRequest, JsonRpcProvider, Wallet, NonceManager } from "ethers";
const input = JSON.parse(fs.readFileSync(0, "utf8"));
const abi = ["function registerEvidence(string fileHash, string firNumber) public"];
function safeError(error) {
  const value = String(error?.reason || error?.shortMessage || error?.code || "transaction failed");
  return value.replace(/https?:\/\/[^\s]+/g, "[RPC endpoint redacted]").slice(0, 300);
}
const rpcRequest = new FetchRequest(process.env.NYAYA_TEST_RPC_URL);
rpcRequest.timeout = 10000;
const provider = new JsonRpcProvider(rpcRequest);
try {
  const wallet = new Wallet(process.env.NYAYA_TEST_PRIVATE_KEY, provider);
  if (input.operation === "preflight") {
    const [network, balance, feeData, blockNumber, estimatedGas] = await Promise.all([
      provider.getNetwork(), provider.getBalance(wallet.address), provider.getFeeData(), provider.getBlockNumber(),
      new Contract(process.env.NYAYA_TEST_CONTRACT, abi, wallet).registerEvidence.estimateGas(input.sampleHash, input.sampleFIR)
    ]);
    const fee = feeData.maxFeePerGas ?? feeData.gasPrice;
    if (fee == null) throw new Error("RPC did not return a usable fee quote");
    console.log(JSON.stringify({chainId: network.chainId.toString(), balanceWei: balance.toString(), feeWei: fee.toString(), estimatedGas: estimatedGas.toString(), blockNumber}));
  } else if (input.operation === "benchmark") {
    const signer = new NonceManager(wallet);
    const contract = new Contract(process.env.NYAYA_TEST_CONTRACT, abi, signer);
    const server = http.createServer(async (request, response) => {
      if (request.method === "POST" && request.url === "/shutdown") {
        response.writeHead(200); response.end("stopping");
        server.close(async () => { await provider.destroy(); process.exit(0); });
        return;
      }
      if (request.method !== "POST" || request.url !== "/transaction") { response.writeHead(404); response.end(); return; }
      const chunks = [];
      for await (const chunk of request) chunks.push(chunk);
      let item;
      try { item = JSON.parse(Buffer.concat(chunks).toString("utf8")); }
      catch { response.writeHead(400); response.end(JSON.stringify({error:"invalid local benchmark request"})); return; }
      let tx; let receipt; let submittedAt = ""; let message = "";
      try {
        tx = await contract.registerEvidence(item.fileHash, item.firNumber, {gasLimit: BigInt(input.gasLimit)});
        submittedAt = new Date().toISOString();
        receipt = await tx.wait(1, 120000);
        if (!receipt) message = "confirmation receipt unavailable";
        else if (Number(receipt.status) !== 1) message = "transaction receipt status was not successful";
      } catch (error) {
        receipt = error?.receipt ?? null;
        message = safeError(error);
      }
      const confirmed = Boolean(receipt && Number(receipt.status) === 1);
      response.writeHead(200, {"content-type":"application/json"});
      response.end(JSON.stringify({
        concurrency: input.concurrency, transactionIndex: item.index,
        submittedAt, confirmationAt: confirmed ? new Date().toISOString() : "",
        latencyMs: confirmed && submittedAt ? String(Date.now() - Date.parse(submittedAt)) : "",
        transactionHash: tx?.hash || receipt?.hash || "",
        blockNumber: receipt?.blockNumber == null ? "" : String(receipt.blockNumber),
        gasUsed: receipt?.gasUsed == null ? "" : String(receipt.gasUsed),
        success: confirmed, error: message
      }));
    });
    server.listen(0, "127.0.0.1", () => console.log(JSON.stringify({ready:true,port:server.address().port})));
  }
} catch (error) {
  console.log(JSON.stringify({error: safeError(error)}));
  process.exitCode = 1;
} finally {
  if (input.operation !== "benchmark") await provider.destroy();
}`

func RunBlockchainTests() {
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Hour)
	defer cancel()
	cfg, err := LoadConfig()
	if err != nil {
		fmt.Fprintf(os.Stderr, "Blockchain benchmark not run: %v\n", err)
		return
	}
	if cfg.SepoliaRPCURL == "" || cfg.SepoliaPrivateKey == "" {
		fmt.Fprintln(os.Stderr, "Blockchain benchmark not run: SEPOLIA_RPC_URL and SEPOLIA_PRIVATE_KEY are required")
		writeBlockchainNotRun("missing Sepolia configuration")
		return
	}
	preflight, err := runBlockchainPreflight(ctx, cfg)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Blockchain RPC preflight failed: %v\n", err)
		writeBlockchainNotRun("RPC preflight failed: " + err.Error())
		return
	}
	if preflight.ChainID != "11155111" {
		writeBlockchainNotRun("configured RPC is not Sepolia (chain ID " + preflight.ChainID + ")")
		fmt.Fprintln(os.Stderr, "Blockchain benchmark stopped: configured RPC is not Sepolia")
		return
	}
	remainingWei, okBalance := new(big.Int).SetString(preflight.BalanceWei, 10)
	feeBig, okFee := new(big.Int).SetString(preflight.FeeWei, 10)
	gasBig, okGas := new(big.Int).SetString(preflight.EstimatedGas, 10)
	if !okBalance || !okFee || !okGas {
		writeBlockchainNotRun("RPC returned invalid balance or gas preflight values")
		return
	}
	reserve := big.NewInt(1000000000000000) // 0.001 Sepolia ETH retained as a safety reserve.
	gasLimit := gasBig.Uint64()
	if gasLimit == 0 {
		writeBlockchainNotRun("RPC returned a zero gas estimate")
		return
	}

	rows := make([]blockchainSummaryRow, 0, len(blockchainLevels))
	var allTrials []blockchainTrial
	stopReason := ""
	for _, level := range blockchainLevels {
		if level > maximumConcurrentTransactions {
			rows = append(rows, blockchainSummaryRow{Concurrency: level, Notes: fmt.Sprintf("NOT RUN: concurrency capped at %d to avoid overwhelming the configured RPC provider", maximumConcurrentTransactions)})
			continue
		}
		if stopReason != "" {
			rows = append(rows, blockchainSummaryRow{Concurrency: level, Notes: "NOT RUN after an earlier level failed: " + stopReason})
			continue
		}
		cost := new(big.Int).Mul(big.NewInt(int64(level)), gasBig)
		cost.Mul(cost, feeBig)
		cost.Mul(cost, big.NewInt(2)) // 2x estimated gas-price headroom.
		if new(big.Int).Add(cost, reserve).Cmp(remainingWei) > 0 {
			stopReason = "insufficient conservative balance for next level while retaining a reserve"
			rows = append(rows, blockchainSummaryRow{Concurrency: level, Notes: "NOT RUN: " + stopReason})
			continue
		}
		items := make([]blockchainWorkItem, level)
		for i := range items {
			seed, err := randomID()
			if err != nil {
				stopReason = "could not generate unique transaction identifiers"
				break
			}
			hash := sha256.Sum256([]byte("nyaya-chain-table9-" + seed))
			items[i] = blockchainWorkItem{Index: i + 1, FileHash: hex.EncodeToString(hash[:]), FIR: fmt.Sprintf("NYAYA-T9-%d-%s", level, strings.ToUpper(seed[:8]))}
		}
		if stopReason != "" {
			rows = append(rows, blockchainSummaryRow{Concurrency: level, Notes: stopReason})
			continue
		}
		batch, err := runBlockchainBatch(ctx, cfg, level, gasLimit, items)
		if err != nil {
			stopReason = err.Error()
			rows = append(rows, blockchainSummaryRow{Concurrency: level, Notes: "FAILED before results could be decoded: " + stopReason})
			continue
		}
		allTrials = append(allTrials, batch.Results...)
		row := summarizeBlockchainBatch(level, batch)
		rows = append(rows, row)
		for _, trial := range batch.Results {
			if used, err := strconv.ParseUint(trial.GasUsed, 10, 64); err == nil {
				remainingWei.Sub(remainingWei, new(big.Int).Mul(new(big.Int).SetUint64(used), feeBig))
			}
			if !trial.Success {
				stopReason = "a transaction failed at this level; larger levels were not attempted"
			}
		}
	}
	if err := writeBlockchainResults(allTrials, rows, preflight); err != nil {
		fmt.Fprintf(os.Stderr, "Could not write blockchain benchmark files: %v\n", err)
		return
	}
	fmt.Println("Blockchain results: results/blockchain_results.csv")
	fmt.Println("Blockchain summary: results/blockchain_summary.txt")
	for _, row := range rows {
		fmt.Printf("Concurrency %d: attempted=%d successful=%d failed=%d %s\n", row.Concurrency, row.Transactions, row.Successful, row.Failed, row.Notes)
	}
}

func registrationBudgetPreflight(ctx context.Context, cfg Config, transactionCount int) error {
	preflight, err := runBlockchainPreflight(ctx, cfg)
	if err != nil {
		return fmt.Errorf("Sepolia RPC preflight failed: %w", err)
	}
	if preflight.ChainID != "11155111" {
		return fmt.Errorf("configured RPC is not Sepolia")
	}
	balance, okBalance := new(big.Int).SetString(preflight.BalanceWei, 10)
	fee, okFee := new(big.Int).SetString(preflight.FeeWei, 10)
	gas, okGas := new(big.Int).SetString(preflight.EstimatedGas, 10)
	if !okBalance || !okFee || !okGas {
		return fmt.Errorf("RPC returned invalid balance or fee data")
	}
	budget := new(big.Int).Mul(big.NewInt(int64(transactionCount)), gas)
	budget.Mul(budget, fee)
	budget.Mul(budget, big.NewInt(2))
	budget.Add(budget, big.NewInt(1000000000000000))
	if budget.Cmp(balance) > 0 {
		return fmt.Errorf("insufficient conservative Sepolia balance for %d registration transactions while retaining a 0.001 ETH reserve", transactionCount)
	}
	return nil
}

func runBlockchainPreflight(ctx context.Context, cfg Config) (chainPreflight, error) {
	seed, err := randomID()
	if err != nil {
		return chainPreflight{}, err
	}
	hash := sha256.Sum256([]byte("nyaya-chain-preflight-" + seed))
	payload := map[string]any{"operation": "preflight", "sampleHash": hex.EncodeToString(hash[:]), "sampleFIR": "NYAYA-PREFLIGHT-" + seed[:8]}
	data, err := callBlockchainNode(ctx, cfg, payload)
	if err != nil {
		return chainPreflight{}, err
	}
	var result chainPreflight
	if err := json.Unmarshal(data, &result); err != nil {
		return result, err
	}
	return result, nil
}

func runBlockchainBatch(ctx context.Context, cfg Config, concurrency int, gasLimit uint64, items []blockchainWorkItem) (blockchainBatch, error) {
	payload := map[string]any{"operation": "benchmark", "concurrency": concurrency, "gasLimit": gasLimit}
	encoded, err := json.Marshal(payload)
	if err != nil {
		return blockchainBatch{}, err
	}
	backendDir := filepath.Clean(filepath.Join("..", "backend"))
	cmd := exec.CommandContext(ctx, "node", "--input-type=module", "-e", blockchainNodeScript)
	cmd.Dir = backendDir
	cmd.Stdin = strings.NewReader(string(encoded))
	cmd.Env = append(os.Environ(), "NYAYA_TEST_RPC_URL="+cfg.SepoliaRPCURL, "NYAYA_TEST_PRIVATE_KEY="+cfg.SepoliaPrivateKey, "NYAYA_TEST_CONTRACT="+EvidenceRegistryAddress)
	stdout, err := cmd.StdoutPipe()
	if err != nil {
		return blockchainBatch{}, err
	}
	if err := cmd.Start(); err != nil {
		return blockchainBatch{}, fmt.Errorf("start blockchain helper")
	}
	scanner := bufio.NewScanner(stdout)
	if !scanner.Scan() {
		_ = cmd.Wait()
		if ctx.Err() != nil {
			return blockchainBatch{}, fmt.Errorf("blockchain worker startup timed out")
		}
		return blockchainBatch{}, fmt.Errorf("blockchain worker could not start")
	}
	var ready struct {
		Ready bool `json:"ready"`
		Port  int  `json:"port"`
	}
	if err := json.Unmarshal(scanner.Bytes(), &ready); err != nil || !ready.Ready || ready.Port == 0 {
		_ = cmd.Process.Kill()
		_ = cmd.Wait()
		return blockchainBatch{}, fmt.Errorf("blockchain worker did not provide a local endpoint")
	}
	localClient := &http.Client{Timeout: 150 * time.Second}
	started := time.Now()
	jobs := make(chan blockchainWorkItem)
	results := make([]blockchainTrial, len(items))
	var workers sync.WaitGroup
	workerCount := min(concurrency, len(items))
	for worker := 0; worker < workerCount; worker++ {
		workers.Add(1)
		go func() {
			defer workers.Done()
			for item := range jobs {
				requestBody, _ := json.Marshal(item)
				req, reqErr := http.NewRequestWithContext(ctx, http.MethodPost, fmt.Sprintf("http://127.0.0.1:%d/transaction", ready.Port), strings.NewReader(string(requestBody)))
				result := blockchainTrial{Concurrency: concurrency, TransactionIndex: item.Index}
				if reqErr != nil {
					result.Error = "create local benchmark request failed"
					results[item.Index-1] = result
					continue
				}
				req.Header.Set("Content-Type", "application/json")
				resp, doErr := localClient.Do(req)
				if doErr != nil {
					result.Error = "local transaction worker request failed or timed out"
					results[item.Index-1] = result
					continue
				}
				body, readErr := io.ReadAll(resp.Body)
				resp.Body.Close()
				if readErr != nil || resp.StatusCode != http.StatusOK {
					result.Error = "local transaction worker returned an invalid response"
					results[item.Index-1] = result
					continue
				}
				if err := json.Unmarshal(body, &result); err != nil {
					result.Error = "decode transaction outcome failed"
				}
				results[item.Index-1] = result
			}
		}()
	}
	for _, item := range items {
		jobs <- item
	}
	close(jobs)
	workers.Wait()
	elapsed := time.Since(started)
	stopReq, _ := http.NewRequest(http.MethodPost, fmt.Sprintf("http://127.0.0.1:%d/shutdown", ready.Port), nil)
	if stopReq != nil {
		if resp, err := localClient.Do(stopReq); err == nil {
			resp.Body.Close()
		}
	}
	if err := cmd.Wait(); err != nil && ctx.Err() != nil {
		return blockchainBatch{}, fmt.Errorf("blockchain worker stopped by context")
	}
	return blockchainBatch{ElapsedMS: float64(elapsed.Nanoseconds()) / 1e6, Results: results}, nil
}

func callBlockchainNode(ctx context.Context, cfg Config, payload any) ([]byte, error) {
	root, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}
	backendDir := filepath.Clean(filepath.Join("..", "backend"))
	if _, err := os.Stat(filepath.Join(backendDir, "node_modules", "ethers")); err != nil {
		return nil, fmt.Errorf("ethers is unavailable in backend/node_modules")
	}
	cmd := exec.CommandContext(ctx, "node", "--input-type=module", "-e", blockchainNodeScript)
	cmd.Dir = backendDir
	cmd.Stdin = strings.NewReader(string(root))
	cmd.Env = append(os.Environ(), "NYAYA_TEST_RPC_URL="+cfg.SepoliaRPCURL, "NYAYA_TEST_PRIVATE_KEY="+cfg.SepoliaPrivateKey, "NYAYA_TEST_CONTRACT="+EvidenceRegistryAddress)
	output, err := cmd.Output()
	if err != nil {
		if ctx.Err() != nil {
			return nil, fmt.Errorf("blockchain operation timed out")
		}
		return nil, fmt.Errorf("blockchain operation failed; check RPC connectivity and configuration")
	}
	line := strings.TrimSpace(string(output))
	if i := strings.LastIndex(line, "\n"); i >= 0 {
		line = line[i+1:]
	}
	var envelope map[string]json.RawMessage
	if err := json.Unmarshal([]byte(line), &envelope); err != nil {
		return nil, fmt.Errorf("decode blockchain helper response")
	}
	if raw, ok := envelope["error"]; ok {
		var message string
		_ = json.Unmarshal(raw, &message)
		return nil, fmt.Errorf("blockchain RPC: %s", message)
	}
	return []byte(line), nil
}

type blockchainSummaryRow struct {
	Concurrency   int
	Transactions  int
	Successful    int
	Failed        int
	MeanLatency   float64
	MedianLatency float64
	Throughput    float64
	MeanGas       float64
	FailureRate   float64
	Notes         string
}

func summarizeBlockchainBatch(level int, batch blockchainBatch) blockchainSummaryRow {
	latencies, gasValues := []float64{}, []float64{}
	row := blockchainSummaryRow{Concurrency: level, Transactions: len(batch.Results)}
	for _, trial := range batch.Results {
		if trial.Success {
			row.Successful++
			if value, err := strconv.ParseFloat(trial.LatencyMS, 64); err == nil {
				latencies = append(latencies, value)
			}
		} else {
			row.Failed++
		}
		if value, err := strconv.ParseFloat(trial.GasUsed, 64); err == nil && value > 0 {
			gasValues = append(gasValues, value)
		}
	}
	row.MeanLatency, row.MedianLatency = Mean(latencies), Median(latencies)
	row.MeanGas = Mean(gasValues)
	row.Throughput = float64(row.Successful) / (batch.ElapsedMS / 1000)
	row.FailureRate = float64(row.Failed) / float64(max(1, row.Transactions)) * 100
	if row.Failed > 0 {
		row.Notes = "Higher concurrency stopped after this level because one or more transactions failed."
	}
	return row
}

func writeBlockchainResults(trials []blockchainTrial, summaries []blockchainSummaryRow, preflight chainPreflight) error {
	if err := os.MkdirAll("results", 0755); err != nil {
		return err
	}
	file, err := os.Create("results/blockchain_results.csv")
	if err != nil {
		return err
	}
	writer := csv.NewWriter(file)
	_ = writer.Write([]string{"concurrency", "transaction_index", "submitted_timestamp", "confirmation_timestamp", "latency_ms", "transaction_hash", "block_number", "gas_used", "success", "error"})
	for _, trial := range trials {
		_ = writer.Write([]string{strconv.Itoa(trial.Concurrency), strconv.Itoa(trial.TransactionIndex), trial.SubmittedAt, trial.ConfirmationAt, trial.LatencyMS, trial.TransactionHash, trial.BlockNumber, trial.GasUsed, strconv.FormatBool(trial.Success), trial.Error})
	}
	writer.Flush()
	if err := writer.Error(); err != nil {
		file.Close()
		return err
	}
	if err := file.Close(); err != nil {
		return err
	}
	file, err = os.Create("results/blockchain_summary.csv")
	if err != nil {
		return err
	}
	writer = csv.NewWriter(file)
	_ = writer.Write([]string{"concurrency", "transactions", "successful", "failed", "mean_latency_ms", "median_latency_ms", "throughput_tx_per_sec", "mean_gas_used", "failure_rate", "notes"})
	var report strings.Builder
	fmt.Fprintf(&report, "Table 9 — Blockchain transaction performance\nNetwork: Sepolia (chain ID %s)\nContract: %s\nPreflight block: %d\n", preflight.ChainID, EvidenceRegistryAddress, preflight.BlockNumber)
	for _, row := range summaries {
		mean, median, throughput, gas, failure := "", "", "", "", ""
		if row.Successful > 0 {
			mean = fmt.Sprintf("%.3f", row.MeanLatency)
			median = fmt.Sprintf("%.3f", row.MedianLatency)
			gas = fmt.Sprintf("%.2f", row.MeanGas)
		}
		if row.Transactions > 0 {
			throughput = fmt.Sprintf("%.6f", row.Throughput)
			failure = fmt.Sprintf("%.2f%%", row.FailureRate)
		}
		_ = writer.Write([]string{strconv.Itoa(row.Concurrency), strconv.Itoa(row.Transactions), strconv.Itoa(row.Successful), strconv.Itoa(row.Failed), mean, median, throughput, gas, failure, row.Notes})
		fmt.Fprintf(&report, "Concurrency %d: attempted=%d successful=%d failed=%d mean_ms=%s median_ms=%s throughput_tx_per_sec=%s mean_gas_used=%s failure_rate=%s\nNotes: %s\n\n", row.Concurrency, row.Transactions, row.Successful, row.Failed, mean, median, throughput, gas, failure, row.Notes)
	}
	writer.Flush()
	if err := writer.Error(); err != nil {
		file.Close()
		return err
	}
	if err := file.Close(); err != nil {
		return err
	}
	return os.WriteFile("results/blockchain_summary.txt", []byte(report.String()), 0644)
}

func writeBlockchainNotRun(reason string) {
	rows := make([]blockchainSummaryRow, len(blockchainLevels))
	for i, level := range blockchainLevels {
		rows[i] = blockchainSummaryRow{Concurrency: level, Notes: "NOT RUN: " + reason}
	}
	_ = writeBlockchainResults(nil, rows, chainPreflight{ChainID: "unknown"})
}
