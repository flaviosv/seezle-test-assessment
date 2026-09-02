package operations

import (
	"math"
	"strconv"
)

// evaluate is the entry point called by usecase.Calculate. It validates the
// expression at the whole-string level (non-empty, character whitelist)
// before delegating to parseExpression for the grammar/evaluation pass.
func evaluate(expr string) (float64, error) {
	if expr == "" {
		return 0, ErrEmptyExpression
	}
	for _, r := range expr {
		if !isAllowedChar(r) {
			return 0, ErrInvalidCharacter
		}
	}
	return parseExpression(expr)
}

func isAllowedChar(r rune) bool {
	switch {
	case r >= '0' && r <= '9':
		return true
	case r == '.' || r == '+' || r == '-' || r == '*' || r == '/' || r == '^' || r == '\\' || r == '%':
		return true
	default:
		return false
	}
}

// parseExpression parses and evaluates Expression := Term (BinaryOp Term)*
// strictly left to right, with no operator precedence.
func parseExpression(expr string) (float64, error) {
	result, pos, err := parseTerm(expr, 0)
	if err != nil {
		return 0, err
	}

	for pos < len(expr) {
		op := expr[pos]
		if !isBinaryOp(op) {
			return 0, ErrMalformedExpression
		}
		pos++

		var term float64
		term, pos, err = parseTerm(expr, pos)
		if err != nil {
			return 0, err
		}

		result, err = applyBinaryOp(result, op, term)
		if err != nil {
			return 0, err
		}
		if math.IsInf(result, 0) || math.IsNaN(result) {
			return 0, ErrNonFiniteResult
		}
	}

	return result, nil
}

func isBinaryOp(b byte) bool {
	switch b {
	case '+', '-', '*', '/', '^':
		return true
	default:
		return false
	}
}

func applyBinaryOp(left float64, op byte, right float64) (float64, error) {
	switch op {
	case '+':
		return left + right, nil
	case '-':
		return left - right, nil
	case '*':
		return left * right, nil
	case '/':
		if right == 0 {
			return 0, ErrDivideByZero
		}
		return left / right, nil
	case '^':
		return math.Pow(left, right), nil
	default:
		return 0, ErrMalformedExpression
	}
}

// parseTerm parses Term := Sign? Digit+ ('.' Digit+)? UnaryOp*, starting at
// pos — an operand-start position: index 0 of the whole expression, or
// immediately after a consumed BinaryOp, and never anywhere else. That
// call-site restriction is what makes "-" as Sign vs. BinaryOp fall out for
// free, with no separate lookahead/lookbehind rule (see design.md).
func parseTerm(expr string, pos int) (float64, int, error) {
	start := pos

	if pos < len(expr) && expr[pos] == '-' {
		pos++
	}

	digitsStart := pos
	for pos < len(expr) && isDigit(expr[pos]) {
		pos++
	}
	if pos == digitsStart {
		return 0, 0, ErrMalformedExpression
	}

	if pos < len(expr) && expr[pos] == '.' {
		pos++
		fracStart := pos
		for pos < len(expr) && isDigit(expr[pos]) {
			pos++
		}
		if pos == fracStart {
			return 0, 0, ErrMalformedExpression
		}
	}

	value, err := strconv.ParseFloat(expr[start:pos], 64)
	if err != nil {
		return 0, 0, ErrMalformedExpression
	}

	for pos < len(expr) && isUnaryOp(expr[pos]) {
		switch expr[pos] {
		case '%':
			value /= 100
		case '\\':
			if value < 0 {
				return 0, 0, ErrNegativeSqrt
			}
			value = math.Sqrt(value)
		}
		pos++

		if math.IsInf(value, 0) || math.IsNaN(value) {
			return 0, 0, ErrNonFiniteResult
		}
	}

	return value, pos, nil
}

func isDigit(b byte) bool {
	return b >= '0' && b <= '9'
}

func isUnaryOp(b byte) bool {
	return b == '%' || b == '\\'
}
