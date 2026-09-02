package operations

import "errors"

// evaluate is implemented in T6 (grammar engine: parseExpression/parseTerm).
//
// SPEC_DEVIATION: temporary stub — required so T5's usecase.go (which
// calls evaluate) compiles before T6 exists.
func evaluate(expr string) (float64, error) {
	return 0, errors.New("operations: not implemented")
}
