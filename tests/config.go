package main

import (
	"fmt"
	"net/url"
	"os"
	"path/filepath"
	"strings"
)

const (
	DefaultBackendURL       = "http://localhost:4000"
	EvidenceRegistryAddress = "0xbeDeFB98AB802E8a99a4d5F8f7D26c28242d890f"
)

// Config contains runtime endpoints and credentials. Secrets are read only from
// the environment and should never be included in logs or result files.
type Config struct {
	BackendURL             string
	SupabaseURL            string
	SupabaseServiceRoleKey string
	SepoliaRPCURL          string
	SepoliaPrivateKey      string
}

// LoadConfig reads configuration from the environment. Credentials remain
// optional until an experiment that needs them is implemented.
func LoadConfig() (Config, error) {
	loadBackendEnvFile()
	cfg := Config{
		BackendURL:             strings.TrimSpace(os.Getenv("NYAYA_BACKEND_URL")),
		SupabaseURL:            strings.TrimSpace(os.Getenv("SUPABASE_URL")),
		SupabaseServiceRoleKey: os.Getenv("SUPABASE_SERVICE_ROLE_KEY"),
		SepoliaRPCURL:          strings.TrimSpace(os.Getenv("SEPOLIA_RPC_URL")),
		SepoliaPrivateKey:      os.Getenv("SEPOLIA_PRIVATE_KEY"),
	}
	if cfg.BackendURL == "" {
		cfg.BackendURL = DefaultBackendURL
	}
	parsed, err := url.ParseRequestURI(cfg.BackendURL)
	if err != nil || parsed.Host == "" || (parsed.Scheme != "http" && parsed.Scheme != "https") {
		return Config{}, fmt.Errorf("invalid NYAYA_BACKEND_URL: expected an absolute http or https URL")
	}
	cfg.BackendURL = strings.TrimRight(cfg.BackendURL, "/")
	return cfg, nil
}

// loadBackendEnvFile mirrors the backend's dotenv behavior for local harness runs.
// Existing process environment variables always take precedence. Values are
// never printed; this only makes the backend's configured test credentials
// available to the separate Go process.
func loadBackendEnvFile() {
	paths := []string{filepath.Join("..", "backend", ".env"), filepath.Join("backend", ".env")}
	var content []byte
	for _, candidate := range paths {
		data, err := os.ReadFile(candidate)
		if err == nil {
			content = data
			break
		}
	}
	if content == nil {
		return
	}
	for _, line := range strings.Split(string(content), "\n") {
		line = strings.TrimSpace(strings.TrimSuffix(line, "\r"))
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		line = strings.TrimPrefix(line, "export ")
		name, value, ok := strings.Cut(line, "=")
		if !ok {
			continue
		}
		name, value = strings.TrimSpace(name), strings.TrimSpace(value)
		if len(value) >= 2 && ((value[0] == '"' && value[len(value)-1] == '"') || (value[0] == '\'' && value[len(value)-1] == '\'')) {
			value = value[1 : len(value)-1]
		}
		if value != "" && os.Getenv(name) == "" {
			_ = os.Setenv(name, value)
		}
	}
}
