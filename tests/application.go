package main

import (
	"context"
	"crypto/sha256"
	"encoding/csv"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
	"time"
)

type applicationTrial struct {
	Operation string
	Variant   string
	Trial     int
	LatencyMS string
	Status    string
	Error     string
	Timestamp string
}

type applicationSummary struct {
	Operation string
	Baseline  []float64
	Nyaya     []float64
	Notes     string
}

type baselineEvidenceFixture struct {
	fixture testFixture
	file    string
	data    []byte
	hash    string
}

func RunApplicationTests() {
	ctx, cancel := context.WithTimeout(context.Background(), 4*time.Hour)
	defer cancel()
	cfg, err := LoadConfig()
	if err != nil {
		fmt.Fprintf(os.Stderr, "Application benchmarks not run: %v\n", err)
		return
	}
	backend, err := NewHTTPClient(cfg.BackendURL)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Application benchmarks not run: %v\n", err)
		return
	}
	status, _, err := backend.Get("/health")
	if err != nil || status < 200 || status >= 300 {
		fmt.Fprintln(os.Stderr, "Application benchmarks not run: Nyaya-Chain backend is not reachable.")
		return
	}
	sb, err := NewSupabaseClient(cfg.SupabaseURL, cfg.SupabaseServiceRoleKey)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Application benchmarks not run: %v\n", err)
		return
	}
	if cfg.SepoliaRPCURL == "" || cfg.SepoliaPrivateKey == "" {
		fmt.Fprintln(os.Stderr, "Application benchmarks not run: Sepolia configuration is required for full-chain evidence uploads.")
		return
	}

	trials := performanceTrialCount()
	fmt.Printf("Running Table 10 application measurements: %d trials per operation.\n", trials)
	chainAllowed := true
	chainBlockReason := ""
	if err := registrationBudgetPreflight(ctx, cfg, trials); err != nil {
		chainAllowed = false
		chainBlockReason = err.Error()
		fmt.Fprintf(os.Stderr, "Full-chain application measurements not run: %s\n", chainBlockReason)
	}
	results, raw, err := runApplicationBenchmarks(ctx, cfg, backend, sb, trials, chainAllowed, chainBlockReason)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Application benchmark stopped: %v\n", err)
	}
	if err := writeApplicationResults(results, raw, trials); err != nil {
		fmt.Fprintf(os.Stderr, "Could not write application results: %v\n", err)
		return
	}
	fmt.Println("Application results: results/application_results.csv")
	fmt.Println("Application trials: results/application_trials.csv")
	fmt.Println("Application summary: results/application_summary.txt")
}

func performanceTrialCount() int {
	value := strings.TrimSpace(os.Getenv("NYAYA_PERFORMANCE_TRIALS"))
	if value == "" {
		return 30
	}
	count, err := strconv.Atoi(value)
	if err != nil || count < 1 || count > 100 {
		return 30
	}
	return count
}

