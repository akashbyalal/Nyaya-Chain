package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"net/url"
	"path"
	"strings"
	"time"
)

type SupabaseClient struct {
	baseURL string
	key     string
	client  *http.Client
}

func NewSupabaseClient(baseURL, serviceKey string) (*SupabaseClient, error) {
	if strings.TrimSpace(baseURL) == "" || strings.TrimSpace(serviceKey) == "" {
		return nil, fmt.Errorf("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for security experiments")
	}
	parsed, err := url.ParseRequestURI(strings.TrimRight(baseURL, "/"))
	if err != nil || parsed.Host == "" || (parsed.Scheme != "http" && parsed.Scheme != "https") {
		return nil, fmt.Errorf("invalid SUPABASE_URL")
	}
	return &SupabaseClient{baseURL: strings.TrimRight(baseURL, "/"), key: serviceKey, client: &http.Client{Timeout: 60 * time.Second}}, nil
}

func (s *SupabaseClient) request(ctx context.Context, method, endpoint string, body []byte, headers map[string]string) (int, []byte, error) {
	req, err := http.NewRequestWithContext(ctx, method, s.baseURL+endpoint, bytes.NewReader(body))
	if err != nil {
		return 0, nil, fmt.Errorf("create Supabase request: %w", err)
	}
	req.Header.Set("apikey", s.key)
	req.Header.Set("Authorization", "Bearer "+s.key)
	for name, value := range headers {
		req.Header.Set(name, value)
	}
	resp, err := s.client.Do(req)
	if err != nil {
		return 0, nil, fmt.Errorf("Supabase request failed: %w", err)
	}
	defer resp.Body.Close()
	responseBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return resp.StatusCode, nil, fmt.Errorf("read Supabase response: %w", err)
	}
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return resp.StatusCode, responseBody, fmt.Errorf("Supabase returned HTTP %d: %s", resp.StatusCode, truncateBody(responseBody))
	}
	return resp.StatusCode, responseBody, nil
}

func truncateBody(body []byte) string {
	const limit = 700
	text := strings.TrimSpace(string(body))
	if len(text) > limit {
		return text[:limit] + "…"
	}
	return text
}

func (s *SupabaseClient) CreateTestFIR(ctx context.Context, firNumber string) (string, error) {
	payload := map[string]string{
		"fir_number":        firNumber,
		"complainant_name":  "Nyaya-Chain Security Harness",
		"complainant_email": "security-harness@example.invalid",
		"incident_date":     time.Now().UTC().Format("2006-01-02"),
		"location":          "Automated security test environment",
		"description":       "Disposable automated security experiment record. This record is not a real complaint and is used only to validate evidence integrity behavior.",
	}
	encoded, _ := json.Marshal(payload)
	_, body, err := s.request(ctx, http.MethodPost, "/rest/v1/firs?select=id,fir_number", encoded, map[string]string{"Content-Type": "application/json", "Prefer": "return=representation"})
	if err != nil {
		return "", fmt.Errorf("create disposable FIR: %w", err)
	}
	var records []struct {
		ID string `json:"id"`
	}
	if err := json.Unmarshal(body, &records); err != nil || len(records) != 1 || records[0].ID == "" {
		return "", fmt.Errorf("create disposable FIR: unexpected Supabase response")
	}
	return records[0].ID, nil
}

func (s *SupabaseClient) PatchFIRNumber(ctx context.Context, id, firNumber string) error {
	encoded, _ := json.Marshal(map[string]string{"fir_number": firNumber})
	_, _, err := s.request(ctx, http.MethodPatch, "/rest/v1/firs?id=eq."+url.QueryEscape(id), encoded, map[string]string{"Content-Type": "application/json", "Prefer": "return=minimal"})
	if err != nil {
		return fmt.Errorf("update harness FIR metadata: %w", err)
	}
	return nil
}

func (s *SupabaseClient) PatchEvidence(ctx context.Context, id string, fields map[string]string) error {
	encoded, _ := json.Marshal(fields)
	_, _, err := s.request(ctx, http.MethodPatch, "/rest/v1/evidence?id=eq."+url.QueryEscape(id), encoded, map[string]string{"Content-Type": "application/json", "Prefer": "return=minimal"})
	if err != nil {
		return fmt.Errorf("update harness evidence metadata: %w", err)
	}
	return nil
}

