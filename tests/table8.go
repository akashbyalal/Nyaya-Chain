package main

import (
	"context"
	"encoding/csv"
	"fmt"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"
)

const defaultSecurityTrialCount = 30

type table8Summary struct {
	Test       string
	Procedure  string
	Trials     int
	Detected   int
	FalsePos   int
	LatencyMS  float64
	HasLatency bool
	Status     string
}

func securityTrialCount() int {
	value := strings.TrimSpace(os.Getenv("NYAYA_SECURITY_TRIALS"))
	if value == "" {
		return defaultSecurityTrialCount
	}
	count, err := strconv.Atoi(value)
	if err != nil || count < 1 || count > 100 {
		return defaultSecurityTrialCount
	}
	return count
}

func runTable8(ctx context.Context, cfg Config, backend *HTTPClient, sb *SupabaseClient, count int) ([]securityResult, error) {
	definitions := []table8Summary{
		{Test: "File modification", Procedure: "Modify registered file contents"},
		{Test: "File replacement", Procedure: "Replace file, keep evidence ID"},
		{Test: "Metadata modification", Procedure: "Change blockchain-bound FIR metadata in the disposable database record"},
		{Test: "Record deletion", Procedure: "Remove repository/database record; confirm blockchain registration survives"},
		{Test: "Unauthorized write", Procedure: "NOT IMPLEMENTED: current application has no identity-based write authorization"},
		{Test: "Unauthorized case transfer", Procedure: "NOT IMPLEMENTED: current application has no case-transfer authorization"},
	}
	lookup := make(map[string]*table8Summary, 4)
	for i := range definitions {
		lookup[definitions[i].Test] = &definitions[i]
	}

	trialPath := filepath.Join("results", "security_trials.csv")
	if err := os.MkdirAll(filepath.Dir(trialPath), 0755); err != nil {
		return nil, err
	}
	trialFile, err := os.Create(trialPath)
	if err != nil {
		return nil, fmt.Errorf("create Table 8 trial results: %w", err)
	}
	writer := csv.NewWriter(trialFile)
	if err := writer.Write([]string{"test_name", "trial_number", "detected", "false_positive", "latency_ms", "status", "error", "timestamp"}); err != nil {
		trialFile.Close()
		return nil, err
	}

	allResults := make([]securityResult, 0, count*4)
	operations := []struct {
		key string
		run func() securityResult
	}{}
	for trial := 1; trial <= count; trial++ {
		if err := ctx.Err(); err != nil {
			break
		}
		operations = []struct {
			key string
			run func() securityResult
		}{
			{"File modification", func() securityResult { return runEvidenceModification(ctx, cfg, backend, sb) }},
			{"File replacement", func() securityResult { return runEvidenceReplacement(ctx, cfg, backend, sb) }},
			{"Metadata modification", func() securityResult { return runMetadataManipulation(ctx, cfg, backend, sb) }},
			{"Record deletion", func() securityResult { return runDatabaseDeletion(ctx, cfg, backend, sb) }},
		}
		for _, operation := range operations {
			if err := ctx.Err(); err != nil {
				break
			}
			result := operation.run()
			result.Timestamp = time.Now().UTC().Format(time.RFC3339)
			summary := lookup[operation.key]
			summary.Trials++
			if result.Detected {
				summary.Detected++
			}
			if result.FalsePositive {
				summary.FalsePos++
			}
			if latency, err := strconv.ParseFloat(result.LatencyMS, 64); err == nil && result.LatencyMS != "" {
				summary.LatencyMS += latency
				summary.HasLatency = true
			}
			if result.Status != "PASS" {
				summary.Status = "PARTIAL/FAILED"
			}
			allResults = append(allResults, result)
			row := []string{summary.Test, strconv.Itoa(trial), strconv.FormatBool(result.Detected), strconv.FormatBool(result.FalsePositive), result.LatencyMS, result.Status, result.Error, result.Timestamp}
			if err := writer.Write(row); err != nil {
				trialFile.Close()
				return nil, fmt.Errorf("write Table 8 trial: %w", err)
			}
		}
	}
	writer.Flush()
	if err := writer.Error(); err != nil {
		trialFile.Close()
		return nil, err
	}
	if err := trialFile.Close(); err != nil {
		return nil, err
	}

	if err := writeTable8Summary(definitions, count); err != nil {
		return nil, err
	}
	aggregates := make([]securityResult, 0, 6)
	for _, summary := range definitions {
		result := newResult("T8", summary.Test, summary.Procedure)
		result.Status = summary.Status
		if result.Status == "" {
			result.Status = "PASS"
		}
		if summary.Test == "Unauthorized write" || summary.Test == "Unauthorized case transfer" {
			result.Status, result.Passed = "NOT IMPLEMENTED", "N/A"
			result.Actual = summary.Procedure
		} else {
			result.Detected = summary.Detected == summary.Trials && summary.Trials > 0
			result.Passed = fmt.Sprintf("%d/%d", summary.Detected, summary.Trials)
			rate := 0.0
			if summary.Trials > 0 {
				rate = float64(summary.Detected) * 100 / float64(summary.Trials)
			}
			result.Actual = fmt.Sprintf("detected=%d/%d; rate=%.2f%%; false_positives=%d; mean_detection_latency_ms=%s", summary.Detected, summary.Trials, rate, summary.FalsePos, meanLatency(summary))
			result.LatencyMS = meanLatency(summary)
			if summary.Trials == 0 {
				result.Status = "NOT RUN"
			} else if summary.Detected < summary.Trials || summary.Trials < count {
				result.Status = "PARTIAL/FAILED"
			}
		}
		aggregates = append(aggregates, result)
	}
	return aggregates, nil
}

