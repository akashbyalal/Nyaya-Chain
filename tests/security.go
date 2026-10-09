package main

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"
)

var securityCSVHeader = []string{
	"test_id", "test_name", "status", "expected", "actual", "passed",
	"original_hash", "modified_hash", "fir_number", "blockchain_tx_hash",
	"error", "latency_ms", "timestamp",
}

type securityResult struct {
	TestID        string
	TestName      string
	Status        string
	Expected      string
	Actual        string
	Passed        string
	OriginalHash  string
	ModifiedHash  string
	FIRNumber     string
	BlockchainTx  string
	Error         string
	LatencyMS     string
	Timestamp     string
	Detected      bool
	FalsePositive bool
}

type evidenceUploadResponse struct {
	Evidence struct {
		ID                 string `json:"id"`
		FileHash           string `json:"fileHash"`
		StoragePath        string `json:"storagePath"`
		BlockchainTxHash   string `json:"blockchainTxHash"`
		VerificationStatus string `json:"verificationStatus"`
	} `json:"evidence"`
}

type verificationResponse struct {
	Verification struct {
		CurrentHash     string `json:"currentHash"`
		FileHashMatches bool   `json:"fileHashMatches"`
		Verified        bool   `json:"verified"`
		Status          string `json:"status"`
		Blockchain      struct {
			Exists           bool   `json:"exists"`
			FIRNumber        string `json:"firNumber"`
			FIRNumberMatches bool   `json:"firNumberMatches"`
			TransactionHash  string `json:"transactionHash"`
		} `json:"blockchain"`
	} `json:"verification"`
}

type testFixture struct {
	firID       string
	firNumber   string
	evidenceID  string
	storagePath string
	rowDeleted  bool
}

func RunSecurityTests() {
	ctx, cancel := context.WithTimeout(context.Background(), 6*time.Hour)
	defer cancel()
	cfg, err := LoadConfig()
	if err != nil {
		fmt.Fprintf(os.Stderr, "Security suite could not start: %v\n", err)
		return
	}
	backend, err := NewHTTPClient(cfg.BackendURL)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Security suite could not start: %v\n", err)
		return
	}
	healthStatus, _, healthErr := backend.Get("/health")
	if healthErr != nil || healthStatus < 200 || healthStatus >= 300 {
		fmt.Println("Nyaya-Chain backend is not reachable. Start the backend with npm run dev.")
		return
	}
	supabase, err := NewSupabaseClient(cfg.SupabaseURL, cfg.SupabaseServiceRoleKey)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Security experiments not run: %v\n", err)
		return
	}
	if cfg.SepoliaRPCURL == "" || cfg.SepoliaPrivateKey == "" {
		fmt.Fprintln(os.Stderr, "Security experiments not run: SEPOLIA_RPC_URL and SEPOLIA_PRIVATE_KEY are required")
		return
	}
	trialCount := securityTrialCount()
	fmt.Printf("Running Table 8 security trials: %d per applicable test.\n", trialCount)
	preflightErr := securityBudgetPreflight(ctx, cfg, trialCount)
	runCtx := ctx
	if preflightErr != nil {
		fmt.Fprintf(os.Stderr, "Security trials not run: %v\n", preflightErr)
		stopped, stop := context.WithCancel(ctx)
		stop()
		runCtx = stopped
	}
	results, err := runTable8(runCtx, cfg, backend, supabase, trialCount)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Table 8 execution stopped: %v\n", err)
	}
	if preflightErr != nil {
		for i := range results {
			if results[i].Status != "NOT IMPLEMENTED" {
				results[i].Status = "NOT RUN"
				results[i].Error = preflightErr.Error()
			}
		}
	}
	results = append(results,
		securityResult{TestID: "A5", TestName: "IPFS Unavailability", Status: "NOT APPLICABLE", Expected: "No IPFS test for the current MVP.", Actual: "Current MVP uses Supabase Storage instead of IPFS.", Passed: "N/A", Timestamp: time.Now().UTC().Format(time.RFC3339)},
		securityResult{TestID: "A6", TestName: "Unauthorized Access", Status: "NOT IMPLEMENTED", Expected: "Report missing application authorization honestly.", Actual: "The current MVP lacks sufficient application-level authorization for a meaningful unauthorized-access prevention experiment.", Passed: "N/A", Timestamp: time.Now().UTC().Format(time.RFC3339)},
	)
	replay := securityResult{TestID: "A7", TestName: "Replay Attack", Status: "NOT RUN", Passed: "N/A", Error: "Skipped because Sepolia preflight did not pass", Timestamp: time.Now().UTC().Format(time.RFC3339)}
	if preflightErr == nil {
		replay = runReplayAttack(ctx, cfg, backend, supabase)
		replay.TestID = "A7"
	}
	results = append(results, replay)
	if err := writeSecurityResults(results); err != nil {
		fmt.Fprintf(os.Stderr, "Could not write security results: %v\n", err)
	}
	fmt.Println("Table 8 trials: results/security_trials.csv")
	fmt.Println("Table 8 summary: results/table8_summary.csv")
	fmt.Println("Security summary: results/summary.txt")
	for _, result := range results {
		fmt.Printf("%s %s: %s\n", result.TestID, result.TestName, result.Status)
	}
}

