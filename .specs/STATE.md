# STATE

## Decisions

### AD-001
- **Decision**: Backend follows a slice-based architecture replicated in shape (not content) from `~/Projects/Personal/dinherim` and `~/Projects/Personal/applyr`: `internal/<slice>/{handler.go,usecase.go}` (+ `domain.go`/`repository.go` only when persistence exists), colocated `_test.go` files, `internal/shared/*` minimal plumbing, routes registered on a versioned group (`v1`) via `internal/routes/routes.go`, never on the bare engine.
- **Reason**: Explicitly required by spec.md's Technical Constraints — this project replicates the reference repos' architectural shape while excluding DB/cache/auth/shared-kernel content they exist to support.
- **Trade-off**: Slightly more ceremony (separate handler/usecase files) than a single-file backend would need for one endpoint, in exchange for consistency with the other Go services in this account.
- **Scope**: All backend Go slices in this repo.
- **Date**: 2026-09-02
- **Status**: active

### AD-002
- **Decision**: All error JSON responses use a single shared envelope, `internal/shared/http/response.ErrorResponse{Error string \`json:"error"\`}`, populated directly at the call site (`c.JSON(status, response.ErrorResponse{Error: err.Error()})`) rather than through a generic sentinel→status dispatcher, unless/until a future slice's error set genuinely needs to fan out across more than one non-200 status.
- **Reason**: Matches the references' envelope shape (reuse across the account); the generic `ErrorStatus`/`HandleUseCaseError` dispatcher pattern from `applyr` is deferred until a slice actually has more than one non-success status to select between (this project's `operations` slice never does — see design.md Tech Decisions).
- **Trade-off**: A future slice with a richer error taxonomy (404/409/422) will need to introduce the dispatcher pattern itself rather than finding it pre-built.
- **Scope**: All backend error responses in this repo.
- **Date**: 2026-09-02
- **Status**: active

### AD-003
- **Decision**: Frontend stack is Vite + React + TypeScript + Tailwind CSS v4 (CSS custom-property design tokens), tested with Vitest + `@testing-library/react`. No router, data-fetching library (e.g. TanStack Query), form library, or global state manager (Redux/Zustand/Context) is added unless a specific future feature demonstrably needs it — plain `fetch` wrappers and `useReducer`/`useState` are the default.
- **Reason**: Vitest/RTL are the spec-mandated test tooling (consistent with `applyr/frontend`); Tailwind v4 matches the same reference's styling approach and is what the Claude Design (`/design` skill) workflow expects to consume. The heavier parts of `applyr/frontend`'s stack (TanStack Router/Query, shadcn, react-hook-form) exist to serve a multi-page, multi-entity app and are not justified by a single-screen, single-endpoint calculator.
- **Trade-off**: A future multi-screen frontend feature in this repo will need to introduce routing/query libraries itself rather than finding them pre-wired.
- **Scope**: All frontend features in this repo.
- **Date**: 2026-09-02
- **Status**: active

### AD-004
- **Decision**: Any backend endpoint returning a computed numeric value serializes it as `encoding/json.Number` (backed by a string built via `strconv.FormatFloat(v, 'f', -1, 64)` after significant-digit rounding), not a bare `float64` field.
- **Reason**: Go's default `float64` JSON marshaling can emit scientific notation for extreme magnitudes; `json.Number` gives exact control over the emitted literal while still marshaling as an unquoted JSON number.
- **Trade-off**: Slightly more formatting code per numeric field than relying on default marshaling.
- **Scope**: Any backend endpoint in this repo that returns a computed (as opposed to stored/passthrough) numeric value.
- **Date**: 2026-09-02
- **Status**: active

## Handoff

(none yet — first feature, still in Design phase)
