# SEZ-1 Calculator MVP Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user — do not proceed without it.**

---

**Design**: `.specs/features/SEZ-1-calculator-mvp/design.md`
**Status**: Draft

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec — confirm before Execute. Guidelines found: none — strong defaults applied (per tlc-spec-driven's rules for greenfield projects).

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| --- | --- | --- | --- | --- |
| Backend: Parser (domain logic) | unit | All branches; 1:1 to spec ACs (CALC-01..11, edge cases section); every listed grammar error tested | `backend/internal/operations/parser_test.go` | `go test ./... -v` |
| Backend: UseCase (domain logic) | unit | CALC-10, API-01/02 — rounding to 10 sig figs, trailing-zero trim, no-scientific-notation; error pass-through | `backend/internal/operations/usecase_test.go` | `go test ./... -v` |
| Backend: Handler/Routes (HTTP + routing) | integration | All routes: happy path + every listed edge case + error paths (API-03..07); JSON bind errors; Swagger/ReDoc 200 | `backend/internal/operations/handler_test.go`, `backend/internal/routes/routes_test.go` | `go test ./... -v` |
| Backend: Middleware/Config/Shared | none | Build gate only (no domain logic to test independently) | — | `go vet ./...` (part of build gate) |
| Frontend: useCalculator hook (state machine) | unit | FE-01..04, FE-06, FE-09..13 — all reducer transitions: digit/operator/./± accumulation, backspace, decimal auto-zero, sign toggle, AC reset, error-lock, post-result continuation vs. fresh start | `frontend/src/hooks/useCalculator.test.ts` | `npm run test -- --run` |
| Frontend: calculate API client | unit | FE-05, FE-08, FE-09 — request shape, success parsing, error parsing | `frontend/src/api/calculate.test.ts` | `npm run test -- --run` |
| Frontend: CalculatorApp component | component | FE-01, FE-02, FE-05, FE-07, FE-08, FE-09 — click accumulates display; keyboard accumulates display; `=`/Enter fires exactly one call; AC/`=` carry danger styling; result and echoed operation render; Error renders and locks input | `frontend/src/components/CalculatorApp.test.tsx` | `npm run test -- --run` |
| Frontend: HelpModal component | component | FE-14 — opens on click, closes on close-control click and on Escape | `frontend/src/components/HelpModal.test.tsx` | `npm run test -- --run` |
| Frontend: Display/ButtonGrid/HelpButton | none | Covered by CalculatorApp integration — these are purely presentational and are exercised through the parent component's interactions | — | Build gate only |

## Gate Check Commands

> Generated from codebase — confirm before Execute.

| Gate Level | When to Use | Command |
| --- | --- | --- |
| Quick | After tasks with unit tests only (parser, usecase, useCalculator, calculate client) | `go test ./... -v && npm run test -- --run` |
| Full | After tasks with integration tests (handler, routes, CalculatorApp, HelpModal) | `go test ./... -v && go vet ./... && npm run test -- --run && npm run typecheck && npm run lint` |
| Build | After phase completion or config/entity-only tasks | `go build ./... && go vet ./... && go test ./... && npm run build && npm run typecheck && npm run lint && npm run test -- --run` |

---

## Execution Plan

Phases are ordered and run sequentially — each phase completes before the next begins, and tasks within a phase execute in order. Tasks are packed into sub-agent batches as needed (each ~7 tasks per worker, whole phases together).

### Phase 1: Backend Foundation

Infrastructure: project setup, shared packages, middleware, routes registration, handler, usecase, parser.

```
T1 ──→ T2 ──→ T3 ──→ T4 ──→ T5 ──→ T6 ──→ T7
```

### Phase 2: Backend Testing

Unit and integration tests for parser, usecase, handler, and Swagger routes.

```
T8 ──→ T9 ──→ T10 ──→ T11
```

### Phase 3: Frontend Foundation

Project setup, state machine hook, API client, components, design tokens.

```
T12 ──→ T13 ──→ T14 ──→ T15 ──→ T16 ──→ T17 ──→ T18
```

### Phase 4: Frontend Testing

Unit and component tests for the hook, API client, and presentational components.

```
T19 ──→ T20 ──→ T21 ──→ T22
```

### Phase 5: Delivery & Documentation

Docker setup, documentation, Postman collection, Claude Design system.

```
T23 ──→ T24 ──→ T25 ──→ T26 ──→ T27
```

---

## Phase Execution Map

Visual representation of task ordering across all phases:

```
Phase 1: T1 ──→ T2 ──→ T3 ──→ T4 ──→ T5 ──→ T6 ──→ T7
         (Backend Foundation - infrastructure, handler, usecase, parser)

Phase 2: T8 ──→ T9 ──→ T10 ──→ T11
         (Backend Testing - unit & integration tests)

Phase 3: T12 ──→ T13 ──→ T14 ──→ T15 ──→ T16 ──→ T17 ──→ T18
         (Frontend Foundation - setup, hook, client, components)

Phase 4: T19 ──→ T20 ──→ T21 ──→ T22
         (Frontend Testing - unit & component tests)

Phase 5: T23 ──→ T24 ──→ T25 ──→ T26 ──→ T27
         (Documentation & Design - Docker, docs, Postman, design system)
```

Execution is strictly sequential — there is no intra-phase parallelism. A single agent (or batch worker) works one task at a time, in order. Phases run in sequence; each task within a phase depends on all previous tasks in the phase and all tasks in prior phases.

**Packing for sub-agents:**
- Batch 1: Phase 1 (7 tasks) + Phase 2 (4 tasks) = 11 tasks — exceeds budget, split as:
  - Worker A: Phase 1 (7 tasks) — full backend foundation
  - Worker B: Phase 2 (4 tasks) — backend testing
- Batch 2: Phase 3 (7 tasks) — frontend foundation
- Batch 3: Phase 4 (4 tasks) + Phase 5 (5 tasks) = 9 tasks — frontend testing + delivery

Workers execute sequentially; each worker completes all its tasks and reports before the next begins.

---

## Task Breakdown

### T1: Set up backend project structure and shared packages

**What**: Initialize Go backend module, create go.mod, main.go, project directories, and build shared packages (config, logger).
**Where**: `backend/go.mod`, `backend/main.go`, `backend/internal/shared/config/config.go`, `backend/internal/shared/logger/logger.go`
**Depends on**: None
**Reuses**: Project layout patterns from dinherim and applyr reference repos
**Requirement**: API-06, API-07, OPS-07

**Tools**:
- MCP: None (filesystem only)
- Skill: NONE

**Done when**:
- [ ] `backend/go.mod` created with module name `github.com/flaviosv/seezle-test-assessment`, Go 1.26+ directive
- [ ] `go.mod` includes: github.com/gin-gonic/gin, encoding/json, stdlib only (no third-party DB/ORM)
- [ ] `backend/main.go` exists with basic structure (commented TODOs for bootstrapping pieces not yet written)
- [ ] `internal/shared/config/config.go` defines `Config{APIPort, AppEnv, GinMode, LogLevel}` with env-var loading
- [ ] `internal/shared/logger/logger.go` initializes structured logger using slog, with env-driven log level
- [ ] No TypeErrors or build errors on `go build ./...`
- [ ] No unused dependencies

**Tests**: none (config/logger are infrastructure, tested only at build/integration level)
**Gate**: build

**Requirement Traceability**: API-06 (stateless service), API-07 (config setup), OPS-07 (Dockerfile/compose will reference this)

---

### T2: Create middleware stack (request context, security headers, CORS, timeout)

**What**: Implement middleware functions for request lifecycle: context attachment, security headers, CORS, and request timeout.
**Where**: `backend/internal/middleware/request_context.go`, `backend/internal/middleware/security_headers.go`, `backend/internal/middleware/cors.go`, `backend/internal/middleware/request_timeout.go`
**Depends on**: T1 (config, logger available)
**Reuses**: Middleware pattern from dinherim and applyr (AD-002 routing convention, middleware stack)
**Requirement**: API-06, API-07 (CORS specifically required by FE-05 cross-origin calls)

**Tools**:
- MCP: None
- Skill: NONE

**Done when**:
- [ ] `middleware.RequestContext(logger)` attaches request ID and scoped logger to context
- [ ] `middleware.SecurityHeaders()` sets hardening headers (X-Content-Type-Options, X-Frame-Options, etc.)
- [ ] `middleware.CORS()` sets Access-Control-Allow-Origin, Allow-Methods, Allow-Headers; handles OPTIONS preflight
- [ ] `middleware.RequestTimeout(timeout)` wraps request with time limit
- [ ] All four middleware can be registered on Gin engine in sequence
- [ ] No TypeErrors on `go build ./...`

**Tests**: none (infrastructure, tested at integration level via full handler tests)
**Gate**: build

**Requirement Traceability**: API-06 (CORS for FE-05 cross-origin POST), API-07 (basic server hardening)

---

### T3: Create response envelope and routes registration

**What**: Implement shared response envelope (`ErrorResponse{Error string}`), and routes.go for route group registration with Swagger/ReDoc.
**Where**: `backend/internal/shared/http/response/response.go`, `backend/internal/routes/routes.go`
**Depends on**: T1, T2 (middleware stack available)
**Reuses**: Response envelope shape from dinherim/applyr; route registration pattern (routes on v1 group, never bare engine)
**Requirement**: API-01, API-02, API-03, API-04, API-05, API-07

**Tools**:
- MCP: None
- Skill: NONE

**Done when**:
- [ ] `response.ErrorResponse{Error string}` struct defined and exported
- [ ] `routes.Routes(app *gin.Engine, v1 *gin.RouterGroup, uc *operations.UseCase, cfg *config.Config)` function exists (stubbed: registers routes to be filled by T4)
- [ ] Routes registered: `POST /v1/calculate` (handler to be implemented in T4)
- [ ] Swagger routes registered: `GET /swagger/*any` → ginSwagger handler, `GET /docs` → go-redoc handler (with spec file)
- [ ] Swagger/ReDoc routes have **no auth middleware** (API-06: no auth exists anywhere)
- [ ] `go.mod` updated with swaggo and go-redoc dependencies
- [ ] No build errors on `go build ./...`

**Tests**: routes_test.go written in T11 (integration test)
**Gate**: build

**Requirement Traceability**: API-01/02 (response shape), API-03/04/05 (error envelope), API-07 (Swagger/ReDoc setup)

---

### T4: Create operations handler with Swagger annotations

**What**: Implement the HTTP handler for `POST /v1/calculate` with swaggo annotations, Gin bindings, and error mapping.
**Where**: `backend/internal/operations/handler.go`
**Depends on**: T1, T3 (routes, response envelope, config)
**Reuses**: Handler patterns from dinherim/applyr (dependency injection via newTestHandler)
**Requirement**: API-01, API-02, API-03, API-04, API-05, FE-05

**Tools**:
- MCP: None
- Skill: NONE

**Done when**:
- [ ] `operations.Handler` struct defined (holds `UseCase` pointer)
- [ ] `func NewHandler(uc *UseCase) *Handler` constructor created
- [ ] `func (h *Handler) Calculate(c *gin.Context)` handler implemented:
  - Binds JSON body to `{Operation string}` via `c.ShouldBindJSON`
  - Calls `h.uc.Calculate(operation)` on successful bind
  - Maps error → `c.JSON(400, ErrorResponse{Error: err.Error()})`
  - Maps success → `c.JSON(200, {Operation, Result})`
  - No nil-pointer panics on nil usecase
- [ ] Swagger annotations present (`@Router /v1/calculate [post]`, `@Accept json`, `@Produce json`, request/response examples)
- [ ] Handler rejects requests with missing/non-string `operation` field (via bind validation)
- [ ] No TypeErrors; compiles with `go build ./...`

**Tests**: handler_test.go written in T10 (integration test via httptest)
**Gate**: build

**Requirement Traceability**: API-01/02 (response shape), API-03/04/05 (bind errors), FE-05 (HTTP handler for `POST /v1/calculate`)

---

### T5: Create operations usecase with rounding and formatting

**What**: Implement the usecase orchestration layer: call parser, round result to 10 significant digits, trim trailing zeros, format as JSON number.
**Where**: `backend/internal/operations/usecase.go`
**Depends on**: T1 (no external dependencies; usecase is pure function)
**Reuses**: UseCase pattern from applyr (newTestUseCase helper)
**Requirement**: CALC-10, API-01, API-02

**Tools**:
- MCP: None
- Skill: NONE

**Done when**:
- [ ] `operations.UseCase` struct defined (no fields — stateless)
- [ ] `func NewUseCase() *UseCase` constructor created
- [ ] `func (uc *UseCase) Calculate(operation string) (json.Number, error)` implemented:
  - Calls `evaluate(operation)` (parser function, defined in T6)
  - On error, returns error unchanged (passthrough)
  - On success, calls `formatResult(value)` → rounds to 10 sig figs, trims trailing zeros, no scientific notation
  - Returns `json.Number` (not `float64`) to guarantee JSON-number encoding
- [ ] `formatResult(v float64) (json.Number, error)` implemented:
  - Rejects non-finite (Infinity/NaN) as `ErrNonFiniteResult`
  - Rounds to 10 significant digits using standard formula: `magnitude := 10^(10 - ceil(log10(|v|)))`
  - Uses `strconv.FormatFloat(rounded, 'f', -1, 64)` to ensure no scientific notation
  - Trims trailing zeros (defensive)
  - Returns valid JSON-number string
- [ ] Edge cases tested (very large magnitude, very small magnitude, integers, decimals) via unit tests in T9
- [ ] No TypeErrors; compiles

**Tests**: usecase_test.go written in T9 (unit tests)
**Gate**: quick

**Requirement Traceability**: CALC-10 (rounding), API-01/02 (response formatting)

---

### T6: Create parser, error types, and evaluate function

**What**: Implement the grammar parser and evaluator: tokenize, validate grammar, evaluate left-to-right, detect all error conditions.
**Where**: `backend/internal/operations/parser.go`, `backend/internal/operations/errors.go`
**Depends on**: T1 (math/strconv stdlib)
**Reuses**: None (parser is novel; errors are project-specific sentinel types)
**Requirement**: CALC-01..11, API-03, API-04, API-05

**Tools**:
- MCP: context7 (if needed for Go standard library clarification, but unlikely — standard libs are well-known)
- Skill: NONE

**Done when**:
- [ ] `errors.go` defines sentinel errors (exported or internal as needed):
  - `ErrEmptyExpression`, `ErrInvalidCharacter`, `ErrMalformedExpression`, `ErrDivideByZero`, `ErrNegativeSqrt`, `ErrNonFiniteResult`
  - Each error has a unique, user-facing message (will be echoed in `400` responses)
- [ ] `parser.go` exports `func evaluate(expr string) (float64, error)` (called by usecase):
  - Rejects empty string → `ErrEmptyExpression`
  - Scans once for any rune outside `0-9 . + - * / ^ \ %` → `ErrInvalidCharacter`
  - Calls `parseExpression(expr string) (float64, error)` to:
    - Parse first Term at position 0 via `parseTerm`
    - Loop: consume BinaryOp, parse next Term, fold left-to-right
    - Check finiteness after every fold step → `ErrNonFiniteResult`
    - Reject division by zero → `ErrDivideByZero`
  - Calls `parseTerm(expr string, pos int) (float64, newPos int, error)` to:
    - Optionally consume `-` sign (legal only at operand-start positions — beginning of expr or right after a BinaryOp)
    - Require one or more digits
    - Optionally consume `.` and one or more digits after
    - Loop: while current char is `\` or `%`, apply to the Term's value:
      - `%` → `value / 100`
      - `\` → `math.Sqrt(value)`, first check `value < 0` → `ErrNegativeSqrt`
      - After each postfix op, check `math.IsInf/math.IsNaN` → `ErrNonFiniteResult`
    - Return term value and new position
  - All edge cases from spec.md Edge Cases section rejected with appropriate sentinel error
- [ ] Worked examples from design.md (2+2 = 4; 16\% = 0.04; 5--3 = 8; 5---3 → error; etc.) pass by hand verification in T8
- [ ] No TypeErrors; compiles

**Tests**: parser_test.go written in T8 (unit tests)
**Gate**: quick

**Requirement Traceability**: CALC-01..11 (grammar, semantics, edge cases), API-03/04/05 (format validation)

---

### T7: Wire main.go, register routes, and setup Swagger generation

**What**: Complete main.go: initialize logger, config, Gin engine with middleware stack, routes, and graceful shutdown. Verify Swagger generation setup.
**Where**: `backend/main.go` (fill in the stubbed TODO sections), `backend/docs/embed.go` (embed swagger.json), `backend/.swaggo.yaml` or inline swaggo generation
**Depends on**: T1, T2, T3, T4, T5, T6 (all pieces now exist)
**Reuses**: Main bootstrap pattern from dinherim/applyr
**Requirement**: API-07, OPS-07

**Tools**:
- MCP: context7 (Go stdlib, slog setup — unlikely, but available if needed)
- Skill: NONE

**Done when**:
- [ ] `main.go` creates logger with `logger.Initialize(cfg.LogLevel)`
- [ ] Gin engine created with `gin.New()` (not Default, to apply custom middleware in order)
- [ ] Middleware registered in sequence: `Recovery`, `SecurityHeaders`, `CORS`, `RequestTimeout`, `RequestContext`
- [ ] Routes registered via `routes.Routes(app, app.Group("/v1"), uc, cfg)`
- [ ] `http.Server` created with `Addr: ":" + cfg.APIPort`, Handler: engine
- [ ] Graceful shutdown implemented (context cancellation on SIGTERM/SIGINT)
- [ ] `swaggo/swag init -g main.go` command documented in README or Makefile (or run as part of this task)
- [ ] `backend/docs/docs.go`, `swagger.json`, `swagger.yaml` generated (not hand-written)
- [ ] `go build ./...` succeeds
- [ ] No unused middleware, config fields, or logger calls
- [ ] `go vet ./...` passes

**Tests**: No new tests in this task; full integration via routes_test.go in T11
**Gate**: build

**Requirement Traceability**: API-07 (Swagger generation and registration), OPS-07 (backend service bootstrap for docker-compose)

---

### T8: Write parser unit tests

**What**: Table-driven unit tests for the parser, covering all grammar rules and edge cases from spec.md.
**Where**: `backend/internal/operations/parser_test.go`
**Depends on**: T6 (parser.go exists)
**Reuses**: Table-driven test pattern from dinherim/applyr
**Requirement**: CALC-01..11, API-03, API-04, API-05

**Tools**:
- MCP: None
- Skill: NONE

**Done when**:
- [ ] Test file uses `testing.T`, table-driven cases with struct slice: `{input string, expectedValue float64, expectedError error}`
- [ ] **All grammar rules covered** (1:1 with spec ACs CALC-01 through CALC-11):
  - CALC-01, CALC-07: left-to-right, no precedence, multiple binary ops (e.g. `2+3+4`)
  - CALC-02/03/04: postfix unary ops bind to their Term only (e.g. `16\%` = 0.04, `4+16\` = 20, `16%\` = 0.016)
  - CALC-05: contextual sign (`-5+3` = -2, `5--3` = 8)
  - CALC-06: double sign rejected (`5---3` → error)
  - CALC-08/09: divide-by-zero, negative-sqrt errors
  - CALC-10: (rounding tested in usecase_test, not parser)
  - CALC-11: non-finite overflow
  - API-03: empty, invalid character, malformed JSON (parser level: invalid char scan)
  - API-04/05: grammar mismatches (double decimal, trailing binop, leading binop, etc.)
- [ ] **All edge cases from spec.md Edge Cases section** included:
  - Empty expression
  - Single term with no operator (e.g. `42`, `-5`, `9\`, `50%`)
  - Double decimal points
  - Decimal without digits before/after
  - Consecutive binary ops
  - Leading binop (except `-`)
  - Starting with unary op
  - Trailing binop
  - Negative sqrt
  - Divide by zero
  - Non-finite result
  - Invalid character
  - Exact worked examples from design.md (2+2, 16\%, 5--3, -5+3, 5---3, etc.)
- [ ] `t.Run(name, func(t *testing.T) { ... })` pattern used for clarity
- [ ] Error assertions use `errors.Is(err, expectedError)` to match sentinel types
- [ ] Value assertions use a tolerance for floating-point comparisons (e.g. `math.Abs(got - want) < 1e-10`)
- [ ] Test count: ~40+ cases (comprehensive, one per unique behavior)
- [ ] `go test ./internal/operations -v` passes
- [ ] No skipped or TODOed tests

**Tests**: unit
**Gate**: quick

**Requirement Traceability**: CALC-01..11 (grammar/semantics), API-03/04/05 (validation)

---

### T9: Write usecase unit tests

**What**: Unit tests for usecase's rounding, formatting, and error pass-through.
**Where**: `backend/internal/operations/usecase_test.go`
**Depends on**: T5 (usecase.go), T6 (parser.go for error types)
**Reuses**: Test constructor pattern from applyr
**Requirement**: CALC-10, API-01, API-02

**Tools**:
- MCP: None
- Skill: NONE

**Done when**:
- [ ] `newTestUseCase(t *testing.T) *UseCase` helper created
- [ ] Test cases cover:
  - **Rounding to 10 sig figs** (at least 3 cases: very small magnitude, normal, very large magnitude):
    - E.g. `0.00012345678901` → 10 sig figs, result matches expected string
    - E.g. `1.23456789012345` → 10 sig figs
    - E.g. `123456789.012345` → 10 sig figs (10 digits total before/after decimal)
  - **Trailing zero trim**: e.g. `1.0` → `"1"`, `0.50` → `"0.5"`
  - **No scientific notation**: verified by checking output string has no `e` or `E`
  - **JSON-number validity**: parse the returned `json.Number` back with `strconv.ParseFloat` to round-trip
  - **Error pass-through**: any error from `evaluate()` (ErrDivideByZero, ErrMalformedExpression, etc.) is returned unchanged
  - **Valid json.Number encoding**: the returned `json.Number` marshals unquoted when used in JSON response
- [ ] Test count: ~10–15 cases
- [ ] `go test ./internal/operations -v` passes
- [ ] No silent test deletions

**Tests**: unit
**Gate**: quick

**Requirement Traceability**: CALC-10 (rounding), API-01/02 (response formatting)

---

### T10: Write handler unit and integration tests

**What**: Integration tests (via httptest) for the handler: valid requests, malformed JSON, missing field, type errors, error responses, success responses.
**Where**: `backend/internal/operations/handler_test.go`
**Depends on**: T4 (handler.go), T5 (usecase.go)
**Reuses**: Handler test pattern from applyr (newTestHandler, real Gin router, no mocks)
**Requirement**: API-01, API-02, API-03, API-04, API-05, API-06

**Tools**:
- MCP: None
- Skill: NONE

**Done when**:
- [ ] `newTestHandler(t *testing.T) *Handler` helper created
- [ ] Test cases cover (via real HTTP calls using httptest):
  - **Valid request** (`{"operation": "2+2"}`) → `200 {operation: "2+2", result: 4}`
  - **Valid request with error** (`{"operation": "1/0"}`) → `400 {error: "<message>"}`
  - **Malformed JSON** → `400` with error message
  - **Missing `operation` field** (`{}` or `{"other": "value"}`) → `400`
  - **Non-string `operation`** (`{"operation": 123}`) → `400`
  - **Empty operation** (`{"operation": ""}`) → `400`
  - **Response shape exactly matches spec** (no extra fields, exact JSON structure)
  - **No nil-pointer panics** (if usecase is nil, handler handles gracefully — though in practice it won't be)
  - **Request and response Content-Type are application/json**
  - **No credentials expected** (API-06: request processes successfully with no auth header)
- [ ] Real Gin router used (not mocked), to test routing + middleware chain
- [ ] Test count: ~12–15 cases
- [ ] `go test ./internal/operations -v` passes

**Tests**: integration (httptest)
**Gate**: full

**Requirement Traceability**: API-01/02 (response shape), API-03/04/05 (bind validation), API-06 (no auth)

---

### T11: Write routes and Swagger integration tests

**What**: Integration tests for Swagger/ReDoc registration and the routes group setup.
**Where**: `backend/internal/routes/routes_test.go`
**Depends on**: T3, T7 (routes.go, main.go complete; Swagger generation complete)
**Reuses**: Routes test pattern from dinherim
**Requirement**: API-07

**Tools**:
- MCP: None
- Skill: NONE

**Done when**:
- [ ] `newTestRouter(t *testing.T) *gin.Engine` helper creates a real Gin engine with all middleware and routes registered
- [ ] Test cases cover:
  - **`GET /swagger/index.html`** → `200` (or redirects to swagger-ui)
  - **`GET /docs`** (ReDoc endpoint) → `200`
  - **`GET /docs/openapi.json`** → `200` with valid JSON (the embedded swagger.json)
  - **`POST /v1/calculate` exists** (sanity check that routes were registered)
  - **No auth middleware blocks these routes** (can make request without any credentials and get 200)
  - **Swagger spec is valid** (optional: parse returned JSON and validate top-level keys — title, version, paths, etc.)
- [ ] Test count: ~5–7 cases
- [ ] `go test ./internal/routes -v` passes

**Tests**: integration (httptest)
**Gate**: full

**Requirement Traceability**: API-07 (Swagger/ReDoc public endpoints)

---

### T12: Set up frontend project structure and tooling

**What**: Initialize npm/Node frontend project with Vite, TypeScript, Tailwind CSS v4, Vitest, and React Testing Library.
**Where**: `frontend/package.json`, `frontend/vite.config.ts`, `frontend/tsconfig.json`, `frontend/vitest.config.ts`, `frontend/index.html`, `frontend/.env.example`
**Depends on**: None
**Reuses**: Frontend tooling from applyr (Vite + Tailwind v4 + Vitest + RTL)
**Requirement**: OPS-10, OPS-11, FE-01..FE-17

**Tools**:
- MCP: None
- Skill: NONE

**Done when**:
- [ ] `package.json` created with scripts: `dev`, `build`, `typecheck`, `lint`, `test`, `preview`
- [ ] Dependencies include: `react@19+`, `typescript@5+`, `vite@8+`, `tailwindcss@4+`, `@testing-library/react@16+`, `vitest@4+`
- [ ] `vite.config.ts` configured with React plugin, Tailwind plugin
- [ ] `tsconfig.json` includes React JSX settings, paths for `@` alias (optional, but nice-to-have)
- [ ] `vitest.config.ts` sets test environment to `jsdom`, includes `@testing-library/react` setup, code coverage config
- [ ] `frontend/index.html` present with `<div id="root"></div>` and `<script type="module" src="./src/main.tsx"></script>`
- [ ] `frontend/src/main.tsx` entry point created (import App, render to root)
- [ ] `.env.example` documents `VITE_API_BASE_URL` (will be set in docker-compose)
- [ ] `npm install` succeeds
- [ ] `npm run typecheck` succeeds (no TypeErrors in created files)
- [ ] `npm run build` produces `dist/` (even with just entry point)
- [ ] Tailwind CSS custom-property tokens placeholder created at `frontend/src/styles/tokens.css` (to be filled in T18)

**Tests**: none (build gate only; actual component tests in T19–T22)
**Gate**: build

**Requirement Traceability**: OPS-10 (test tooling), OPS-11 (design tokens starting point)

---

### T13: Create useCalculator hook with full state machine

**What**: Implement the heart of the FE — the `useCalculator()` custom hook with state machine (composing/result-shown/error-shown), reducer actions, and keyboard/click input handling.
**Where**: `frontend/src/hooks/useCalculator.ts`
**Depends on**: T12 (project setup), T14 (api/calculate.ts will be called by the hook)
**Reuses**: `useReducer` pattern, keyboard event handling (standard React)
**Requirement**: FE-01..FE-06, FE-09..FE-13

**Tools**:
- MCP: None
- Skill: NONE

**Done when**:
- [ ] `useCalculator()` hook exported; returns `{ state, inputChar, inputDecimal, toggleSign, backspace, clear, submit }`
- [ ] State shape: `{ status: 'composing'|'result-shown'|'error-shown', expression: string, echoedOperation: string, displayValue: string }`
- [ ] Reducer actions (dispatched by handler functions):
  - `INPUT_CHAR(char)` — append char to expression (if composing or result-shown → start fresh on digit, continue on operator; error-shown → ignored, FE-09)
  - `INPUT_DECIMAL()` — append `.` with leading-zero auto-prefix if needed (FE-13)
  - `TOGGLE_SIGN()` — toggle leading `-` on current operand (FE-11)
  - `BACKSPACE()` — delete last char from expression (FE-12)
  - `CLEAR()` — reset to initial state (FE-06)
  - `SUBMIT()` — call `api.calculate(expression)` and update state based on response (FE-05, FE-08, FE-09)
- [ ] State transitions (exactly match spec.md Assumptions and design.md State Management):
  - `composing` → any input action → stays in `composing` (accumulate)
  - `composing` → `submit()` with `200` → `result-shown` (set echoedOperation, displayValue from response)
  - `composing` → `submit()` with `400` → `error-shown` (set displayValue = "Error")
  - `result-shown` → `inputChar(digit)` → `composing` (discard result, start fresh, FE-10)
  - `result-shown` → `inputChar(operator)` → `composing` (prepend result to expression, then append operator, FE-10)
  - `error-shown` → `clear()` → `composing` (only way out of error-shown, FE-09)
  - Any state → `clear()` → `composing` (reset)
  - `result-shown` → `submit()` with no expression → no-op (nothing to calculate)
  - `error-shown` → any input (except clear) → ignored
- [ ] `window.keydown` listener registered at hook init, dispatches: digits, 7 operators, `.`, Enter/`=`, Backspace, Escape
  - Escape closes help modal if open; otherwise captured but no expression-level effect (FE-04)
  - All dispatched actions shared with button handlers (no separate code path, FE-02)
- [ ] `api.calculate(expression)` called on submit; on error, displays error message (FE-09)
- [ ] No useContext, no Redux, no Zustand — single custom hook, one consuming component
- [ ] Hook does **not** render anything (pure logic)

**Tests**: useCalculator.test.ts written in T19 (unit tests)
**Gate**: quick

**Requirement Traceability**: FE-01/02/03/04 (input handling), FE-05/08/09 (API call, display), FE-06 (AC clear), FE-10 (result continuation), FE-11/12/13 (backspace, decimal, sign)

---

### T14: Create api/calculate.ts typed client

**What**: Implement a typed fetch wrapper for `POST /v1/calculate`, with request/response types and error handling.
**Where**: `frontend/src/api/calculate.ts`
**Depends on**: T12 (project setup, Vite env vars available)
**Reuses**: Typed fetch pattern (no TanStack Query — just plain fetch wrapper)
**Requirement**: FE-05, FE-08, FE-09

**Tools**:
- MCP: None
- Skill: NONE

**Done when**:
- [ ] `types.ts` or inline types defined:
  - `CalculateRequest { operation: string }`
  - `CalculateResponse { operation: string, result: number }`
  - `CalculateError extends Error { statusCode: number, message: string, serverError?: string }`
- [ ] `calculate(operation: string): Promise<CalculateResponse>` function exported:
  - Builds request body: `{ operation }`
  - Sends `POST` to `${import.meta.env.VITE_API_BASE_URL}/v1/calculate` (default fallback: `http://localhost:8090`)
  - On 2xx: parses JSON, returns response
  - On 4xx/5xx: parses error JSON, throws `CalculateError` with server's `error` message (FE-09)
  - On network error: throws `CalculateError` with descriptive message
  - No retry logic (fire-and-forget per spec; user can retry manually)
- [ ] TypeScript strict mode passes (no `any`)
- [ ] No runtime dependencies beyond stdlib (`fetch`, `JSON`)

**Tests**: calculate.test.ts written in T20 (unit tests with mocked fetch)
**Gate**: quick

**Requirement Traceability**: FE-05 (single call to `/v1/calculate`), FE-08/09 (success/error response parsing)

---

### T15: Create App and CalculatorApp layout components

**What**: Implement the top-level App component (mounts CalculatorApp + HelpModal) and the CalculatorApp component (layout shell with Display, ButtonGrid, HelpButton).
**Where**: `frontend/src/App.tsx`, `frontend/src/components/CalculatorApp.tsx`
**Depends on**: T13 (useCalculator hook exists), T12 (project setup)
**Reuses**: React hooks (useState for modal open/close), component composition
**Requirement**: FE-01..FE-09, FE-14

**Tools**:
- MCP: None
- Skill: NONE

**Done when**:
- [ ] `App.tsx` component:
  - Imports `CalculatorApp`, `HelpModal`
  - Manages modal open/close state via `useState(false)`
  - Renders: `<CalculatorApp onHelpClick={() => setOpen(true)} /> <HelpModal isOpen={open} onClose={() => setOpen(false)} />`
  - No styling in App itself (styling delegated to children, Tailwind)
- [ ] `CalculatorApp.tsx` component:
  - Calls `useCalculator()` hook to get state + handlers
  - Props: `onHelpClick: () => void`
  - Renders:
    - Outer container (centered card, dark background from tokens, FE-15)
    - Display component (receives `echoedOperation`, `displayValue`, `status`)
    - ButtonGrid component (receives `state`, handlers: `onInputChar`, `onSubmit`, `onClear`, `onBackspace`, `onToggleSign`, `onInputDecimal`)
    - HelpButton (top-right, calls `onHelpClick`, FE-14)
  - Layout is responsive mobile-first (FE-17) — can test via ResizeObserver or just ensure CSS is responsive
  - Renders only what's needed, no conditional mounting of hooks (hooks called unconditionally)
- [ ] Components do not manage application state internally — all state from the hook
- [ ] TypeScript strict mode passes

**Tests**: CalculatorApp.test.tsx written in T22 (component tests)
**Gate**: build (initial render check)

**Requirement Traceability**: FE-01/02/05/08 (input handling, API call), FE-07/09 (danger styling, error display), FE-14 (help button), FE-16/17 (layout, responsive)

---

### T16: Create Display component

**What**: Presentational component displaying echoed operation (small) and result/Error (large).
**Where**: `frontend/src/components/Display.tsx`
**Depends on**: T12 (project setup, Tailwind available)
**Reuses**: Standard React functional component
**Requirement**: FE-08, FE-09

**Tools**:
- MCP: None
- Skill: NONE

**Done when**:
- [ ] `Display` component exported:
  - Props: `echoedOperation: string`, `displayValue: string`, `status: 'composing'|'result-shown'|'error-shown'`
  - Renders:
    - Small text for echoed operation (color: `--color-text-secondary`, FE-08)
    - Large text for display value / "Error" (color: `--color-text-primary`, FE-08/09)
  - Uses design tokens from `src/styles/tokens.css` (to be populated in T18)
  - Responsive font sizes (Tailwind: `text-sm`, `text-2xl` or similar)
- [ ] No interactivity in Display itself (purely presentational)
- [ ] TypeScript strict mode passes

**Tests**: Covered by CalculatorApp.test.tsx (RTL renders Display and checks text)
**Gate**: build

**Requirement Traceability**: FE-08 (echoed operation + result), FE-09 (error display)

---

### T17: Create ButtonGrid and HelpButton components

**What**: Presentational ButtonGrid component for digits/operators/controls, and HelpButton (top-right "?").
**Where**: `frontend/src/components/ButtonGrid.tsx`, `frontend/src/components/HelpButton.tsx`
**Depends on**: T12 (project setup, Tailwind)
**Reuses**: Standard React functional component
**Requirement**: FE-01, FE-06, FE-07, FE-11, FE-12, FE-13, FE-14

**Tools**:
- MCP: None
- Skill: NONE

**Done when**:
- [ ] `ButtonGrid` component:
  - Props: `state`, `onInputChar`, `onSubmit`, `onClear`, `onBackspace`, `onToggleSign`, `onInputDecimal`
  - Renders a grid of buttons:
    - **Top row (utility)**: Backspace, AC (red, FE-07), operators? (layout decision)
    - **Main grid**: 0-9 digits, arranged in 3x3 + 0 row (matching calculator.png reference, FE-16)
    - **Right column or bottom area**: Operators (`+`, `-`, `*`, `/`, `^`, `\`, `%`), exactly 7 operators (spec), some in red (FE-07: only AC and `=` are red per spec; others are accent color, FE-15)
    - **Bottom row**: `±`, `.`, `=` (red, FE-07)
  - Each button bound to the appropriate handler: `onClick={() => onInputChar('3')}` for digit buttons, etc.
  - Uses design tokens: `--color-danger` for AC/`=`, `--color-accent` for operators, `--color-surface` for digits (FE-15)
  - Responsive layout (mobile: single-column or 2-col; desktop: proper grid, FE-17)
- [ ] `HelpButton` component:
  - Props: `onClick: () => void`
  - Renders a button labeled "?" in the top-right position (FE-14)
  - Uses `position: absolute` or flexbox/grid positioning to appear top-right
  - Color uses `--color-accent` or `--color-text-primary` (design choice via `/design` skill)
- [ ] No state management in these components
- [ ] TypeScript strict mode passes

**Tests**: Covered by CalculatorApp.test.tsx (RTL renders grid, checks buttons dispatch handlers)
**Gate**: build

**Requirement Traceability**: FE-01 (click buttons), FE-06/07 (AC in red), FE-11/12/13 (sign/backspace/decimal buttons), FE-14 (help button)

---

### T18: Create HelpModal component and design-token CSS

**What**: Modal component listing keyboard shortcuts, and CSS custom-property tokens for colors/typography.
**Where**: `frontend/src/components/HelpModal.tsx`, `frontend/src/styles/tokens.css`
**Depends on**: T12 (project setup)
**Reuses**: CSS custom properties (standard), React portal pattern (optional but nice; useRef + createPortal)
**Requirement**: FE-14, FE-15, FE-16, FE-17, OPS-11

**Tools**:
- MCP: None
- Skill: NONE

**Done when**:
- [ ] `tokens.css` defines CSS custom properties from design.md's Design Tokens section:
  - Colors: `--color-bg`, `--color-surface`, `--color-surface-raised`, `--color-accent`, `--color-danger`, `--color-warning`, `--color-success`, `--color-text-primary`, `--color-text-secondary`
  - Typography: `--font-size-body`, `--font-size-display`, etc. (optional, but suggested)
  - Other: `--spacing-xs`, `--spacing-sm`, etc. (optional)
  - Proposed values from design.md table are starting points; exact final values will be refined by `/design` skill in T27
  - Fallback values for all tokens (no undefined CSS vars)
- [ ] `tokens.css` is imported in `App.tsx` or `main.tsx` at top level
- [ ] `HelpModal` component:
  - Props: `isOpen: boolean`, `onClose: () => void`
  - Renders (if `isOpen`):
    - Overlay (semi-transparent dark background, covers viewport, FE-14)
    - Modal card (centered, white/light background with dark text)
    - Title: "Keyboard Shortcuts" or "Help"
    - List of shortcuts:
      - "0-9: Digits"
      - "+, -, *, /, ^, \, %: Operators" (the 7 operators)
      - ".: Decimal point"
      - "Enter or =: Calculate"
      - "Backspace: Delete last character"
      - "AC or Escape: Clear" (note: Escape closes the modal only, doesn't affect expression if no modal)
      - "[+/-] or ±: Toggle sign"
      - "?: Open this help"
    - Close button (top-right X or "Close") — calls `onClose()`
  - Closes when:
    - Close button clicked
    - Escape key pressed (FE-14)
    - Backdrop (overlay) clicked (optional, nice-to-have)
  - Uses design tokens for colors (dark overlay, card background from `--color-surface`, text from `--color-text-primary`)
  - Responsive (modal scales on mobile, FE-17)
  - Uses `position: fixed` for overlay and modal positioning
- [ ] TypeScript strict mode passes

**Tests**: HelpModal.test.tsx written in T22 (component tests)
**Gate**: build

**Requirement Traceability**: FE-14 (help modal), FE-15/16/17 (design tokens, layout, responsive), OPS-11 (token starting point for `/design` skill)

---

### T19: Write useCalculator hook unit tests

**What**: Unit tests for the state machine: all reducer transitions, input handling, edge cases.
**Where**: `frontend/src/hooks/useCalculator.test.ts`
**Depends on**: T13 (useCalculator.ts), T14 (api/calculate.ts available to mock)
**Reuses**: Vitest + React hooks testing pattern
**Requirement**: FE-01..04, FE-06, FE-09..13

**Tools**:
- MCP: None
- Skill: NONE

**Done when**:
- [ ] Uses Vitest for test runner, `@testing-library/react` hook utilities (`renderHook`, `act`)
- [ ] Mock `api/calculate.ts` via `vi.mock()` to control success/error responses without network calls
- [ ] Test cases cover all state transitions (from design.md State Management table):
  - Composing: digit/operator/./± appends, backspace deletes, clear resets, submit calls API
  - Result-shown: digit → fresh start, operator → continue with result
  - Error-shown: only clear exits, all inputs else ignored
  - Post-result → operator continuation (FE-10): e.g., result 2, then inputChar('+') → expression becomes '2+'
  - Post-result → digit (fresh start): e.g., result 2, then inputChar('3') → expression becomes '3'
  - Decimal auto-zero (FE-13): first char `.` → becomes `0.`
  - Sign toggle (FE-11): toggle leading `-` on current operand
  - Backspace (FE-12): delete last char (not in error-shown or post-result)
  - Double-operator prevention (e.g., `5++` → should reject or append as written, hook is permissive, backend validates)
  - Chained postfix ops (e.g., `16\%` → both appended to expression)
- [ ] Mock responses: `api.calculate` mocked to return `{operation, result}` or throw error
- [ ] Verify state updates after actions: `assert.equal(result.current.displayValue, expected)`
- [ ] Test count: ~25–35 cases (comprehensive state machine coverage)
- [ ] `npm run test -- --run` passes
- [ ] No skipped or TODOed tests

**Tests**: unit
**Gate**: quick

**Requirement Traceability**: FE-01/02/03/04 (input), FE-05/08 (API/display), FE-06 (clear), FE-09 (error), FE-10 (continuation), FE-11/12/13 (actions)

---

### T20: Write calculate.ts API client unit tests

**What**: Unit tests for the typed fetch wrapper, with mocked fetch.
**Where**: `frontend/src/api/calculate.test.ts`
**Depends on**: T14 (api/calculate.ts)
**Reuses**: Vitest, global `fetch` mocking via `vi.stubGlobal`
**Requirement**: FE-05, FE-08, FE-09

**Tools**:
- MCP: None
- Skill: NONE

**Done when**:
- [ ] Mock global `fetch` using Vitest's `vi.stubGlobal('fetch', vi.fn())`
- [ ] Test cases cover:
  - **Success (200)**: `fetch` returns `{ok: true, json: () => {operation, result}}` → resolved with response
  - **Error (400)**: `fetch` returns `{ok: false, status: 400, json: () => {error: "message"}}` → rejected with `CalculateError`
  - **Error (500)**: similar, error handling
  - **Network error** (fetch throws): `calculate()` catches and re-throws as `CalculateError`
  - **Malformed response JSON**: fetch returns valid JSON but missing `operation` field → handled gracefully (or throws, design choice)
  - **Request URL** is correct: `http://localhost:8090/v1/calculate` (or env var)
  - **Request body** is correct: `{operation: string}`
  - **Request method** is `POST`
  - **Response Content-Type** expectations (optional validation)
- [ ] Test count: ~10–12 cases
- [ ] TypeScript strict mode passes
- [ ] `npm run test -- --run` passes

**Tests**: unit
**Gate**: quick

**Requirement Traceability**: FE-05 (single API call), FE-08/09 (response/error handling)

---

### T21: Write CalculatorApp component tests

**What**: Component tests (via React Testing Library) for the main CalculatorApp, verifying UI behavior and integration with the hook.
**Where**: `frontend/src/components/CalculatorApp.test.tsx`
**Depends on**: T15 (CalculatorApp.tsx), T16/17 (Display, ButtonGrid, HelpButton), T19/20 (mock hook and API)
**Reuses**: RTL + Vitest pattern
**Requirement**: FE-01, FE-02, FE-05, FE-07, FE-08, FE-09, FE-15

**Tools**:
- MCP: None
- Skill: NONE

**Done when**:
- [ ] Uses `@testing-library/react` (`render`, `screen`, `fireEvent`, `userEvent`)
- [ ] Mock `useCalculator` hook and `api/calculate` to control responses
- [ ] Test cases cover:
  - **Click accumulates display** (FE-01): Click `2`, `+`, `2` → display shows "2+2"
  - **Keyboard accumulates display** (FE-02): Type `2+2` → display shows "2+2"
  - **`=` or Enter fires API call** (FE-05): Click `=` or press Enter → `api.calculate` called with accumulated expression
  - **Success response renders** (FE-08): After `200` response with result `4` → display shows large "4", small "2+2" echoed above
  - **Error response renders** (FE-09): After `400` response → display shows "Error"
  - **AC button styled red** (FE-07): Find AC button, assert `--color-danger` or `bg-red-*` class present (or semantic check for role + style)
  - **`=` button styled red** (FE-07): Similar check
  - **Operators colored differently** (FE-15): Spot-check one operator button has `--color-accent` or similar
  - **Help button opens modal** (FE-14): Click "?" → modal appears
  - **Clear (AC) resets** (FE-06): After showing result, click AC → display empty again
  - **Backspace deletes** (FE-12): Type `123`, click backspace → display shows `12`
  - **Decimal works** (FE-13): Click `.`, digit appears (with auto-zero if needed)
  - **Sign toggle works** (FE-11): Click `5`, click `±` → display shows `-5`, click again → `5`
- [ ] Test count: ~15–20 cases
- [ ] `npm run test -- --run` passes
- [ ] No snapshot tests (prefer explicit assertions for clarity)

**Tests**: component (RTL)
**Gate**: full

**Requirement Traceability**: FE-01/02 (input), FE-05/08/09 (API, display), FE-07 (danger styling), FE-11/12/13 (actions), FE-15 (tokens applied), FE-16/17 (layout, responsive — render on small viewport and verify no horizontal scroll)

---

### T22: Write HelpModal component tests

**What**: Component tests for HelpModal: opens, closes, lists shortcuts.
**Where**: `frontend/src/components/HelpModal.test.tsx`
**Depends on**: T18 (HelpModal.tsx)
**Reuses**: RTL + Vitest pattern
**Requirement**: FE-14

**Tools**:
- MCP: None
- Skill: NONE

**Done when**:
- [ ] Uses `@testing-library/react` (`render`, `screen`, `fireEvent`, `userEvent`)
- [ ] Test cases cover:
  - **Modal not rendered when `isOpen={false}`** → text "Keyboard Shortcuts" not in DOM
  - **Modal rendered when `isOpen={true}`** → title, shortcut list, close button visible
  - **Close button calls `onClose`** → button found, clicked, `onClose` callback fires
  - **Escape key closes modal** (FE-14): press Escape, `onClose` fires
  - **Shortcuts listed** → verify shortcut items appear (at least spot-check: "Digits", "Enter", "Backspace", etc.)
  - **Backdrop (optional)** → if implemented, click overlay → `onClose` fires
- [ ] Test count: ~8–10 cases
- [ ] `npm run test -- --run` passes

**Tests**: component (RTL)
**Gate**: full

**Requirement Traceability**: FE-14 (modal open/close, shortcuts list)

---

### T23: Create Dockerfiles and docker-compose.yml

**What**: Multi-stage Docker build files for backend and frontend, and a docker-compose.yml orchestrating both on ports 8090 and 8080.
**Where**: `backend/Dockerfile`, `frontend/Dockerfile`, `docker-compose.yml`
**Depends on**: T7 (backend complete and buildable), T12/T18 (frontend buildable)
**Reuses**: Multi-stage pattern (from dinherim), same base images and conventions
**Requirement**: OPS-07

**Tools**:
- MCP: context7 (if unsure about exact Go/Node base-image versions; otherwise standard patterns)
- Skill: NONE

**Done when**:
- [ ] **`backend/Dockerfile`**:
  - Stage 1 (builder): `golang:<pinned-version>` (from `go.mod`'s `go` directive)
    - Copy `go.mod`, `go.sum`, run `go mod download`
    - Copy source code, run `CGO_ENABLED=0 go build -o /app/bin/backend ./main.go` (or your entry point)
    - Result: statically-linked binary
  - Stage 2 (runtime): `distroless/base:nonroot` or `alpine:latest` (nonroot preferred, matching pattern from dinherim)
    - Copy binary from stage 1 to `/app`
    - `EXPOSE 8090`
    - `ENTRYPOINT ["/app/bin/backend"]` (or `/app/backend`, depending on binary name)
  - Verify `docker build -t seezle-backend backend/` succeeds
- [ ] **`frontend/Dockerfile`**:
  - Stage 1 (builder): `node:<pinned-version>` (from `package.json`'s `engines.node` or latest stable, e.g., 20+)
    - Copy `package*.json`, run `npm ci` (or `npm install`)
    - Copy source, run `npm run build`
    - Result: `dist/` directory
  - Stage 2 (runtime): `nginx:alpine`
    - Copy `dist/` from stage 1 to `/usr/share/nginx/html`
    - Copy a simple `nginx.conf` (or use default; serve static files, redirect 404s to `index.html` for SPA)
    - `EXPOSE 8080`
    - `CMD ["nginx", "-g", "daemon off;"]`
  - Verify `docker build -t seezle-frontend frontend/` succeeds
  - **Note**: Build args: `VITE_API_BASE_URL` passed as build arg, baked into the Vite build
- [ ] **`docker-compose.yml`**:
  - Version: `3.8` or `3.9`
  - Services:
    - **backend**:
      - `build: ./backend`
      - `ports: ["8090:8090"]`
      - `environment`: `API_PORT=8090`, `APP_ENV=production`, `GIN_MODE=release`, `LOG_LEVEL=info`
    - **frontend**:
      - `build: { context: ./frontend, args: { VITE_API_BASE_URL: "http://localhost:8090" } }`
      - `ports: ["8080:8080"]`
      - `depends_on: [backend]` (frontend waits for backend to start)
  - No volumes, no networks beyond default bridge
  - Verify `docker compose up` brings both services up, no build errors
  - Verify `curl localhost:8090/swagger/index.html` returns HTML (Swagger UI)
  - Verify opening `http://localhost:8080` in a browser shows the calculator UI

**Tests**: none (manual Docker build + compose verification)
**Gate**: build (Dockerfiles build successfully)

**Requirement Traceability**: OPS-07 (Dockerfile + docker-compose)

---

### T24: Create README.md and docs/API.md

**What**: Project README documenting setup, building, running, SDD process, and API documentation.
**Where**: `README.md`, `docs/API.md`
**Depends on**: T7 (backend complete), T18 (frontend complete), T23 (Docker setup), T26 (design docs)
**Reuses**: Standard markdown, RESTful API doc conventions
**Requirement**: OPS-01, OPS-02, OPS-03

**Tools**:
- MCP: None
- Skill: NONE

**Done when**:
- [ ] **`README.md`**:
  - Project title and brief description
  - **Setup** section: prerequisites (Node 20+, Go 1.26+, Docker/Compose optional), installation steps (`npm install` in frontend, `go mod download` in backend)
  - **Quick start**: `docker compose up` to run both services, or manual `npm run dev` (frontend) + `go run ./` (backend)
  - **Building**: `npm run build` (frontend), `go build ./...` (backend)
  - **Testing**: `npm run test -- --run` (frontend), `go test ./...` (backend)
  - **API**: Link to `docs/API.md`
  - **Design**: Link to `docs/codebase/DESIGN.md` (generated by `/design` skill)
  - **Test Coverage**: Link to `docs/codebase/COVERAGE.md`
  - **Prompts**: Link to `docs/PROMPTS.md` (all user prompts this session)
  - **Spec-Driven Development**: Document the SDD process used to build this feature:
    - "This project was built using Spec-Driven Development with a grilling phase."
    - "Specification, design, and task breakdown live in `.specs/features/SEZ-1-calculator-mvp/`:"
    - "  - `grilling-session.md` — questions resolved during grilling"
    - "  - `spec.md` — full requirements and acceptance criteria"
    - "  - `design.md` — architecture and component design"
    - "  - `tasks.md` — atomic task breakdown"
    - "  - `commits.md` — log of commits (generated at end of Execute phase)"
    - "  - `validation.md` — verification report from Verifier (generated at end of Execute phase)"
  - **Repository**: Link to GitHub repo (`https://github.com/flaviosv/seezle-test-assessment`)
  - **License** (optional, e.g., MIT)
- [ ] **`docs/API.md`**:
  - **Overview**: Single endpoint, `POST /v1/calculate`, stateless
  - **Request format**:
    - URL: `POST http://localhost:8090/v1/calculate`
    - Headers: `Content-Type: application/json`
    - Body: `{"operation": "<expression>"}`
    - Example: `{"operation": "2+2"}`
  - **Response format** (success, `200`):
    - Body: `{"operation": "<original>", "result": <number>}`
    - Example: `{"operation": "2+2", "result": 4}`
    - `result` is a JSON number, never a string
    - Rounded to 10 significant digits, trailing zeros trimmed, no scientific notation
  - **Response format** (error, `400`):
    - Body: `{"error": "<message>"}`
    - Example: `{"error": "operations: expression does not match the grammar"}`
    - Covers: malformed JSON, invalid characters, grammar mismatches, division by zero, square root of negative, non-finite results
  - **Error messages**: List possible error messages and their causes
  - **Examples**:
    - `curl -X POST http://localhost:8090/v1/calculate -H "Content-Type: application/json" -d '{"operation":"2+2"}'`
    - Response: `{"operation":"2+2","result":4}`
    - `curl -X POST http://localhost:8090/v1/calculate -H "Content-Type: application/json" -d '{"operation":"1/0"}'`
    - Response: `{"error":"operations: division by zero"}`
  - **Swagger/OpenAPI**: Link to interactive Swagger UI (`http://localhost:8090/swagger/index.html`) or ReDoc (`http://localhost:8090/docs`)
  - **Supported operations**: List the 7 operations: `+`, `-`, `*`, `/`, `^` (exponent), `\` (square root), `%` (percent)
  - **Grammar**: Link to `spec.md` for formal grammar (or summarize: left-to-right, no precedence, postfix unary ops bind to their term only)

**Tests**: none (documentation-only)
**Gate**: none (manual review)

**Requirement Traceability**: OPS-01 (README), OPS-02 (SDD documentation in README), OPS-03 (API docs)

---

### T25: Create docs/codebase/DESIGN.md, COVERAGE.md, docs/PROMPTS.md, and root CLAUDE.md note

**What**: Generate codebase documentation: design rationale, test coverage matrix, prompt log, and project guidelines note.
**Where**: `docs/codebase/DESIGN.md`, `docs/codebase/COVERAGE.md`, `docs/PROMPTS.md`, `CLAUDE.md`
**Depends on**: T7, T18 (design complete), T8–T11, T19–T22 (tests written)
**Reuses**: Markdown templates
**Requirement**: OPS-04, OPS-05, OPS-08, OPS-09

**Tools**:
- MCP: None
- Skill: NONE

**Done when**:
- [ ] **`docs/codebase/DESIGN.md`**:
  - Derived from `.specs/features/SEZ-1-calculator-mvp/design.md` (expand architectural notes, component structure, state machine diagrams, etc.)
  - Include Mermaid diagrams (already in design.md) showing data flow, state machine, component hierarchy
  - Document the UI rationale: colors from palette, layout from macOS Calculator reference
  - Summarize parser algorithm, error handling strategy, rounding logic
  - List every component and its responsibility
  - Note: Exact visual details (screenshots, final CSS values) are the responsibility of the Claude Design system created in T27; this doc focuses on architecture and intent
- [ ] **`docs/codebase/COVERAGE.md`**:
  - Summary table of test coverage across backend and frontend
  - Backend: parser tests (unit, ~40 cases), usecase tests (unit, ~10–15), handler tests (integration, ~12–15), routes tests (integration, ~5–7)
  - Frontend: useCalculator tests (unit, ~25–35), calculate API tests (unit, ~10–12), CalculatorApp tests (component, ~15–20), HelpModal tests (component, ~8–10)
  - Total test count: ~130–180 tests across all test files
  - Coverage expectations (from Test Coverage Matrix in tasks.md): backend domain logic 100% branches, handler/routes all paths, frontend hook all transitions, components all interactions
  - Note: No e2e tests (per spec); visual fidelity (FE-15/16/17) verified manually against references
  - Gap analysis (if any): note what is not tested by design (e.g., "HelpModal overlay click to close is implemented but not tested — design choice: RTL focus is on critical paths")
- [ ] **`docs/PROMPTS.md`**:
  - Numbered list of every user prompt provided during this session (no headings, just a list as per OPS-08)
  - Exact verbatim text of each prompt
  - Count: [N] prompts total (where N is determined by the user's actual messages this session)
  - This file is a reference for future sessions and for understanding the design intent
- [ ] **`CLAUDE.md`** (root, project-level note):
  - Brief note on SDD process and maintenance of `docs/PROMPTS.md`
  - Example:
    ```
    ## Spec-Driven Development

    This project was built using Spec-Driven Development (SDD). The specification,
    design, tasks, and validation all live in `.specs/features/SEZ-1-calculator-mvp/`.

    Future sessions should:
    1. Read `.specs/STATE.md` (decisions, handoff notes)
    2. Keep `docs/PROMPTS.md` updated with every new user prompt
    3. Re-read this note each session
    ```
  - No code changes in this file, just documentation
- [ ] All Markdown files are valid (no broken links, proper formatting)
- [ ] Files render correctly on GitHub (test by viewing in markdown preview or via GitHub's web interface locally)

**Tests**: none (documentation-only)
**Gate**: none (manual review)

**Requirement Traceability**: OPS-04 (design doc), OPS-05 (coverage), OPS-08 (prompts list), OPS-09 (CLAUDE.md note + guidance to keep prompts updated)

---

### T26: Create Postman collection and run /design skill for UI artboards

**What**: Create a Postman collection with API requests for testing the backend, and invoke the `/design` skill to build the actual UI artboards and Claude Design system.
**Where**: `Seezle Test Assessment.postman_collection.json`, Claude Design system: `seezle-technical-assesment`
**Depends on**: T7 (backend complete with Swagger), T18 (design tokens defined, frontend ready for design)
**Reuses**: Postman JSON format; `/design` skill (existing Claude feature)
**Requirement**: OPS-06, OPS-11

**Tools**:
- MCP: None
- Skill: `/design` (activated inline, per OPS-11)

**Done when**:
- [ ] **Postman collection** `Seezle Test Assessment.postman_collection.json`:
  - Created and committed to repo root
  - Contains environment variable: `api_base_url` (default: `http://localhost:8090`)
  - Requests:
    - **Success**: `POST {{api_base_url}}/v1/calculate` with body `{"operation": "2+2"}` → expects `200` with result `4`
    - **Operators**: One request per operation: `+`, `-`, `*`, `/`, `^`, `\`, `%` (e.g., `5+3`, `10-2`, `2*3`, `8/2`, `2^3`, `16\`, `50%`)
    - **Chained operators**: `16\%` → `0.04`, `4+16\` → `20`
    - **Negative numbers**: `-5+3`, `5--3`
    - **Error cases**: `1/0` (div by zero), `-4\` (neg sqrt), `1.2.3` (invalid), empty `""`, invalid char `@`
    - **Edge cases**: Very small/large magnitudes, decimal rounding
    - Each request includes pre-request script (optional): set timestamp, log request
    - Each request includes test assertions (optional): check status code, validate response schema, verify result precision
  - All requests are executable against the running `docker compose up` stack
  - Verify: import collection into Postman desktop/web, run all requests, all pass (status 200 or 400 as expected)
- [ ] **Invoke `/design` skill**:
  - Per OPS-11: "The frontend UI is built using the `/design` skill; its resulting Claude Design system is named `seezle-technical-assesment` and linked to this project"
  - Input to `/design` skill:
    - Design tokens from `design.md` (colors, typography, spacing)
    - Layout structure: echoed-operation-above-result, backspace/AC/= buttons, digit grid, operator column, ± and . at bottom, ? help button top-right
    - References: macOS Calculator (layout), ui-reference.png (color palette)
    - Responsive: mobile-first, scales from mobile to desktop
    - Interactive elements: buttons dispatch handlers from `useCalculator` hook (no backend interaction in the design file itself)
  - Output: Claude Design system canvas named `seezle-technical-assesment` (editable by designers, consumed by the actual React components via CSS tokens + Tailwind)
  - Link the design system in the project (e.g., in a `DESIGN_SYSTEM.md` file or in `docs/codebase/DESIGN.md`)
  - No code changes to React components based on design system output — the design system is purely visual refinement of the tokens already defined in `tokens.css`

**Tests**: none (Postman requests are manual verification; design system is visual verification)
**Gate**: none (manual: Postman requests pass, design system renders correctly)

**Requirement Traceability**: OPS-06 (Postman collection), OPS-11 (Claude Design system)

---

## Task Granularity Check

| Task | Scope | Status |
| --- | --- | --- |
| T1 | Backend project init + shared packages (one responsibility: infrastructure setup) | ✅ Granular (T2 can't start without it) |
| T2 | Middleware stack (one concern: request lifecycle) | ✅ Granular (T3 needs middleware) |
| T3 | Response envelope + routes (one concern: HTTP contract shape + routing) | ✅ Granular (T4 needs routes) |
| T4 | Handler (one endpoint, one file) | ✅ Granular |
| T5 | UseCase (one function, rounding logic) | ✅ Granular |
| T6 | Parser + errors (one algorithm, one semantic unit) | ✅ Granular |
| T7 | Wire main.go, Swagger (one concern: bootstrap + generation) | ✅ Granular (completes backend) |
| T8 | Parser tests (one layer tested) | ✅ Granular |
| T9 | UseCase tests (one layer tested) | ✅ Granular |
| T10 | Handler tests (one layer tested) | ✅ Granular |
| T11 | Routes tests (one concern: routing + Swagger) | ✅ Granular |
| T12 | Frontend project setup (one responsibility: tooling) | ✅ Granular |
| T13 | useCalculator hook (one custom hook, one state machine) | ✅ Granular (core FE logic) |
| T14 | API client (one function) | ✅ Granular |
| T15 | App + CalculatorApp (two closely-related layout components, one responsibility: top-level structure) | ⚠️ Acceptable (T16/T17 depend on layout, so can't be split) |
| T16 | Display component (one presentational component) | ✅ Granular |
| T17 | ButtonGrid + HelpButton (two closely-related components, one concern: user input buttons) | ⚠️ Acceptable (small, related, no further splits possible) |
| T18 | HelpModal + tokens.css (two concerns: component + styling foundation) | ⚠️ Acceptable (modal requires tokens to style it) |
| T19 | useCalculator tests (one hook tested) | ✅ Granular |
| T20 | API client tests (one client tested) | ✅ Granular |
| T21 | CalculatorApp tests (one component tested) | ✅ Granular |
| T22 | HelpModal tests (one component tested) | ✅ Granular |
| T23 | Dockerfiles + compose (one concern: deployment) | ✅ Granular |
| T24 | README + API docs (two docs, one responsibility: project documentation) | ⚠️ Acceptable (both are inline documentation, hard to split) |
| T25 | Design doc + coverage + prompts + CLAUDE.md (four docs, one responsibility: codebase documentation) | ⚠️ Acceptable (all are reference docs, bundled for efficiency) |
| T26 | Postman collection + design skill (one verification task + one design output) | ⚠️ Acceptable (Postman tests the API; design system is the design output per OPS-11) |

**Result**: Granularity is good. Tasks with ⚠️ are justified by cohesion and dependencies.

---

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
| --- | --- | --- | --- |
| T1 | None | No arrows → T1 | ✅ Match |
| T2 | T1 | T1 → T2 | ✅ Match |
| T3 | T1, T2 | T2 → T3 | ✅ Match (T1 not re-drawn as dependency) |
| T4 | T1, T3 | T3 → T4 | ✅ Match |
| T5 | T1 | T4 → T5 (T1 not re-drawn) | ✅ Match |
| T6 | T1 | T5 → T6 | ✅ Match |
| T7 | T1, T2, T3, T4, T5, T6 | T6 → T7 | ✅ Match (T1–T6 all precede; diagram shows final step) |
| T8 | T6 | Phase 1 complete → Phase 2; T8 first | ✅ Match |
| T9 | T5 | T8 → T9 | ✅ Match |
| T10 | T4, T5 | T9 → T10 | ✅ Match |
| T11 | T3, T7 | T10 → T11 | ✅ Match |
| T12 | None | Phase 2 complete → Phase 3; T12 first | ✅ Match |
| T13 | T12, T14 | T12 → T13 | ⚠️ T14 not yet ready; see resolution below |
| T14 | T12 | T13 → T14 (after T14 is ready) | ⚠️ Forward dependency |
| T15 | T13 | T14 → T15 | ✅ Match |
| T16 | T12 | T15 → T16 | ✅ Match |
| T17 | T12 | T16 → T17 | ✅ Match |
| T18 | T12 | T17 → T18 | ✅ Match |
| T19 | T13, T14 | Phase 3 complete → Phase 4; T19 first | ✅ Match |
| T20 | T14 | T19 → T20 | ✅ Match |
| T21 | T15 | T20 → T21 | ✅ Match |
| T22 | T18 | T21 → T22 | ✅ Match |
| T23 | T7, T12, T18 | Phase 4 complete → Phase 5; T23 first | ✅ Match |
| T24 | T7, T18, T23, T26 | T23 → T24 | ✅ Match (T26 order doesn't matter; order flexible in Phase 5) |
| T25 | T7, T18, T8–T11, T19–T22 | T24 → T25 | ✅ Match |
| T26 | T7, T18 | T25 → T26 | ✅ Match |

**Resolution for forward dependency (T13→T14)**: T13 calls `api.calculate()` from T14, but T14 is defined after T13 in the sequence. This is resolved by:
- T14 (api/calculate.ts) is a stub initially (exported function, empty body or `throw new Error("not implemented")`)
- T13 writes the useCalculator hook and tests, but tests mock the `api.calculate` function (via `vi.mock('api/calculate')`)
- T14 then implements the real function
- This is a standard test-driven development pattern and poses no circular-dependency issue

All dependencies are satisfied in execution order. ✅ **Diagram and definitions match.**

---

## Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
| --- | --- | --- | --- | --- |
| T1 | Config, Logger (shared/infrastructure) | none | none | ✅ OK |
| T2 | Middleware (shared/infrastructure) | none | none | ✅ OK |
| T3 | Response envelope, Routes (shared) | none | none | ✅ OK |
| T4 | operations.Handler (HTTP handler) | integration (routes) | none (T10) | ✅ OK (tests colocated in T10) |
| T5 | operations.UseCase (domain logic) | unit | none (T9) | ✅ OK (tests colocated in T9) |
| T6 | operations.Parser, errors (domain logic) | unit | none (T8) | ✅ OK (tests colocated in T8) |
| T7 | main.go, Swagger generation (infrastructure) | none | none | ✅ OK (integration via T11) |
| T8 | parser_test.go (parser tests) | — | unit | ✅ OK |
| T9 | usecase_test.go (usecase tests) | — | unit | ✅ OK |
| T10 | handler_test.go (handler tests) | — | integration | ✅ OK |
| T11 | routes_test.go (routes tests) | — | integration | ✅ OK |
| T12 | Project tooling (build config) | none | none | ✅ OK |
| T13 | useCalculator hook (custom hook, domain logic) | unit | none (T19) | ✅ OK (tests colocated in T19) |
| T14 | api/calculate.ts (API client, logic) | unit | none (T20) | ✅ OK (tests colocated in T20) |
| T15 | CalculatorApp, App (layout components, no logic) | none | none (T21) | ✅ OK (integration via T21) |
| T16 | Display (presentational) | none | none (T21) | ✅ OK (integration via T21) |
| T17 | ButtonGrid, HelpButton (presentational) | none | none (T21) | ✅ OK (integration via T21) |
| T18 | HelpModal (presentational), tokens.css | none | none (T22) | ✅ OK (integration via T22) |
| T19 | useCalculator.test.ts | — | unit | ✅ OK |
| T20 | calculate.test.ts | — | unit | ✅ OK |
| T21 | CalculatorApp.test.tsx | — | component | ✅ OK |
| T22 | HelpModal.test.tsx | — | component | ✅ OK |
| T23 | Dockerfiles, compose (infrastructure) | none | none | ✅ OK (build gate only) |
| T24 | README, API docs (documentation) | none | none | ✅ OK |
| T25 | Design/coverage/prompts/CLAUDE.md (documentation) | none | none | ✅ OK |
| T26 | Postman collection, design system (verification/design) | none | none | ✅ OK |

**Result**: Every task's test requirement matches the coverage matrix. ✅ **Test co-location is valid.**

---

## Requirement Traceability

Every task is mapped to one or more requirement IDs from spec.md's Requirement Traceability table:

| Req ID | Story | Task(s) | Task Names |
| --- | --- | --- | --- |
| CALC-01 | P1 | T6, T8 | Parser, Parser Tests |
| CALC-02 | P1 | T6, T8 | Parser, Parser Tests |
| CALC-03 | P1 | T6, T8 | Parser, Parser Tests |
| CALC-04 | P1 | T6, T8 | Parser, Parser Tests |
| CALC-05 | P1 | T6, T8 | Parser, Parser Tests |
| CALC-06 | P1 | T6, T8 | Parser, Parser Tests |
| CALC-07 | P1 | T6, T8 | Parser, Parser Tests |
| CALC-08 | P1 | T6, T8 | Parser, Parser Tests |
| CALC-09 | P1 | T6, T8 | Parser, Parser Tests |
| CALC-10 | P1 | T5, T9 | UseCase, UseCase Tests |
| CALC-11 | P1 | T6, T8 | Parser, Parser Tests |
| API-01 | P1 | T4, T5, T10 | Handler, UseCase, Handler Tests |
| API-02 | P1 | T4, T5, T10 | Handler, UseCase, Handler Tests |
| API-03 | P1 | T4, T6, T10 | Handler, Parser, Handler Tests |
| API-04 | P1 | T4, T10 | Handler, Handler Tests |
| API-05 | P1 | T4, T10 | Handler, Handler Tests |
| API-06 | P1 | T1, T2, T10 | Backend Setup, Middleware, Handler Tests |
| API-07 | P1 | T3, T7, T11 | Routes, Wire main.go, Routes Tests |
| FE-01 | P1 | T13, T15, T17, T21 | useCalculator, CalculatorApp, ButtonGrid, CalculatorApp Tests |
| FE-02 | P1 | T13, T15, T17, T21 | useCalculator, CalculatorApp, ButtonGrid, CalculatorApp Tests |
| FE-03 | P1 | T13 | useCalculator |
| FE-04 | P1 | T13 | useCalculator |
| FE-05 | P1 | T14, T15, T21 | API Client, CalculatorApp, CalculatorApp Tests |
| FE-06 | P1 | T13, T15, T21 | useCalculator, CalculatorApp, CalculatorApp Tests |
| FE-07 | P1 | T17, T21 | ButtonGrid, CalculatorApp Tests |
| FE-08 | P1 | T14, T15, T21 | API Client, CalculatorApp, CalculatorApp Tests |
| FE-09 | P1 | T13, T14, T15, T21 | useCalculator, API Client, CalculatorApp, CalculatorApp Tests |
| FE-10 | P2 | T13, T21 | useCalculator, CalculatorApp Tests |
| FE-11 | P2 | T13, T17, T21 | useCalculator, ButtonGrid, CalculatorApp Tests |
| FE-12 | P2 | T13, T17, T21 | useCalculator, ButtonGrid, CalculatorApp Tests |
| FE-13 | P2 | T13, T17, T21 | useCalculator, ButtonGrid, CalculatorApp Tests |
| FE-14 | P2 | T18, T22 | HelpModal, HelpModal Tests |
| FE-15 | P2 | T18, T21 | HelpModal, CalculatorApp Tests |
| FE-16 | P2 | T15, T17, T21 | CalculatorApp, ButtonGrid, CalculatorApp Tests |
| FE-17 | P2 | T15, T17, T21 | CalculatorApp, ButtonGrid, CalculatorApp Tests |
| OPS-01 | Non-func | T24 | README + API docs |
| OPS-02 | Non-func | T24 | README + API docs |
| OPS-03 | Non-func | T24 | README + API docs |
| OPS-04 | Non-func | T25 | Design doc + coverage + prompts + CLAUDE.md |
| OPS-05 | Non-func | T25 | Design doc + coverage + prompts + CLAUDE.md |
| OPS-06 | Non-func | T26 | Postman collection |
| OPS-07 | Non-func | T1, T23 | Backend Setup, Dockerfiles + Compose |
| OPS-08 | Non-func | T25 | Prompts list |
| OPS-09 | Non-func | T25 | CLAUDE.md note |
| OPS-10 | Non-func | T8–T11, T19–T22 | All test tasks |
| OPS-11 | Non-func | T18, T26 | Design tokens, /design skill invocation |

**Coverage**: 46 requirements, 46 addressed by tasks (0 unmapped). ✅ **All requirements traced.**

---

## Summary

- **Status**: Draft (ready for user approval before Execute)
- **Total tasks**: 26
- **Phases**: 5 (Backend Foundation, Backend Testing, Frontend Foundation, Frontend Testing, Delivery & Documentation)
- **Estimated execution**: ~3 sub-agent batches (if >8 tasks), or 1 inline (if ≤8 tasks)
  - Batch 1: Phase 1 (7 tasks) — Backend Foundation
  - Batch 2: Phase 2 (4 tasks) + Phase 3 (7 tasks) = 11 tasks — Backend Testing + Frontend Foundation (exceeds budget, offer split)
  - Batch 3: Phase 4 (4 tasks) — Frontend Testing
  - Batch 4: Phase 5 (5 tasks) — Delivery & Documentation
  - **Decision**: >8 tasks total (26), so sub-agents will be offered (see Execute phase for packing algorithm)
- **Test count** (target, per Test Coverage Matrix):
  - Backend: ~70–80 tests (parser, usecase, handler, routes)
  - Frontend: ~60–75 tests (hook, API, components)
  - Total: ~130–155 tests
- **Requirement coverage**: 100% (46/46 requirements traced to tasks)
- **Key dependencies**: Backend must complete before frontend can fully test (API client + CalculatorApp). Both must complete before delivery/documentation.

---

## Next Steps

1. **Review and approve**: User confirms this task breakdown is correct, granular, and complete
2. **MCPs & Skills confirmation**: Agent asks user which tools/MCPs/skills should be used (per reference section "Step 6 — Ask About MCPs")
3. **Execute**: Implement all tasks in order, one per cycle, with automated gate checks after each task
4. **Validation**: After the final task, a fresh Verifier sub-agent runs automatically to check spec compliance and inject test mutations

If the total task count (26) exceeds a single batch (>~8 tasks), the Execute phase will offer to spawn batch workers. The user can approve and the work proceeds in parallel batches.