func runApplicationBenchmarks(ctx context.Context, cfg Config, backend *HTTPClient, sb *SupabaseClient, trials int, chainAllowed bool, chainBlockReason string) ([]applicationSummary, []applicationTrial, error) {
	ops := []applicationSummary{
		{Operation: "FIR registration time", Notes: "Baseline is a direct Supabase FIR insert. The Nyaya FIR endpoint invokes AI analysis and email delivery; it is not called by this harness to avoid triggering external email side effects. FIR registration itself does not call blockchain, so no blockchain-specific Nyaya timing is available."},
		{Operation: "Evidence upload time", Notes: "Baseline is Supabase Storage upload plus evidence metadata insert without blockchain. Nyaya measurement is POST /api/evidence through response; it includes SHA-256, storage, database insert, blockchain submission and confirmation."},
		{Operation: "Hash computation time", Notes: "Baseline is Go crypto/sha256; Nyaya measurement is Node.js crypto.createHash('sha256'), matching the backend operation. Timer excludes process startup, file I/O, and network."},
		{Operation: "Verification time", Notes: "Baseline reads evidence metadata and the stored object from Supabase and compares SHA-256. Nyaya uses GET /api/evidence/:id/verify and includes the blockchain calls."},
		{Operation: "Database response time", Notes: "Baseline is direct Supabase REST read of one FIR row. Nyaya is GET /api/firs/:id, which reads FIR and evidence metadata but does not query blockchain."},
		{Operation: "Senior dashboard response time", Notes: "Measures the judge verification page's actual API data path: list FIRs, then list evidence for the selected FIR. This is API data loading only; frontend rendering is not measured. Baseline uses equivalent direct Supabase REST reads."},
	}
	byName := map[string]*applicationSummary{}
	for i := range ops {
		byName[ops[i].Operation] = &ops[i]
	}
	if !chainAllowed {
		byName["Evidence upload time"].Notes += " Full-chain NYAYA trials not run: " + chainBlockReason
		byName["Verification time"].Notes += " Full-chain NYAYA trials not run: " + chainBlockReason
	}
	var raw []applicationTrial
	add := func(op, variant string, trial int, started time.Time, err error) {
		item := applicationTrial{Operation: op, Variant: variant, Trial: trial, Status: "PASS", Timestamp: time.Now().UTC().Format(time.RFC3339)}
		if err != nil {
			item.Status, item.Error = "FAIL", err.Error()
		} else {
			item.LatencyMS = fmt.Sprintf("%.3f", float64(time.Since(started).Nanoseconds())/1e6)
		}
		raw = append(raw, item)
		if err == nil {
			value, _ := strconv.ParseFloat(item.LatencyMS, 64)
			if variant == "baseline" {
				byName[op].Baseline = append(byName[op].Baseline, value)
			} else {
				byName[op].Nyaya = append(byName[op].Nyaya, value)
			}
		}
	}

	// FIR baseline: one direct, timed database registration per trial; delete each disposable FIR immediately afterward.
	for i := 1; i <= trials && ctx.Err() == nil; i++ {
		firNumber, err := randomID()
		if err != nil {
			add("FIR registration time", "baseline", i, time.Now(), err)
			continue
		}
		started := time.Now()
		id, err := sb.CreateTestFIR(ctx, "NYAYA-T10-FIR-"+strings.ToUpper(firNumber[:12]))
		duration := time.Since(started)
		item := applicationTrial{Operation: "FIR registration time", Variant: "baseline", Trial: i, Timestamp: time.Now().UTC().Format(time.RFC3339)}
		if err != nil {
			item.Status, item.Error = "FAIL", err.Error()
		} else {
			item.Status, item.LatencyMS = "PASS", fmt.Sprintf("%.3f", float64(duration.Nanoseconds())/1e6)
			_ = sb.DeleteFIR(ctx, id)
			value, _ := strconv.ParseFloat(item.LatencyMS, 64)
			byName[item.Operation].Baseline = append(byName[item.Operation].Baseline, value)
		}
		raw = append(raw, item)
	}

	baseFIRID, err := randomID()
	if err != nil {
		return ops, raw, err
	}
	baseFIRNumber := "NYAYA-T10-BASE-" + strings.ToUpper(baseFIRID[:10])
	baseFIRID, err = sb.CreateTestFIR(ctx, baseFIRNumber)
	if err != nil {
		return ops, raw, fmt.Errorf("create baseline test FIR: %w", err)
	}
	baseFixture := &testFixture{firID: baseFIRID, firNumber: baseFIRNumber}
	chainToken, err := randomID()
	if err != nil {
		_ = sb.DeleteFIR(ctx, baseFIRID)
		return ops, raw, err
	}
	chainFIRNumber := "NYAYA-T10-CHAIN-" + strings.ToUpper(chainToken[:10])
	chainFIRID, err := sb.CreateTestFIR(ctx, chainFIRNumber)
	if err != nil {
		_ = sb.DeleteFIR(ctx, baseFIRID)
		return ops, raw, fmt.Errorf("create Nyaya test FIR: %w", err)
	}
	chainFixture := &testFixture{firID: chainFIRID, firNumber: chainFIRNumber}
	var baselineEvidence []baselineEvidenceFixture
	var chainEvidenceRecords []testFixture
	defer func() {
		for _, item := range baselineEvidence {
			_ = sb.DeleteEvidence(ctx, item.fixture.evidenceID)
			_ = sb.DeleteStorageObject(ctx, item.fixture.storagePath)
			os.Remove(item.file)
		}
		for _, item := range chainEvidenceRecords {
			_ = sb.DeleteEvidence(ctx, item.evidenceID)
			_ = sb.DeleteStorageObject(ctx, item.storagePath)
		}
		_ = sb.DeleteFIR(ctx, baseFixture.firID)
		_ = sb.DeleteFIR(ctx, chainFixture.firID)
	}()

	// Evidence upload baselines and full Nyaya workflow. Prepare fixtures outside measured intervals.
	for i := 1; i <= trials && ctx.Err() == nil; i++ {
		filename, data, err := fixtureContent(fmt.Sprintf("T10-baseline-%02d", i))
		if err != nil {
			add("Evidence upload time", "baseline", i, time.Now(), err)
			continue
		}
		hash := sha256Hex(data)
		token, err := randomID()
		if err != nil {
			os.Remove(filename)
			add("Evidence upload time", "baseline", i, time.Now(), err)
			continue
		}
		storagePath := baseFixture.firNumber + "/" + token[:12] + "-" + filepath.Base(filename)
		started := time.Now()
		evidenceID, err := sb.UploadBaselineEvidence(ctx, baseFixture, filepath.Base(filename), storagePath, hash, data)
		add("Evidence upload time", "baseline", i, started, err)
		if err == nil {
			baselineEvidence = append(baselineEvidence, baselineEvidenceFixture{fixture: testFixture{firID: baseFixture.firID, firNumber: baseFixture.firNumber, evidenceID: evidenceID, storagePath: storagePath}, file: filename, data: data, hash: hash})
		} else {
			os.Remove(filename)
		}

		if !chainAllowed {
			item := applicationTrial{Operation: "Evidence upload time", Variant: "nyaya_chain", Trial: i, Status: "NOT RUN", Error: chainBlockReason, Timestamp: time.Now().UTC().Format(time.RFC3339)}
			raw = append(raw, item)
			continue
		}
		chainFile, chainData, err := fixtureContent(fmt.Sprintf("T10-nyaya-%02d", i))
		if err != nil {
			add("Evidence upload time", "nyaya_chain", i, time.Now(), err)
			continue
		}
		contentType, body, err := makeEvidenceMultipart(chainFixture.firID, filepath.Base(chainFile), "text/plain", chainData)
		if err != nil {
			os.Remove(chainFile)
			add("Evidence upload time", "nyaya_chain", i, time.Now(), err)
			continue
		}
		started = time.Now()
		status, responseBody, requestErr := backend.DoContext(ctx, "POST", "/api/evidence", body, contentType)
		if requestErr == nil && status != 201 {
			requestErr = fmt.Errorf("upload returned HTTP %d: %s", status, truncateBody(responseBody))
		}
		var uploaded evidenceUploadResponse
		if requestErr == nil {
			requestErr = json.Unmarshal(responseBody, &uploaded)
		}
		if requestErr == nil && (uploaded.Evidence.ID == "" || uploaded.Evidence.VerificationStatus != "Verified" || uploaded.Evidence.BlockchainTxHash == "") {
			requestErr = fmt.Errorf("full Nyaya upload did not confirm blockchain registration")
		}
		add("Evidence upload time", "nyaya_chain", i, started, requestErr)
		if uploaded.Evidence.ID != "" {
			chainEvidenceRecords = append(chainEvidenceRecords, testFixture{firID: chainFixture.firID, firNumber: chainFixture.firNumber, evidenceID: uploaded.Evidence.ID, storagePath: uploaded.Evidence.StoragePath})
		}
		os.Remove(chainFile)
	}

	// Hash computation is timed independently of file creation and I/O.
	_, hashData, err := fixtureContent("T10-hash")
	if err != nil {
		return ops, raw, err
	}
	for i := 1; i <= trials && ctx.Err() == nil; i++ {
		started := time.Now()
		actual := sha256.Sum256(hashData)
		baseHash := hex.EncodeToString(actual[:])
		add("Hash computation time", "baseline", i, started, nil)
		started = time.Now()
		nodeHash, ns, nodeErr := timedNodeSHA256(ctx, cfg, hashData)
		addWithDuration("Hash computation time", "nyaya_chain", i, ns, nodeErr, &raw, byName["Hash computation time"])
		if nodeErr == nil && nodeHash != baseHash {
			raw[len(raw)-1].Status, raw[len(raw)-1].Error = "FAIL", "Go and Node SHA-256 results differed"
			byName["Hash computation time"].Nyaya = byName["Hash computation time"].Nyaya[:len(byName["Hash computation time"].Nyaya)-1]
		}
		_ = started
	}

	// Centralized verification versus full backend verification.
	for i := 0; i < trials && i < len(baselineEvidence) && ctx.Err() == nil; i++ {
		base := baselineEvidence[i]
		started := time.Now()
		_, err := verifyCentralized(ctx, sb, base.fixture.evidenceID, base.hash)
		add("Verification time", "baseline", i+1, started, err)
	}
	for i := 0; i < trials && ctx.Err() == nil; i++ {
		if !chainAllowed {
			raw = append(raw, applicationTrial{Operation: "Verification time", Variant: "nyaya_chain", Trial: i + 1, Status: "NOT RUN", Error: chainBlockReason, Timestamp: time.Now().UTC().Format(time.RFC3339)})
			continue
		}
		if i >= len(chainEvidenceRecords) {
			add("Verification time", "nyaya_chain", i+1, time.Now(), fmt.Errorf("no successful full-chain evidence fixture available"))
			continue
		}
		chain := chainEvidenceRecords[i]
		started := time.Now()
		_, err := verifyThroughBackend(ctx, backend, chain.evidenceID)
		add("Verification time", "nyaya_chain", i+1, started, err)
	}

	// Database row response: direct PostgREST versus the current backend FIR detail endpoint.
	for i := 1; i <= trials && ctx.Err() == nil; i++ {
		started := time.Now()
		_, _, err := sb.request(ctx, "GET", "/rest/v1/firs?id=eq."+baseFixture.firID+"&select=id,fir_number,status", nil, nil)
		add("Database response time", "baseline", i, started, err)
		started = time.Now()
		status, body, err := backend.DoContext(ctx, "GET", "/api/firs/"+chainFixture.firID, nil, "")
		if err == nil && (status < 200 || status >= 300) {
			err = fmt.Errorf("FIR detail returned HTTP %d: %s", status, truncateBody(body))
		}
		add("Database response time", "nyaya_chain", i, started, err)
	}

	// The judge dashboard performs an FIR list lookup followed by evidence lookup.
	for i := 1; i <= trials && ctx.Err() == nil; i++ {
		started := time.Now()
		_, _, err := sb.request(ctx, "GET", "/rest/v1/firs?select=id,fir_number,complainant_name,incident_date,status,created_at&order=created_at.desc&limit=50", nil, nil)
		if err == nil {
			_, _, err = sb.request(ctx, "GET", "/rest/v1/evidence?fir_id=eq."+baseFixture.firID+"&select=id,file_name,file_hash,verification_status,uploaded_at", nil, nil)
		}
		add("Senior dashboard response time", "baseline", i, started, err)
		started = time.Now()
		status, body, err := backend.DoContext(ctx, "GET", "/api/firs?limit=50", nil, "")
		if err == nil && (status < 200 || status >= 300) {
			err = fmt.Errorf("FIR list returned HTTP %d: %s", status, truncateBody(body))
		}
		if err == nil {
			status, body, err = backend.DoContext(ctx, "GET", "/api/evidence/fir/"+chainFixture.firID, nil, "")
			if err == nil && (status < 200 || status >= 300) {
				err = fmt.Errorf("evidence list returned HTTP %d: %s", status, truncateBody(body))
			}
		}
		add("Senior dashboard response time", "nyaya_chain", i, started, err)
	}
	return ops, raw, nil
}

