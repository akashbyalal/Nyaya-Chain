package main

import (
	"encoding/csv"
	"fmt"
	"os"
	"path/filepath"
)

// WriteCSV writes a header and rows, creating the destination directory if needed.
func WriteCSV(path string, headers []string, rows [][]string) error {
	if len(headers) == 0 {
		return fmt.Errorf("write CSV %q: headers must not be empty", path)
	}
	if err := os.MkdirAll(filepath.Dir(path), 0755); err != nil {
		return fmt.Errorf("create results directory: %w", err)
	}
	file, err := os.Create(path)
	if err != nil {
		return fmt.Errorf("create CSV %q: %w", path, err)
	}
	writer := csv.NewWriter(file)
	if err := writer.Write(headers); err != nil {
		file.Close()
		return fmt.Errorf("write CSV header: %w", err)
	}
	for index, row := range rows {
		if len(row) != len(headers) {
			file.Close()
			return fmt.Errorf("CSV row %d has %d fields; expected %d", index+1, len(row), len(headers))
		}
		if err := writer.Write(row); err != nil {
			file.Close()
			return fmt.Errorf("write CSV row %d: %w", index+1, err)
		}
	}
	writer.Flush()
	if err := writer.Error(); err != nil {
		file.Close()
		return fmt.Errorf("flush CSV: %w", err)
	}
	if err := file.Close(); err != nil {
		return fmt.Errorf("close CSV: %w", err)
	}
	return nil
}
