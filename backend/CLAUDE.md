# Backend (`backend/`)

## Purpose

A stateless Go 1.26 + Gin 1.12 microservice with a single responsibility: parse and evaluate a
left-to-right (no operator precedence, no parentheses) arithmetic grammar via `POST /v1/calculate`.
No database, cache, or auth exists anywhere in this package (API-06) — every request is an
independent, side-effect-free computation.

Sibling package in a two-service monorepo (`frontend/`, `e2e/`). Cross-cutting docs live at the repo
root: [`docs/codebase/DESIGN.md`](../docs/codebase/DESIGN.md), the coverage summary at
[`docs/codebase/COVERAGE.md`](../docs/codebase/COVERAGE.md), and the originating spec at
[`.specs/features/SEZ-1-calculator-mvp/`](../.specs/features/SEZ-1-calculator-mvp/).

## Architecture

Slice-based architecture, replicated in *shape* (not content) from two reference repos (`dinherim`,
`applyr`) — see `.specs/STATE.md` AD-001.

```
main.go                          boot: config → logger → middleware chain → routes → graceful shutdown
internal/
  operations/                    the single business slice
    handler.go                     HTTP <-> UseCase translation, swaggo doc annotations
    usecase.go                     Calculate(): rounds/formats the parsed result
    parser.go                      the grammar parser/evaluator
    errors.go                      7 sentinel errors, all mapped to HTTP 400
  routes/routes.go               registers POST /v1/calculate on the v1 group; Swagger/ReDoc on the bare engine
  middleware/
    cors.go                        Allow-Origin "*" (API-06: nothing to protect)
    request_context.go             stamps a UUID request ID + scoped slog.Logger into gin.Context
    request_timeout.go             504 on timeout (gin-contrib/timeout)
    security_headers.go            nosniff / DENY / CSP, applied on the v1 group only
  shared/
    config/                        env-driven Config, safe defaults, never fails
    logger/                        slog JSON handler, level-driven
    http/response/                 the single ErrorResponse envelope
docs/                            swaggo-generated (docs.go, embed.go, swagger.json/yaml) — not hand-written
```

`main.go`'s server: `ReadHeaderTimeout` 5s, `ReadTimeout` 20s, `WriteTimeout` 25s, `IdleTimeout` 60s,
1MB `MaxHeaderBytes`, graceful shutdown on `SIGINT`/`SIGTERM` with a 15s drain grace period.

Middleware chain order: `gin.Recovery()` → `CORS()` → `RequestTimeout(20s)` → `RequestContext(log)`,
then on the `v1` group only: `SecurityHeaders()`.

### Request/Data Flow

```
POST /v1/calculate {"operation": "<expr>"}
  → Handler.Calculate      bind JSON, 1MB body cap
    → UseCase.Calculate      orchestrates parse + format
      → parser.evaluate       left-to-right Term (BinaryOp Term)* walk
      → UseCase.formatResult  round to 10 significant digits, trim trailing zeros, reject non-finite
  → 200 {"operation": "...", "result": <json.Number>}
  → 400 {"error": "<message>"}   (any parse or math error)
```

`json.Number` (not a bare `float64`) is used for `result` specifically so extreme magnitudes never
serialize in scientific notation (`.specs/STATE.md` AD-004).

## Key Components

| Component | Role |
| --- | --- |
| `operations.Handler` | Binds/validates the request, delegates to `UseCase`, maps errors to `400` |
| `operations.UseCase` | Orchestrates `evaluate()` then rounds/formats the result; stateless, no fields |
| `parser.go` (package-private functions) | `evaluate`, `parseTerm`, `applyBinaryOp` — the grammar engine |
| `routes.Routes` | Wires the slice's handler onto the `v1` group; wires Swagger/ReDoc onto the bare engine |
| `middleware.CORS` / `RequestTimeout` / `RequestContext` / `SecurityHeaders` | Cross-cutting request concerns, composed once in `main.go` |

## Public API

Single REST endpoint: `POST /v1/calculate`.

- **Request**: `{"operation": string}` — grammar alphabet is `0-9 . + - * / ^ \ %`, no whitespace.
- **Response `200`**: `{"operation": string, "result": number}`.
- **Response `400`**: `{"error": string}` — for any format error (empty, invalid character,
  malformed grammar, double-decimal, trailing operator, etc.) or math error (divide by zero, modulo
  by zero, square root of a negative number, non-finite result).
