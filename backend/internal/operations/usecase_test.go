package operations

import (
	"encoding/json"
	"errors"
	"math"
	"strconv"
	"strings"
	"testing"
)

func newTestUseCase(t *testing.T) *UseCase {
	t.Helper()
	return NewUseCase()
}

// TestFormatResult_Rounding covers CALC-10: rounding to 10 significant
// digits and trailing-zero trim, across small/normal/large magnitudes.
func TestFormatResult_Rounding(t *testing.T) {
	tests := []struct {
		name  string
		value float64
		want  string
	}{
		{name: "very small magnitude rounds to 10 significant digits", value: 0.00012345678901, want: "0.000123456789"},
		{name: "normal magnitude rounds to 10 significant digits", value: 1.23456789012345, want: "1.23456789"},
		{name: "large magnitude rounds to 10 significant digits", value: 123456789.012345, want: "123456789"},
		{name: "trailing zero trimmed for whole number (1.0 -> 1)", value: 1.0, want: "1"},
		{name: "trailing zero trimmed for decimal (0.50 -> 0.5)", value: 0.50, want: "0.5"},
		{name: "negative value preserves sign", value: -3.0, want: "-3"},
		{name: "exact zero skips the log10-based rounding formula", value: 0, want: "0"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := formatResult(tt.value)
			if err != nil {
				t.Fatalf("formatResult(%v) unexpected error: %v", tt.value, err)
			}
			if string(got) != tt.want {
				t.Fatalf("formatResult(%v) = %q, want %q", tt.value, got, tt.want)
			}
		})
	}
}

// TestFormatResult_NoScientificNotation covers CALC-10's "never rendered in
// scientific notation" requirement for a very large magnitude, where Go's
// default float64 marshaling would otherwise use the 'e' exponent form.
func TestFormatResult_NoScientificNotation(t *testing.T) {
	const value = 123456789012345.0

	got, err := formatResult(value)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	s := string(got)
	if strings.ContainsAny(s, "eE") {
		t.Fatalf("formatResult(%v) = %q, contains scientific notation", value, s)
	}

	parsed, err := strconv.ParseFloat(s, 64)
	if err != nil {
		t.Fatalf("formatResult output %q is not a valid float: %v", s, err)
	}
	const relTolerance = 1e-9
	if math.Abs(parsed-value)/value > relTolerance {
		t.Fatalf("formatResult(%v) = %q (%v), too far from original after 10-sig-fig rounding", value, s, parsed)
	}
}

// TestFormatResult_NonFinite covers formatResult's own non-finite guard
// (T5 Done-when: "Rejects non-finite (Infinity/NaN) as ErrNonFiniteResult"),
// exercised directly since it is unreachable via Calculate (evaluate already
// guards finiteness beforehand) but is part of formatResult's own contract.
func TestFormatResult_NonFinite(t *testing.T) {
	tests := []struct {
		name  string
		value float64
	}{
		{name: "positive infinity", value: math.Inf(1)},
		{name: "negative infinity", value: math.Inf(-1)},
		{name: "NaN", value: math.NaN()},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := formatResult(tt.value)
			if !errors.Is(err, ErrNonFiniteResult) {
				t.Fatalf("formatResult(%v) error = %v, want ErrNonFiniteResult", tt.value, err)
			}
		})
	}
}

// TestUseCase_Calculate_JSONNumberRoundTrip covers AD-004/CALC-10: the
// returned json.Number must itself be a syntactically valid JSON number
// that round-trips through strconv.ParseFloat.
func TestUseCase_Calculate_JSONNumberRoundTrip(t *testing.T) {
	uc := newTestUseCase(t)

	result, err := uc.Calculate("2+2")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	parsed, err := strconv.ParseFloat(result.String(), 64)
	if err != nil {
		t.Fatalf("result %q does not round-trip via ParseFloat: %v", result, err)
	}
	if parsed != 4 {
		t.Fatalf("result round-tripped to %v, want 4", parsed)
	}
}

// TestUseCase_Calculate_MarshalsAsUnquotedNumber covers AD-004: result must
// marshal as a raw JSON number literal, not a quoted string.
func TestUseCase_Calculate_MarshalsAsUnquotedNumber(t *testing.T) {
	uc := newTestUseCase(t)

	result, err := uc.Calculate("2+2")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	type wrapper struct {
		Result json.Number `json:"result"`
	}
	b, err := json.Marshal(wrapper{Result: result})
	if err != nil {
		t.Fatalf("marshal error: %v", err)
	}

	want := `{"result":4}`
	if string(b) != want {
		t.Fatalf("marshaled JSON = %s, want %s (result must be an unquoted number)", b, want)
	}
}

// TestUseCase_Calculate_NegativeResultFormatting is a sanity check that
// formatResult's negative-sign handling flows correctly through Calculate.
func TestUseCase_Calculate_NegativeResultFormatting(t *testing.T) {
	uc := newTestUseCase(t)

	result, err := uc.Calculate("2-5")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if string(result) != "-3" {
		t.Fatalf("Calculate(\"2-5\") result = %q, want \"-3\"", result)
	}
}

// TestUseCase_Calculate_ErrorPassthrough covers "any error from evaluate()
// ... is returned unchanged": every sentinel error type must pass through
// Calculate untouched, with an empty result.
func TestUseCase_Calculate_ErrorPassthrough(t *testing.T) {
	tests := []struct {
		name      string
		operation string
		wantErr   error
	}{
		{name: "empty expression passes through unchanged", operation: "", wantErr: ErrEmptyExpression},
		{name: "invalid character passes through unchanged", operation: "2+a", wantErr: ErrInvalidCharacter},
		{name: "malformed expression passes through unchanged", operation: "5+", wantErr: ErrMalformedExpression},
		{name: "divide by zero passes through unchanged", operation: "5/0", wantErr: ErrDivideByZero},
		{name: "modulo by zero passes through unchanged", operation: "5%0", wantErr: ErrModuloByZero},
		{name: "negative sqrt passes through unchanged", operation: "-4\\", wantErr: ErrNegativeSqrt},
		{name: "non-finite result passes through unchanged", operation: "9999999999^9999999999", wantErr: ErrNonFiniteResult},
	}

	uc := newTestUseCase(t)
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := uc.Calculate(tt.operation)
			if !errors.Is(err, tt.wantErr) {
				t.Fatalf("Calculate(%q) error = %v, want %v", tt.operation, err, tt.wantErr)
			}
			if result != "" {
				t.Fatalf("Calculate(%q) result = %q, want empty on error", tt.operation, result)
			}
		})
	}
}