func securityBudgetPreflight(ctx context.Context, cfg Config, trials int) error {
	return registrationBudgetPreflight(ctx, cfg, trials*4+1)
}

func notRunResult(id, name string, err error) securityResult {
	return securityResult{TestID: id, TestName: name, Status: "NOT RUN", Expected: "Experiment requires live application and blockchain configuration.", Actual: "No experiment operation was performed.", Passed: "N/A", Error: err.Error(), Timestamp: time.Now().UTC().Format(time.RFC3339)}
}

func orderSecurityResults(results []securityResult) []securityResult {
	order := map[string]int{"A1": 1, "A2": 2, "A3": 3, "A4": 4, "A5": 5, "A6": 6, "A7": 7}
	ordered := make([]securityResult, 0, len(results))
	for i := 1; i <= 7; i++ {
		for _, result := range results {
			if order[result.TestID] == i {
				ordered = append(ordered, result)
				break
			}
		}
	}
	return ordered
}

func newResult(id, name, expected string) securityResult {
	return securityResult{TestID: id, TestName: name, Expected: expected, Timestamp: time.Now().UTC().Format(time.RFC3339)}
}

func newFixture(ctx context.Context, sb *SupabaseClient) (*testFixture, error) {
	id, err := randomID()
	if err != nil {
		return nil, fmt.Errorf("generate unique test identifier: %w", err)
	}
	firNumber := fmt.Sprintf("NYAYA-SEC-%s-%s", time.Now().UTC().Format("20060102"), strings.ToUpper(id[:8]))
	firID, err := sb.CreateTestFIR(ctx, firNumber)
	if err != nil {
		return nil, err
	}
	return &testFixture{firID: firID, firNumber: firNumber}, nil
}

func randomID() (string, error) {
	data := make([]byte, 16)
	if _, err := rand.Read(data); err != nil {
		return "", err
	}
	return hex.EncodeToString(data), nil
}

func fixtureContent(label string) (string, []byte, error) {
	file, err := os.CreateTemp("", "nyaya-security-*.txt")
	if err != nil {
		return "", nil, fmt.Errorf("create temporary evidence file: %w", err)
	}
	data := []byte(fmt.Sprintf("Nyaya-Chain disposable %s evidence. Generated at %s.\n", label, time.Now().UTC().Format(time.RFC3339Nano)))
	if _, err := file.Write(data); err != nil {
		file.Close()
		os.Remove(file.Name())
		return "", nil, fmt.Errorf("write temporary evidence file: %w", err)
	}
	if err := file.Close(); err != nil {
		os.Remove(file.Name())
		return "", nil, fmt.Errorf("close temporary evidence file: %w", err)
	}
	return file.Name(), data, nil
}

func sha256Hex(data []byte) string {
	hash := sha256.Sum256(data)
	return hex.EncodeToString(hash[:])
}

func uploadEvidence(ctx context.Context, backend *HTTPClient, fixture *testFixture, filename string, data []byte) (evidenceUploadResponse, error) {
	contentType, body, err := makeEvidenceMultipart(fixture.firID, filepath.Base(filename), "text/plain", data)
	if err != nil {
		return evidenceUploadResponse{}, err
	}
	status, responseBody, err := backend.DoContext(ctx, "POST", "/api/evidence", body, contentType)
	if err != nil {
		return evidenceUploadResponse{}, err
	}
	if status != 201 {
		return evidenceUploadResponse{}, fmt.Errorf("evidence upload returned HTTP %d: %s", status, truncateBody(responseBody))
	}
	var response evidenceUploadResponse
	if err := json.Unmarshal(responseBody, &response); err != nil {
		return response, fmt.Errorf("decode evidence upload response: %w", err)
	}
	if response.Evidence.ID == "" || response.Evidence.FileHash == "" {
		return response, fmt.Errorf("evidence upload response omitted its record ID or hash")
	}
	fixture.evidenceID = response.Evidence.ID
	fixture.storagePath = response.Evidence.StoragePath
	return response, nil
}

