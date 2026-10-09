package main

import "time"

// FIR is a generic FIR record returned by the application API.
type FIR struct {
	ID        string    `json:"id,omitempty"`
	FIRNumber string    `json:"firNumber,omitempty"`
	Status    string    `json:"status,omitempty"`
	CreatedAt time.Time `json:"createdAt,omitempty"`
}

// Evidence describes evidence metadata without assuming application-specific fields.
type Evidence struct {
	ID        string    `json:"id,omitempty"`
	FIRNumber string    `json:"firNumber,omitempty"`
	FileName  string    `json:"fileName,omitempty"`
	FileHash  string    `json:"fileHash,omitempty"`
	CreatedAt time.Time `json:"createdAt,omitempty"`
}

type VerificationResult struct {
	Verified bool   `json:"verified"`
	FileHash string `json:"fileHash,omitempty"`
	Message  string `json:"message,omitempty"`
}

type BlockchainResult struct {
	FileHash   string        `json:"fileHash,omitempty"`
	FIRNumber  string        `json:"firNumber,omitempty"`
	TxHash     string        `json:"txHash,omitempty"`
	Timestamp  time.Time     `json:"timestamp,omitempty"`
	UploadedBy string        `json:"uploadedBy,omitempty"`
	Latency    time.Duration `json:"latency,omitempty"`
	GasUsed    uint64        `json:"gasUsed,omitempty"`
	Success    bool          `json:"success"`
	Error      string        `json:"error,omitempty"`
}

type BenchmarkResult struct {
	Name         string        `json:"name"`
	Trials       int           `json:"trials"`
	SuccessCount int           `json:"successCount"`
	FailureCount int           `json:"failureCount"`
	Mean         float64       `json:"mean"`
	Median       float64       `json:"median"`
	Min          float64       `json:"min"`
	Max          float64       `json:"max"`
	StdDev       float64       `json:"standardDeviation"`
	FailureRate  float64       `json:"failureRate"`
	Throughput   float64       `json:"throughput"`
	Elapsed      time.Duration `json:"elapsed,omitempty"`
}