func addWithDuration(op, variant string, trial int, duration time.Duration, err error, raw *[]applicationTrial, summary *applicationSummary) {
	item := applicationTrial{Operation: op, Variant: variant, Trial: trial, Timestamp: time.Now().UTC().Format(time.RFC3339)}
	if err != nil {
		item.Status, item.Error = "FAIL", err.Error()
	} else {
		item.Status, item.LatencyMS = "PASS", fmt.Sprintf("%.6f", float64(duration.Nanoseconds())/1e6)
		value, _ := strconv.ParseFloat(item.LatencyMS, 64)
		summary.Nyaya = append(summary.Nyaya, value)
	}
	*raw = append(*raw, item)
}

func timedNodeSHA256(ctx context.Context, cfg Config, data []byte) (string, time.Duration, error) {
	const script = `import fs from "node:fs"; import {createHash} from "node:crypto"; const input=fs.readFileSync(0); const start=process.hrtime.bigint(); const hash=createHash("sha256").update(input).digest("hex"); const elapsed=process.hrtime.bigint()-start; console.log(JSON.stringify({hash,elapsedNs:elapsed.toString()}));`
	cmd := exec.CommandContext(ctx, "node", "--input-type=module", "-e", script)
	cmd.Dir = filepath.Clean(filepath.Join("..", "backend"))
	cmd.Stdin = strings.NewReader(string(data))
	output, err := cmd.Output()
	if err != nil {
		return "", 0, fmt.Errorf("Node SHA-256 operation failed")
	}
	var response struct {
		Hash      string `json:"hash"`
		ElapsedNS string `json:"elapsedNs"`
	}
	if err := json.Unmarshal(output, &response); err != nil {
		return "", 0, fmt.Errorf("decode Node hash response")
	}
	nanos, err := strconv.ParseInt(response.ElapsedNS, 10, 64)
	if err != nil {
		return "", 0, fmt.Errorf("invalid Node hash duration")
	}
	return response.Hash, time.Duration(nanos), nil
}