func verifyThroughBackend(ctx context.Context, backend *HTTPClient, evidenceID string) (verificationResponse, error) {
	status, body, err := backend.DoContext(ctx, "GET", "/api/evidence/"+evidenceID+"/verify", nil, "")
	if err != nil {
		return verificationResponse{}, err
	}
	if status != 200 {
		return verificationResponse{}, fmt.Errorf("evidence verification returned HTTP %d: %s", status, truncateBody(body))
	}
	var response verificationResponse
	if err := json.Unmarshal(body, &response); err != nil {
		return response, fmt.Errorf("decode evidence verification response: %w", err)
	}
	return response, nil
}

func chainEvidence(ctx context.Context, cfg Config, fileHash string) (ChainEvidence, error) {
	data, err := runEthereum(ctx, cfg, "verify", fileHash, "")
	if err != nil {
		return ChainEvidence{}, err
	}
	var record ChainEvidence
	if err := json.Unmarshal(data, &record); err != nil {
		return record, fmt.Errorf("decode on-chain evidence: %w", err)
	}
	return record, nil
}

func cleanupFixture(ctx context.Context, sb *SupabaseClient, fixture *testFixture, result *securityResult) {
	if fixture == nil {
		return
	}
	var warnings []string
	if fixture.evidenceID != "" && !fixture.rowDeleted {
		if err := sb.DeleteEvidence(ctx, fixture.evidenceID); err != nil {
			warnings = append(warnings, "evidence-row cleanup failed")
		}
	}
	if fixture.storagePath != "" {
		if err := sb.DeleteStorageObject(ctx, fixture.storagePath); err != nil {
			warnings = append(warnings, "storage-object cleanup failed")
		}
	}
	if fixture.firID != "" {
		if err := sb.DeleteFIR(ctx, fixture.firID); err != nil {
			warnings = append(warnings, "FIR cleanup failed")
		}
	}
	if len(warnings) > 0 {
		cleanupWarning := "Test data cleanup warning: " + strings.Join(warnings, ", ")
		if result.Error != "" {
			result.Error += "; "
		}
		result.Error += cleanupWarning
	}
}

func setElapsed(result *securityResult, start time.Time) {
	result.LatencyMS = fmt.Sprintf("%.3f", float64(time.Since(start).Nanoseconds())/1e6)
}

func runEvidenceModification(ctx context.Context, cfg Config, backend *HTTPClient, sb *SupabaseClient) (result securityResult) {
	result = newResult("A1", "Evidence Modification", "Changed evidence bytes must produce a different SHA-256 hash and backend tampering indication.")
	start := time.Now()
	fixture, err := newFixture(ctx, sb)
	if err != nil {
		return failedResult(result, err, start)
	}
	result.FIRNumber = fixture.firNumber
	defer cleanupFixture(ctx, sb, fixture, &result)
	filename, original, err := fixtureContent("A1-original")
	if err != nil {
		return failedResult(result, err, start)
	}
	defer os.Remove(filename)
	result.OriginalHash = sha256Hex(original)
	upload, err := uploadEvidence(ctx, backend, fixture, filename, original)
	if err != nil {
		return failedResult(result, err, start)
	}
	result.BlockchainTx = upload.Evidence.BlockchainTxHash
	if upload.Evidence.FileHash != result.OriginalHash || upload.Evidence.VerificationStatus != "Verified" {
		return failedResult(result, fmt.Errorf("upload did not confirm the expected hash and blockchain registration"), start)
	}
	baseline, err := verifyThroughBackend(ctx, backend, fixture.evidenceID)
	if err != nil {
		return failedResult(result, err, start)
	}
	result.FalsePositive = !baseline.Verification.Verified && baseline.Verification.Status == "Tampered"
	attackStart := time.Now()
	modified := append(append([]byte(nil), original...), []byte("controlled modification\n")...)
	result.ModifiedHash = sha256Hex(modified)
	if err := sb.UploadReplacement(ctx, fixture.storagePath, "text/plain", modified); err != nil {
		return failedResult(result, err, start)
	}
	verification, err := verifyThroughBackend(ctx, backend, fixture.evidenceID)
	if err != nil {
		return failedResult(result, err, start)
	}
	passed := result.OriginalHash != result.ModifiedHash && verification.Verification.CurrentHash == result.ModifiedHash && !verification.Verification.FileHashMatches && !verification.Verification.Verified && verification.Verification.Blockchain.Exists
	result.Detected = passed
	if passed {
		result.Status, result.Passed = "PASS", "true"
		result.Actual = "Modified bytes produced a distinct SHA-256; backend verification marked the evidence Tampered while the original hash remained registered on-chain."
	} else {
		result.Status, result.Passed = "FAIL", "false"
		result.Actual = "The expected modification/tampering signals were not all observed."
	}
	setElapsed(&result, attackStart)
	return result
}

