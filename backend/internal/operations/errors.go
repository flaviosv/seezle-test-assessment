package operations

import "errors"

// Sentinel errors for the operations slice. All map to 400 (AD-002: no
// status-dispatch table — direct c.JSON(400, ...) at the handler); kept
// distinct only so tests can assert *which* rule fired via errors.Is.
var (
	ErrEmptyExpression     = errors.New("operations: expression is empty")
	ErrInvalidCharacter    = errors.New("operations: expression contains an invalid character")
	ErrMalformedExpression = errors.New("operations: expression does not match the grammar")
	ErrDivideByZero        = errors.New("operations: division by zero")
	ErrNegativeSqrt        = errors.New("operations: square root of a negative number")
	ErrNonFiniteResult     = errors.New("operations: result is not a finite number")
)