func verifyCentralized(ctx context.Context, sb *SupabaseClient, evidenceID, expectedHash string) (bool, error) {
	_, body, err := sb.request(ctx, "GET", "/rest/v1/evidence?id=eq."+evidenceID+"&select=file_hash,storage_path", nil, nil)
	if err != nil {
		return false, err
	}
	var rows []struct {
		Hash string `json:"file_hash"`
		Path string `json:"storage_path"`
	}
	if err := json.Unmarshal(body, &rows); err != nil || len(rows) != 1 {
		return false, fmt.Errorf("centralized evidence metadata unavailable")
	}
	data, err := sb.DownloadStorageObject(ctx, rows[0].Path)
	if err != nil {
		return false, err
	}
	observed := sha256Hex(data)
	return observed == expectedHash && rows[0].Hash == expectedHash, nil
}

func writeApplicationResults(results []applicationSummary, raw []applicationTrial, trials int) error {
	if err := os.MkdirAll("results", 0755); err != nil {
		return err
	}
	rawFile, err := os.Create("results/application_trials.csv")
	if err != nil {
		return err
	}
	rawWriter := csv.NewWriter(rawFile)
	_ = rawWriter.Write([]string{"operation", "variant", "trial_number", "latency_ms", "status", "error", "timestamp"})
	for _, item := range raw {
		_ = rawWriter.Write([]string{item.Operation, item.Variant, strconv.Itoa(item.Trial), item.LatencyMS, item.Status, item.Error, item.Timestamp})
	}
	rawWriter.Flush()
	if err := rawWriter.Error(); err != nil {
		rawFile.Close()
		return err
	}
	if err := rawFile.Close(); err != nil {
		return err
	}
	file, err := os.Create("results/application_results.csv")
	if err != nil {
		return err
	}
	writer := csv.NewWriter(file)
	header := []string{"operation", "trials", "baseline_mean_ms", "nyaya_chain_mean_ms", "overhead_percent", "baseline_median_ms", "nyaya_chain_median_ms", "baseline_min_ms", "nyaya_chain_min_ms", "baseline_max_ms", "nyaya_chain_max_ms", "baseline_stddev_ms", "nyaya_chain_stddev_ms", "notes"}
	_ = writer.Write(header)
	var summary strings.Builder
	fmt.Fprintf(&summary, "Table 10 — Application-level timing, centralized baseline vs NYAYA-CHAIN\nDefault trials per operation: %d\nOverhead (%%) = ((NYAYA-CHAIN mean - Baseline mean) / Baseline mean) * 100.\n\n", trials)
	for _, result := range results {
		baseStats, chainStats := statsStrings(result.Baseline), statsStrings(result.Nyaya)
		overhead := ""
		if len(result.Baseline) > 0 && len(result.Nyaya) > 0 && Mean(result.Baseline) != 0 {
			overhead = fmt.Sprintf("%.3f", (Mean(result.Nyaya)-Mean(result.Baseline))/Mean(result.Baseline)*100)
		}
		_ = writer.Write([]string{result.Operation, strconv.Itoa(trials), baseStats[0], chainStats[0], overhead, baseStats[1], chainStats[1], baseStats[2], chainStats[2], baseStats[3], chainStats[3], baseStats[4], chainStats[4], result.Notes})
		fmt.Fprintf(&summary, "%s\nBaseline mean: %s ms\nNYAYA-CHAIN mean: %s ms\nOverhead: %s%%\nBaseline median/min/max/stddev: %s / %s / %s / %s ms\nNYAYA-CHAIN median/min/max/stddev: %s / %s / %s / %s ms\nNotes: %s\n\n", result.Operation, baseStats[0], chainStats[0], overhead, baseStats[1], baseStats[2], baseStats[3], baseStats[4], chainStats[1], chainStats[2], chainStats[3], chainStats[4], result.Notes)
	}
	writer.Flush()
	if err := writer.Error(); err != nil {
		file.Close()
		return err
	}
	if err := file.Close(); err != nil {
		return err
	}
	return os.WriteFile("results/application_summary.txt", []byte(summary.String()), 0644)
}

func statsStrings(values []float64) [5]string {
	out := [5]string{"", "", "", "", ""}
	if len(values) == 0 {
		return out
	}
	out[0] = fmt.Sprintf("%.6f", Mean(values))
	out[1] = fmt.Sprintf("%.6f", Median(values))
	out[2] = fmt.Sprintf("%.6f", Min(values))
	out[3] = fmt.Sprintf("%.6f", Max(values))
	out[4] = fmt.Sprintf("%.6f", StandardDeviation(values))
	return out
}