func runEvidenceReplacement(ctx context.Context, cfg Config, backend *HTTPClient, sb *SupabaseClient) (result securityResult) {
	result = newResult("A2", "Evidence Replacement", "Replacement content must not match the original blockchain-registered hash.")
	start := time.Now()
	fixture, err := newFixture(ctx, sb)
	if err != nil {
		return failedResult(result, err, start)
	}
	result.FIRNumber = fixture.firNumber
	defer cleanupFixture(ctx, sb, fixture, &result)
	filename, original, err := fixtureContent("A2-original")
	if err != nil {
		return failedResult(result, err, start)
	}
	defer os.Remove(filename)
	replacementFile, replacement, err := fixtureContent("A2-replacement")
	if err != nil {
		return failedResult(result, err, start)
	}
	defer os.Remove(replacementFile)
	result.OriginalHash, result.ModifiedHash = sha256Hex(original), sha256Hex(replacement)
	upload, err := uploadEvidence(ctx, backend, fixture, filename, original)
	if err != nil {
		return failedResult(result, err, start)
	}
	result.BlockchainTx = upload.Evidence.BlockchainTxHash
	if upload.Evidence.FileHash != result.OriginalHash || upload.Evidence.VerificationStatus != "Verified" {
		return failedResult(result, fmt.Errorf("original content was not confirmed as blockchain-registered"), start)
	}
	baseline, err := verifyThroughBackend(ctx, backend, fixture.evidenceID)
	if err != nil {
		return failedResult(result, err, start)
	}
	result.FalsePositive = !baseline.Verification.Verified && baseline.Verification.Status == "Tampered"
	attackStart := time.Now()
	if err := sb.UploadReplacement(ctx, fixture.storagePath, "text/plain", replacement); err != nil {
		return failedResult(result, err, start)
	}
	verification, err := verifyThroughBackend(ctx, backend, fixture.evidenceID)
	if err != nil {
		return failedResult(result, err, start)
	}
	passed := result.OriginalHash != result.ModifiedHash && verification.Verification.CurrentHash == result.ModifiedHash && !verification.Verification.FileHashMatches && !verification.Verification.Verified && verification.Verification.Blockchain.Exists
	result.Detected = passed
	if passed {
		result.Status, result.Passed = "PASS", "true"
		result.Actual = "Replacement bytes had a distinct SHA-256 and backend verification detected the mismatch against the original registered hash."
	} else {
		result.Status, result.Passed = "FAIL", "false"
		result.Actual = "The expected replacement mismatch was not fully observed."
	}
	setElapsed(&result, attackStart)
	return result
}

