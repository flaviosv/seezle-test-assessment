package operations

import (
	"errors"
	"math"
	"testing"
)

// floatTolerance bounds float64 comparison error for value assertions
// (evaluate returns float64 arithmetic that can carry tiny representation
// error, e.g. from repeated division/sqrt chains).
const floatTolerance = 1e-10

func TestEvaluate(t *testing.T) {
	tests := []struct {
		name      string
		input     string
		wantValue float64
		wantErr   error
	}{
		// CALC-01, CALC-07: left-to-right, no precedence.
		{name: "simple addition (design.md worked example)", input: "2+2", wantValue: 4},
		{name: "multiple binary ops fold left to right", input: "2+3+4", wantValue: 9},
		{name: "no operator precedence: + before * evaluates left to right", input: "2+3*4", wantValue: 20},
		{name: "multiplication operator", input: "2*3", wantValue: 6},
		{name: "subtraction operator", input: "5-3", wantValue: 2},
		{name: "division operator", input: "6/3", wantValue: 2},
		{name: "power operator", input: "2^3", wantValue: 8},

		// CALC-02/03/04: postfix unary ops bind to their own Term only.
		{name: "chained postfix ops on single term (design.md worked example)", input: "16\\%", wantValue: 0.04},
		{name: "postfix op does not apply to prior term's folded value (spec-corrected)", input: "4+16\\", wantValue: 8},
		{name: "postfix op order matters within a term (spec-corrected)", input: "16%\\", wantValue: 0.4},
		{name: "postfix op binds to own term across a preceding binary op", input: "3+-4\\", wantValue: 0, wantErr: ErrNegativeSqrt},

		// CALC-05: contextual sign.
		{name: "leading sign at expression start", input: "-5+3", wantValue: -2},
		{name: "double minus: subtraction then negative operand", input: "5--3", wantValue: 8},
		{name: "sign after multiplication operator", input: "2*-3", wantValue: -6},
		{name: "sign after power operator", input: "2^-3", wantValue: 0.125},

		// CALC-06: double sign rejected.
		{name: "double consecutive sign rejected", input: "5---3", wantErr: ErrMalformedExpression},

		// Modulo: '%' is contextual — a digit immediately after it makes it
		// BinaryOp modulo instead of the postfix percent UnaryOp.
		{name: "modulo of two positive terms", input: "10%9", wantValue: 1},
		{name: "modulo folds into the running total like other binary ops", input: "8^6*3%9+0", wantValue: 3},
		{name: "modulo with a negative left operand (Go Mod sign convention)", input: "-10%3", wantValue: -1},
		{name: "modulo applies to a preceding postfix sqrt's own value", input: "16\\%9", wantValue: 4},
		{name: "percent still wins when % is not followed by a digit", input: "5%+3", wantValue: 3.05},
		{name: "modulo by zero rejected", input: "10%0", wantErr: ErrModuloByZero},

		// CALC-08/09: divide-by-zero, negative-sqrt.
		{name: "divide by zero", input: "5/0", wantErr: ErrDivideByZero},
		{name: "sqrt of negative single term", input: "-4\\", wantErr: ErrNegativeSqrt},
		{name: "sign + postfix combo: negative sqrt fires before percent", input: "-16\\%", wantErr: ErrNegativeSqrt},
		{name: "divide by a term that evaluates to zero via chained postfix", input: "5/0%", wantErr: ErrDivideByZero},

		// CALC-11: non-finite overflow.
		{name: "extreme exponentiation overflows to non-finite", input: "9999999999^9999999999", wantErr: ErrNonFiniteResult},

		// API-03: empty, invalid character.
		{name: "empty expression rejected", input: "", wantErr: ErrEmptyExpression},
		{name: "invalid character rejected", input: "2+a", wantErr: ErrInvalidCharacter},
		{name: "whitespace is an invalid character", input: "2 + 2", wantErr: ErrInvalidCharacter},

		// Edge cases: single Term, no BinaryOp (zero-or-more).
		{name: "single term: plain integer", input: "42", wantValue: 42},
		{name: "single term: negative integer", input: "-5", wantValue: -5},
		{name: "single term: postfix sqrt", input: "9\\", wantValue: 3},
		{name: "single term: postfix percent", input: "50%", wantValue: 0.5},
		{name: "single term: postfix percent on zero", input: "0%", wantValue: 0},
		{name: "single term: postfix sqrt on zero", input: "0\\", wantValue: 0},
		{name: "decimal digits on both operands", input: "2.5+1.5", wantValue: 4},

		// Edge cases: grammar mismatches (API-04/05).
		{name: "double decimal point rejected", input: "1.2.3", wantErr: ErrMalformedExpression},
		{name: "decimal missing leading digit rejected", input: ".5", wantErr: ErrMalformedExpression},
		{name: "decimal missing trailing digit rejected", input: "5.", wantErr: ErrMalformedExpression},
		{name: "consecutive binary ops rejected", input: "5+*3", wantErr: ErrMalformedExpression},
		{name: "leading binop + rejected (no left operand)", input: "+5", wantErr: ErrMalformedExpression},
		{name: "leading binop * rejected (no left operand)", input: "*5", wantErr: ErrMalformedExpression},
		{name: "leading binop / rejected (no left operand)", input: "/5", wantErr: ErrMalformedExpression},
		{name: "leading binop ^ rejected (no left operand)", input: "^5", wantErr: ErrMalformedExpression},
		{name: "leading unary op \\ rejected (cannot start a term)", input: "\\5", wantErr: ErrMalformedExpression},
		{name: "leading unary op % rejected (cannot start a term)", input: "%5", wantErr: ErrMalformedExpression},
		{name: "trailing binop rejected (no following term)", input: "1+1+", wantErr: ErrMalformedExpression},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := evaluate(tt.input)

			if tt.wantErr != nil {
				if !errors.Is(err, tt.wantErr) {
					t.Fatalf("evaluate(%q) error = %v, want %v", tt.input, err, tt.wantErr)
				}
				return
			}

			if err != nil {
				t.Fatalf("evaluate(%q) unexpected error: %v", tt.input, err)
			}
			if math.Abs(got-tt.wantValue) > floatTolerance {
				t.Fatalf("evaluate(%q) = %v, want %v", tt.input, got, tt.wantValue)
			}
		})
	}
}
