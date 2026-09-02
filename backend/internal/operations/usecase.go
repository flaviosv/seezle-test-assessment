package operations

// UseCase orchestrates the operations slice's business logic. Stateless — no
// fields — since this service has no persistence.
//
// SPEC_DEVIATION: Calculate/formatResult are implemented in T5. This
// minimal skeleton exists only because T3's routes.go signature
// (routes.Routes(..., uc *operations.UseCase, ...)) requires the type to
// exist before T5 runs, mirroring the same forward-reference pattern
// tasks.md itself uses between T4 (calls uc.Calculate) and T5 (implements
// it).
type UseCase struct{}

func NewUseCase() *UseCase {
	return &UseCase{}
}