func runMetadataManipulation(ctx context.Context, cfg Config, backend *HTTPClient, sb *SupabaseClient) (result securityResult) {
	result = newResult("A3", "Metadata Manipulation", "Demonstrate the on-chain hash/FIR/timestamp/uploader binding and distinguish database-only file metadata.")
	start := time.Now()
	fixture, err := newFixture(ctx, sb)
	if err != nil {
		return failedResult(result, err, start)
	}
	result.FIRNumber = fixture.firNumber
	defer cleanupFixture(ctx, sb, fixture, &result)
	filename, content, err := fixtureContent("A3-metadata")
	if err != nil {
		return failedResult(result, err, start)
	}
	defer os.Remove(filename)
	result.OriginalHash = sha256Hex(content)
	upload, err := uploadEvidence(ctx, backend, fixture, filename, content)
	if err != nil {
		return failedResult(result, err, start)
	}
	result.BlockchainTx = upload.Evidence.BlockchainTxHash
	if upload.Evidence.FileHash != result.OriginalHash || upload.Evidence.VerificationStatus != "Verified" {
		return failedResult(result, fmt.Errorf("evidence registration was not confirmed"), start)
	}
	baseline, err := verifyThroughBackend(ctx, backend, fixture.evidenceID)
	if err != nil {
		return failedResult(result, err, start)
	}
	result.FalsePositive = !baseline.Verification.Verified && baseline.Verification.Status == "Tampered"
	changedFIRNumber := fixture.firNumber + "-MUTATED"
	attackStart := time.Now()
	if err := sb.PatchFIRNumber(ctx, fixture.firID, changedFIRNumber); err != nil {
		return failedResult(result, err, start)
	}
	defer func() { _ = sb.PatchFIRNumber(context.Background(), fixture.firID, fixture.firNumber) }()
	verification, err := verifyThroughBackend(ctx, backend, fixture.evidenceID)
	if err != nil {
		return failedResult(result, err, start)
	}
	passed := verification.Verification.Blockchain.Exists && !verification.Verification.Verified
	result.Detected = passed
	result.Actual = "Changing the database FIR number for this disposable record was detected because the blockchain-bound FIR number no longer matched. Other database-only metadata is not committed by the contract."
	if passed {
		result.Status, result.Passed = "PASS", "true"
	} else {
		result.Status, result.Passed = "FAIL", "false"
		result.Actual = "Could not confirm the expected distinction between on-chain fields and database-only file metadata."
	}
	setElapsed(&result, attackStart)
	return result
}

func runDatabaseDeletion(ctx context.Context, cfg Config, backend *HTTPClient, sb *SupabaseClient) (result securityResult) {
	result = newResult("A4", "Database Deletion", "The database evidence row can be deleted while its independent blockchain registration remains verifiable; blockchain cannot recover the file.")
	start := time.Now()
	fixture, err := newFixture(ctx, sb)
	if err != nil {
		return failedResult(result, err, start)
	}
	result.FIRNumber = fixture.firNumber
	defer cleanupFixture(ctx, sb, fixture, &result)
	filename, content, err := fixtureContent("A4-deletion")
	if err != nil {
		return failedResult(result, err, start)
	}
	defer os.Remove(filename)
	result.OriginalHash = sha256Hex(content)
	upload, err := uploadEvidence(ctx, backend, fixture, filename, content)
	if err != nil {
		return failedResult(result, err, start)
	}
	result.BlockchainTx = upload.Evidence.BlockchainTxHash
	if upload.Evidence.FileHash != result.OriginalHash || upload.Evidence.VerificationStatus != "Verified" {
		return failedResult(result, fmt.Errorf("evidence registration was not confirmed"), start)
	}
	baseline, err := verifyThroughBackend(ctx, backend, fixture.evidenceID)
	if err != nil {
		return failedResult(result, err, start)
	}
	result.FalsePositive = !baseline.Verification.Verified && baseline.Verification.Status == "Tampered"
	attackStart := time.Now()
	if err := sb.DeleteEvidence(ctx, fixture.evidenceID); err != nil {
		return failedResult(result, err, start)
	}
	fixture.rowDeleted = true
	remainingStatus, remainingBody, err := sb.request(ctx, "GET", "/rest/v1/evidence?id=eq."+fixture.evidenceID+"&select=id", nil, nil)
	if err != nil {
		return failedResult(result, err, start)
	}
	_ = remainingStatus
	var remaining []struct {
		ID string `json:"id"`
	}
	if err := json.Unmarshal(remainingBody, &remaining); err != nil {
		return failedResult(result, fmt.Errorf("decode evidence deletion confirmation: %w", err), start)
	}
	chain, err := chainEvidence(ctx, cfg, result.OriginalHash)
	if err != nil {
		return failedResult(result, err, start)
	}
	passed := len(remaining) == 0 && chain.Exists && chain.FIRNumber == fixture.firNumber
	result.Detected = passed
	result.Actual = fmt.Sprintf("database_record_deleted=%t; blockchain_registration_survived=%t; evidence_recoverable_from_blockchain=false (the contract stores metadata, not file bytes).", len(remaining) == 0, chain.Exists)
	if passed {
		result.Status, result.Passed = "PASS", "true"
	} else {
		result.Status, result.Passed = "FAIL", "false"
	}
	setElapsed(&result, attackStart)
	return result
}