func (s *SupabaseClient) DeleteEvidence(ctx context.Context, id string) error {
	_, body, err := s.request(ctx, http.MethodDelete, "/rest/v1/evidence?id=eq."+url.QueryEscape(id)+"&select=id", nil, map[string]string{"Prefer": "return=representation"})
	if err != nil {
		return fmt.Errorf("delete harness evidence row: %w", err)
	}
	var records []struct {
		ID string `json:"id"`
	}
	if err := json.Unmarshal(body, &records); err != nil || len(records) != 1 || records[0].ID != id {
		return fmt.Errorf("delete harness evidence row: expected exactly one matching record to be removed")
	}
	return nil
}

func (s *SupabaseClient) DeleteFIR(ctx context.Context, id string) error {
	_, _, err := s.request(ctx, http.MethodDelete, "/rest/v1/firs?id=eq."+url.QueryEscape(id), nil, nil)
	if err != nil {
		return fmt.Errorf("delete harness FIR: %w", err)
	}
	return nil
}

func (s *SupabaseClient) UploadReplacement(ctx context.Context, storagePath, contentType string, data []byte) error {
	endpoint := "/storage/v1/object/evidence/" + escapeStoragePath(storagePath)
	_, _, err := s.request(ctx, http.MethodPut, endpoint, data, map[string]string{"Content-Type": contentType, "x-upsert": "true"})
	if err != nil {
		return fmt.Errorf("replace harness evidence object: %w", err)
	}
	return nil
}

func escapeStoragePath(value string) string {
	parts := strings.Split(path.Clean("/"+value), "/")
	for i := range parts {
		parts[i] = url.PathEscape(parts[i])
	}
	return strings.TrimLeft(strings.Join(parts, "/"), "/")
}

func (s *SupabaseClient) DeleteStorageObject(ctx context.Context, storagePath string) error {
	payload, _ := json.Marshal(map[string][]string{"prefixes": {storagePath}})
	_, _, err := s.request(ctx, http.MethodDelete, "/storage/v1/object/evidence", payload, map[string]string{"Content-Type": "application/json"})
	if err != nil {
		return fmt.Errorf("delete harness evidence storage object: %w", err)
	}
	return nil
}

func makeEvidenceMultipart(firID, filename, contentType string, data []byte) (string, []byte, error) {
	var body bytes.Buffer
	writer := multipart.NewWriter(&body)
	if err := writer.WriteField("firId", firID); err != nil {
		return "", nil, err
	}
	header := make(map[string][]string)
	header["Content-Disposition"] = []string{fmt.Sprintf(`form-data; name="file"; filename=%q`, filename)}
	header["Content-Type"] = []string{contentType}
	part, err := writer.CreatePart(header)
	if err != nil {
		return "", nil, err
	}
	if _, err := part.Write(data); err != nil {
		return "", nil, err
	}
	if err := writer.Close(); err != nil {
		return "", nil, err
	}
	return writer.FormDataContentType(), body.Bytes(), nil
}

// UploadBaselineEvidence stores a disposable file and metadata without invoking the blockchain.
func (s *SupabaseClient) UploadBaselineEvidence(ctx context.Context, fixture *testFixture, filename, storagePath, fileHash string, data []byte) (string, error) {
	if _, _, err := s.request(ctx, http.MethodPost, "/storage/v1/object/evidence/"+escapeStoragePath(storagePath), data, map[string]string{"Content-Type": "text/plain"}); err != nil {
		return "", fmt.Errorf("centralized baseline storage upload: %w", err)
	}
	payload, _ := json.Marshal(map[string]string{"fir_id": fixture.firID, "file_name": filename, "file_type": "text/plain", "storage_path": storagePath, "file_hash": fileHash})
	_, body, err := s.request(ctx, http.MethodPost, "/rest/v1/evidence?select=id", payload, map[string]string{"Content-Type": "application/json", "Prefer": "return=representation"})
	if err != nil {
		_ = s.DeleteStorageObject(ctx, storagePath)
		return "", fmt.Errorf("centralized baseline metadata insert: %w", err)
	}
	var records []struct {
		ID string `json:"id"`
	}
	if err := json.Unmarshal(body, &records); err != nil || len(records) != 1 || records[0].ID == "" {
		return "", fmt.Errorf("centralized baseline insert returned an unexpected response")
	}
	_ = fixture
	_ = data
	return records[0].ID, nil
}

func (s *SupabaseClient) DownloadStorageObject(ctx context.Context, storagePath string) ([]byte, error) {
	_, body, err := s.request(ctx, http.MethodGet, "/storage/v1/object/evidence/"+escapeStoragePath(storagePath), nil, nil)
	if err != nil {
		return nil, fmt.Errorf("download centralized baseline object: %w", err)
	}
	return body, nil
}
