package main

import (
	"math"
	"sort"
	"time"
)

func Mean(values []float64) float64 {
	if len(values) == 0 {
		return math.NaN()
	}
	var sum float64
	for _, value := range values {
		sum += value
	}
	return sum / float64(len(values))
}

func Median(values []float64) float64 {
	if len(values) == 0 {
		return math.NaN()
	}
	sorted := append([]float64(nil), values...)
	sort.Float64s(sorted)
	middle := len(sorted) / 2
	if len(sorted)%2 == 1 {
		return sorted[middle]
	}
	return (sorted[middle-1] + sorted[middle]) / 2
}

func Min(values []float64) float64 {
	if len(values) == 0 {
		return math.NaN()
	}
	min := values[0]
	for _, value := range values[1:] {
		if value < min {
			min = value
		}
	}
	return min
}

func Max(values []float64) float64 {
	if len(values) == 0 {
		return math.NaN()
	}
	max := values[0]
	for _, value := range values[1:] {
		if value > max {
			max = value
		}
	}
	return max
}

// StandardDeviation returns the population standard deviation.
func StandardDeviation(values []float64) float64 {
	if len(values) == 0 {
		return math.NaN()
	}
	mean := Mean(values)
	var squaredDifferences float64
	for _, value := range values {
		difference := value - mean
		squaredDifferences += difference * difference
	}
	return math.Sqrt(squaredDifferences / float64(len(values)))
}

// SuccessRate and FailureRate return proportions from 0 to 1; zero trials yield NaN.
func SuccessRate(successes, total int) float64 {
	if total <= 0 {
		return math.NaN()
	}
	return float64(successes) / float64(total)
}

func FailureRate(failures, total int) float64 {
	if total <= 0 {
		return math.NaN()
	}
	return float64(failures) / float64(total)
}

// Throughput returns completed operations per second.
func Throughput(completed int, elapsed time.Duration) float64 {
	if elapsed <= 0 {
		return math.NaN()
	}
	return float64(completed) / elapsed.Seconds()
}
