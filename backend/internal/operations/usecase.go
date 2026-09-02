package operations

import (
	"encoding/json"
	"errors"
)

// UseCase orchestrates the operations slice's business logic. Stateless — no
// fields — since this service has no persistence.
type UseCase struct{}

func NewUseCase() *UseCase {
	return &UseCase{}
}

// Calculate is implemented in T5 (parses/evaluates via T6's evaluate(),
// rounds and formats the result).
//
// SPEC_DEVIATION: temporary stub — required so T4's handler.go (which
// calls uc.Calculate) compiles before T5 exists.
func (uc *UseCase) Calculate(operation string) (json.Number, error) {
	return "", errors.New("operations: not implemented")
}
