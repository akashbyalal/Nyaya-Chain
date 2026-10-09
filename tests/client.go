package main

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"
)

// HTTPClient sends requests relative to a configurable base URL.
type HTTPClient struct {
	baseURL string
	client  *http.Client
}

// NewHTTPClient creates a client with a 30-second timeout.
func NewHTTPClient(baseURL string) (*HTTPClient, error) {
	parsed, err := url.ParseRequestURI(strings.TrimRight(baseURL, "/"))
	if err != nil || parsed.Host == "" || (parsed.Scheme != "http" && parsed.Scheme != "https") {
		return nil, fmt.Errorf("invalid base URL: expected an absolute http or https URL")
	}
	return &HTTPClient{baseURL: strings.TrimRight(baseURL, "/"), client: &http.Client{Timeout: 30 * time.Second}}, nil
}

// Do sends a request and returns the HTTP status and complete response body.
// Non-2xx responses are returned without converting them into transport errors.
func (c *HTTPClient) Do(method, path string, body []byte, contentType string) (int, []byte, error) {
	return c.DoContext(context.Background(), method, path, body, contentType)
}

func (c *HTTPClient) DoContext(ctx context.Context, method, path string, body []byte, contentType string) (int, []byte, error) {
	if c == nil || c.client == nil {
		return 0, nil, fmt.Errorf("HTTP client is not initialized")
	}
	requestURL, err := url.JoinPath(c.baseURL, path)
	if err != nil {
		return 0, nil, fmt.Errorf("build request URL: %w", err)
	}
	req, err := http.NewRequestWithContext(ctx, method, requestURL, bytes.NewReader(body))
	if err != nil {
		return 0, nil, fmt.Errorf("create %s request: %w", method, err)
	}
	if contentType != "" {
		req.Header.Set("Content-Type", contentType)
	}
	resp, err := c.client.Do(req)
	if err != nil {
		return 0, nil, fmt.Errorf("send %s %s: %w", method, requestURL, err)
	}
	defer resp.Body.Close()
	responseBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return resp.StatusCode, nil, fmt.Errorf("read %s response: %w", method, err)
	}
	return resp.StatusCode, responseBody, nil
}

func (c *HTTPClient) Get(path string) (int, []byte, error) {
	return c.Do(http.MethodGet, path, nil, "")
}

func (c *HTTPClient) Post(path string, body []byte, contentType string) (int, []byte, error) {
	return c.Do(http.MethodPost, path, body, contentType)
}

func (c *HTTPClient) Patch(path string, body []byte, contentType string) (int, []byte, error) {
	return c.Do(http.MethodPatch, path, body, contentType)
}

func (c *HTTPClient) Delete(path string) (int, []byte, error) {
	return c.Do(http.MethodDelete, path, nil, "")
}
