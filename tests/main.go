package main

import (
	"fmt"
	"os"
)

func usage() {
	fmt.Fprintln(os.Stderr, "Nyaya-Chain Test Harness")
	fmt.Fprintln(os.Stderr, "Usage:")
	fmt.Fprintln(os.Stderr, "  go run . security")
	fmt.Fprintln(os.Stderr, "  go run . application")
	fmt.Fprintln(os.Stderr, "  go run . blockchain")
	fmt.Fprintln(os.Stderr, "  go run . all")
}

func main() {
	if len(os.Args) < 2 {
		usage()
		return
	}

	switch os.Args[1] {
	case "security":
		RunSecurityTests()
	case "application":
		RunApplicationTests()
	case "blockchain":
		RunBlockchainTests()
	case "all":
		RunSecurityTests()
		RunApplicationTests()
		RunBlockchainTests()
	default:
		fmt.Fprintf(os.Stderr, "Unknown test suite: %s\n", os.Args[1])
		usage()
		os.Exit(2)
	}
}
