package operations

import (
	"encoding/json"
	"math"
	"strconv"
	"strings"
)

const resultSignificantDigits = 10

// UseCase orchestrates the operations slice's business logic. Stateless — no
// fields — since this service has no persistence.
type UseCase struct{}

func NewUseCase() *UseCase {
	return &UseCase{}
}

// Calculate parses and evaluates operation (via evaluate, T6), then rounds
// and formats the result. Any evaluate error is returned unchanged.
func (uc *UseCase) Calculate(operation string) (json.Number, error) {
	value, err := evaluate(operation)
	if err != nil {
		return "", err
	}
	return formatResult(value)
}

// formatResult rounds v to resultSignificantDigits significant digits and
// renders it as a JSON number literal: fixed-point (never scientific
// notation, CALC-10) via strconv.FormatFloat's 'f' verb, with trailing
// zeros trimmed.
func formatResult(v float64) (json.Number, error) {
	if math.IsInf(v, 0) || math.IsNaN(v) {
		return "", ErrNonFiniteResult
	}

	rounded := roundToSignificantDigits(v, resultSignificantDigits)
	s := strconv.FormatFloat(rounded, 'f', -1, 64)
	return json.Number(trimTrailingZeros(s)), nil
}

// roundToSignificantDigits rounds v to digits significant digits using the
// standard magnitude := 10^(digits - ceil(log10(|v|))) technique. v == 0 is
// special-cased since log10(0) is undefined for that formula.
func roundToSignificantDigits(v float64, digits int) float64 {
	if v == 0 {
		return 0
	}
	power := float64(digits) - math.Ceil(math.Log10(math.Abs(v)))
	magnitude := math.Pow(10, power)
	return math.Round(v*magnitude) / magnitude
}

// trimTrailingZeros defensively strips trailing zeros (and a now-bare
// trailing '.') for the rare case rounding produces an exact
// trailing-zero literal — strconv.FormatFloat's shortest round-trip
// representation ('f', -1, 64) already avoids this in the common case.
func trimTrailingZeros(s string) string {
	if !strings.Contains(s, ".") {
		return s
	}
	s = strings.TrimRight(s, "0")
	return strings.TrimSuffix(s, ".")
}