func meanLatency(summary table8Summary) string {
	if !summary.HasLatency || summary.Trials == 0 {
		return ""
	}
	return fmt.Sprintf("%.3f", summary.LatencyMS/float64(summary.Trials))
}

func writeTable8Summary(rows []table8Summary, trialCount int) error {
	path := filepath.Join("results", "table8_summary.csv")
	file, err := os.Create(path)
	if err != nil {
		return err
	}
	writer := csv.NewWriter(file)
	if err := writer.Write([]string{"Test", "Procedure", "Trials", "Detected", "Rate", "Mean latency", "FP"}); err != nil {
		file.Close()
		return err
	}
	var summary strings.Builder
	fmt.Fprintf(&summary, "Table 8 — Tamper-detection and access-control results\nTrials per applicable test: %d\n\n", trialCount)
	for _, row := range rows {
		if row.Test == "Unauthorized write" || row.Test == "Unauthorized case transfer" {
			if err := writer.Write([]string{row.Test, row.Procedure, "N/A", "N/A", "N/A", "N/A", "N/A"}); err != nil {
				file.Close()
				return err
			}
			fmt.Fprintf(&summary, "%s\nStatus: NOT IMPLEMENTED\nProcedure: %s\n\n", row.Test, row.Procedure)
			continue
		}
		trials := row.Trials
		status := "PASS"
		if trials == 0 {
			status = "NOT RUN"
		} else if trials < trialCount || row.Detected < trials {
			status = "PARTIAL/FAILED"
		}
		detected := fmt.Sprintf("%d/%d", row.Detected, trials)
		rate := "N/A"
		if trials > 0 {
			rate = fmt.Sprintf("%.2f%%", float64(row.Detected)*100/float64(trials))
		}
		mean := meanLatency(row)
		if !row.HasLatency {
			mean = "N/A"
		}
		if err := writer.Write([]string{row.Test, row.Procedure, strconv.Itoa(trials), detected, rate, mean, strconv.Itoa(row.FalsePos)}); err != nil {
			file.Close()
			return err
		}
		if trials == 0 {
			detected, rate, mean = "N/A", "N/A", "N/A"
		}
		fmt.Fprintf(&summary, "%s\nStatus: %s\nProcedure: %s\nTrials: %d\nDetected: %s\nRate: %s\nMean detection latency: %s ms\nFalse positives: %d\n\n", row.Test, status, row.Procedure, trials, detected, rate, mean, row.FalsePos)
	}
	writer.Flush()
	if err := writer.Error(); err != nil {
		file.Close()
		return err
	}
	if err := file.Close(); err != nil {
		return err
	}
	return os.WriteFile(filepath.Join("results", "table8_summary.txt"), []byte(summary.String()), 0644)
}