- Interactive docs: `GET /swagger/index.html` (Swagger UI) and `GET /docs` (ReDoc).
- No authentication on any route (API-06).

## Internal Design

Grammar semantics worth knowing before touching `parser.go` — easy to get wrong:

- Expressions evaluate **strictly left to right**, no precedence.
- `%` is **context-sensitive**: a digit immediately following it makes it binary **modulo** (folds
  into the running total like `+ - * / ^`); anything else (an operator, or end of expression) makes
  it postfix **percent**, applying only to the `Term` just parsed — never to a running total.
- `\` (square root) and `%` (percent) are postfix unary operators that chain in the order written
  and bind only to their own `Term`.
- `-` is contextual: it starts a negative operand's sign at expression-start or immediately after
  any operator; otherwise it's binary subtraction. A second consecutive `-` in operand-start
  position is a format error.

Two defensive branches are intentionally left uncovered by tests (see
[`docs/codebase/COVERAGE.md`](../docs/codebase/COVERAGE.md) for the reasoning): `applyBinaryOp`'s
`default` case (`isBinaryOp` already filters every caller to a valid operator) and `parseTerm`'s
postfix-loop non-finite guard (a finite value can't become non-finite via `\` or `%` alone —
`strconv.ParseFloat`'s own overflow check is what actually rejects a `Term` literal that would
otherwise overflow `float64`).

## Dependencies (External)

`gin-gonic/gin` v1.12 (HTTP framework) · `gin-contrib/timeout` (request-timeout middleware) ·
`swaggo/swag` + `swaggo/gin-swagger` + `swaggo/files` (OpenAPI generation/serving) ·
`mvrilo/go-redoc` + `go-redoc/gin` (ReDoc UI) · `google/uuid` (request IDs) · `log/slog` (Go
stdlib, structured logging). No ORM, no DB driver, no auth library — none needed.

## Integration Points

- Consumed by `../frontend/` via `fetch`, cross-origin in dev (frontend `:8080` calling backend
  `:8090`) — the reason CORS matters here; a real production CORS bug was fixed on
  `feature/SEZ-2_CORS`.
- Consumed by `../e2e/` (Playwright) as the real backend in end-to-end tests — no mocking anywhere
  in that suite.
- Run as the `backend` service on `:8090` by the repo-root `docker-compose.yml`.

## Error Handling

All 7 sentinel errors in `errors.go` map to HTTP `400` uniformly — the handler never inspects
*which* sentinel fired to pick a different status (`.specs/STATE.md` AD-002: no status-dispatch
table, since this slice's error set never needs more than one non-2xx status). Tests use
`errors.Is` to assert which specific rule fired. A panicking request is recovered by
`gin.Recovery()` (top of the middleware chain) rather than crashing the process.

## Constraints

- Stateless — zero shared mutable state between requests (`UseCase` has no fields), so there is no
  concurrency/race surface to reason about.
- 1MB max request body.
- No rate limiting — there is no auth to key it on.
- Go 1.26 minimum (`go.mod`).

## Conventions

- Table-driven tests colocated as `_test.go` files next to the code they test (`parser_test.go`,
  `usecase_test.go`, `handler_test.go`, `routes_test.go`).
- A small `newTestHandler(t)` / `newTestUseCase(t)` constructor helper per test file.
- Swaggo doc-comment annotations (`@Summary`, `@Param`, …) directly above handler methods.
- Errors are plain `errors.New` sentinels, never a custom error type/struct.

## Testing Strategy

- **Unit**: `parser_test.go` (49 table-driven cases, 1:1 to spec acceptance criteria) +
  `usecase_test.go` (21 cases: 10-significant-digit rounding, no scientific notation, exact-zero,
  JSON round-trip, error pass-through).
- **Integration**: `handler_test.go` (13 cases, real Gin router + real handler + real usecase via
  `httptest`, no mocks) + `routes_test.go` (10 cases: route registration, Swagger/ReDoc `200`s).
- Coverage: `internal/operations` 98.3% statements (the 2 remaining uncovered statements are the
  intentionally-unreachable branches noted above); `internal/routes` 100%. `main`,
  `internal/middleware`, `internal/shared/*` report 0% direct coverage by design — exercised
  indirectly through the integration tests above and manual `docker compose up` verification. Full
  detail and exact commands: [`docs/codebase/COVERAGE.md`](../docs/codebase/COVERAGE.md).
- As of SEZ-4, the request/response contract is also exercised end-to-end (real browser, real
  backend, no mocks) by `../e2e/`.