func runReplayAttack(ctx context.Context, cfg Config, backend *HTTPClient, sb *SupabaseClient) (result securityResult) {
	result = newResult("A7", "Replay Attack", "First registration of a unique hash succeeds; a second registration of the exact same hash is rejected by the contract.")
	start := time.Now()
	fixture, err := newFixture(ctx, sb)
	if err != nil {
		return failedResult(result, err, start)
	}
	result.FIRNumber = fixture.firNumber
	defer cleanupFixture(ctx, sb, fixture, &result)
	filename, content, err := fixtureContent("A7-replay")
	if err != nil {
		return failedResult(result, err, start)
	}
	defer os.Remove(filename)
	result.OriginalHash = sha256Hex(content)
	upload, err := uploadEvidence(ctx, backend, fixture, filename, content)
	if err != nil {
		return failedResult(result, err, start)
	}
	result.BlockchainTx = upload.Evidence.BlockchainTxHash
	if upload.Evidence.FileHash != result.OriginalHash || upload.Evidence.VerificationStatus != "Verified" {
		return failedResult(result, fmt.Errorf("first registration was not confirmed"), start)
	}
	replayJSON, err := runEthereum(ctx, cfg, "replay", result.OriginalHash, fixture.firNumber)
	if err != nil {
		if strings.Contains(strings.ToLower(err.Error()), "execution reverted") || strings.Contains(strings.ToLower(err.Error()), "evidence already registered") {
			result.Status, result.Passed = "PASS", "true"
			result.Actual = "The first registration succeeded; the second registration attempt for the exact same hash returned an EVM revert."
			result.Error = err.Error()
			setElapsed(&result, start)
			return result
		}
		return failedResult(result, err, start)
	}
	var replay ReplayAttempt
	if err := json.Unmarshal(replayJSON, &replay); err != nil {
		return failedResult(result, fmt.Errorf("decode replay response: %w", err), start)
	}
	if replay.TxHash != "" {
		result.BlockchainTx += "; replay_attempt=" + replay.TxHash
	}
	result.Error = replay.Error
	if replay.Reverted {
		result.Status, result.Passed = "PASS", "true"
		result.Actual = "The first registration succeeded and the contract rejected the second transaction for the exact same global file hash."
	} else {
		result.Status, result.Passed = "FAIL", "false"
		result.Actual = "The replay transaction was not rejected by the contract."
	}
	setElapsed(&result, start)
	return result
}

func failedResult(result securityResult, err error, start time.Time) securityResult {
	result.Status, result.Passed = "FAIL", "false"
	result.Actual = "Experiment did not establish the expected property."
	result.Error = err.Error()
	setElapsed(&result, start)
	return result
}

func writeSecurityResults(results []securityResult) error {
	rows := make([][]string, 0, len(results))
	var summary strings.Builder
	summary.WriteString("Nyaya-Chain Security Test Report\n===============================\n\n")
	for _, result := range results {
		rows = append(rows, []string{result.TestID, result.TestName, result.Status, result.Expected, result.Actual, result.Passed, result.OriginalHash, result.ModifiedHash, result.FIRNumber, result.BlockchainTx, result.Error, result.LatencyMS, result.Timestamp})
		fmt.Fprintf(&summary, "%s %s\nStatus: %s\nExpected: %s\nActual: %s\n", result.TestID, result.TestName, result.Status, result.Expected, result.Actual)
		if result.OriginalHash != "" {
			fmt.Fprintf(&summary, "Original SHA-256: %s\n", result.OriginalHash)
		}
		if result.ModifiedHash != "" {
			fmt.Fprintf(&summary, "Modified/replacement SHA-256: %s\n", result.ModifiedHash)
		}
		if result.FIRNumber != "" {
			fmt.Fprintf(&summary, "Test FIR: %s\n", result.FIRNumber)
		}
		if result.BlockchainTx != "" {
			fmt.Fprintf(&summary, "Blockchain transaction: %s\n", result.BlockchainTx)
		}
		if result.LatencyMS != "" {
			fmt.Fprintf(&summary, "Latency: %s ms\n", result.LatencyMS)
		}
		if result.Error != "" {
			fmt.Fprintf(&summary, "Error/message: %s\n", result.Error)
		}
		summary.WriteByte('\n')
	}
	if err := WriteCSV(filepath.Join("results", "security_results.csv"), securityCSVHeader, rows); err != nil {
		return err
	}
	if err := os.MkdirAll("results", 0755); err != nil {
		return err
	}
	if err := os.WriteFile(filepath.Join("results", "summary.txt"), []byte(summary.String()), 0644); err != nil {
		return fmt.Errorf("write summary: %w", err)
	}
	return nil
}
