# Calculator MVP Specification

## Problem Statement

The assessment calls for a full-stack calculator: a React + TypeScript UI backed by a stateless Go + Gin
microservice, evaluating a left-to-right (no-precedence, no-parentheses) arithmetic grammar that includes
two postfix unary operators (percentage, square root) and contextual negative-number signs. There is no
existing implementation — this spec defines the whole vertical slice from keystroke/click to API response
to rendered result, plus the documentation and deployment artifacts the assessment requires as deliverables.

## Goals

- [ ] A user can enter an expression (digits + the seven operations: `+ - * / ^ \ %`) by clicking calculator
      buttons or typing on a keyboard, trigger a single calculation via "=" or Enter, and see the correct
      rounded result — or a clear "Error" state for any invalid/malformed input or math error (division by
      zero, square root of a negative number).
- [ ] The backend exposes exactly one endpoint, `POST /v1/calculate`, that parses and evaluates the formal
      grammar below, rejecting anything outside it with `400` and echoing the original operation string
      alongside the numeric result on success.
- [ ] The repo ships buildable, documented, and containerized: README + `docs/API.md` +
      `docs/codebase/DESIGN.md` + `docs/codebase/COVERAGE.md` + `docs/PROMPTS.md`, a Postman collection,
      Swagger/OpenAPI docs, and a `docker-compose.yml` running both services (frontend `:8080`, backend
      `:8090`).

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
| --- | --- |
| Additional calculator operations beyond the seven listed (`+ - * / ^ \ %`) | Not requested; seed spec fixes this operation set |
| Auth / user accounts | Seed spec: "No auth required" |
| Design-sync (ongoing Claude Design system maintenance after this feature ships) | Grilling explicitly designates this a post-delivery follow-up owned by the user, not part of this Specify→Execute cycle |
| E2E tests | Seed spec: "no e2e at this stage" |
| History / memory of past calculations | Not requested; only the current expression and its immediately-preceding result are ever live |
| Parentheses / operator-precedence changes | Seed spec: strict left-to-right evaluation only |
| Persistence (database / cache) | Seed spec: "no database, no cache — this is a simple stateless service" |
| Rate limiting | Not requested; no auth means no per-caller throttling concept to attach it to |
| Scientific/programmer calculator modes | Not requested — standard calculator UI only |

---

## Assumptions & Open Questions

Every ambiguity is resolved or recorded here — nothing is left silently unclear. (Ambiguities already
closed by the grilling session are not re-listed here — see `grilling-session.md` for those; this table
covers only what grilling left for Specify to resolve.)

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| Scope of client-side (frontend) input validation | FE only whitelists characters as they are typed/clicked (digits, the seven operators, `.`, plus the control keys Backspace/Enter/Escape); full grammar validation (double sign, trailing operator, malformed decimal, chained-postfix edge cases) is enforced **server-side only** and surfaced as "Error" on any `400` | Matches seed spec's own split: "UI must detect any pressed key, but only numbers and valid operators are accepted/validated" (character-level) vs. the backend owning "invalid format" rejection; avoids building the grammar engine twice in two languages | n (agent default, low-risk) |
| `result` JSON field type | Numeric JSON value (matches seed's own example `{"result": 0}`), formatted server-side via the confirmed 10-significant-digit rounding rule before serialization so float64 precision artifacts never leak into the encoded number | Seed's literal example response uses a bare numeric literal; the rounding rule exists specifically to keep that numeric encoding clean of float artifacts (e.g. `0.1+0.2`) | n |
| Digit vs. operator immediately after a shown result | A digit starts a brand-new expression (previous result discarded); an operator continues the expression using the previous result as the new starting operand | Mirrors the macOS Calculator reference and is the direct complement of the seed's own worked example ("result 2 from 1+1, then clicking/typing +1 continues as 2+1") | n |
| Leading-decimal auto-zero | The FE auto-prefixes `0` when `.` is pressed as the first character of a new operand, so the string sent to the backend is always grammar-valid (e.g. a displayed `.5` is sent as `0.5`) | The formal grammar requires `Digit+` before an optional `.`; forcing the user to type `0` first would contradict the seed's "intuitive UI" goal and the macOS Calculator reference's one-key decimal entry | n |
| Meaning of "integration test" for the backend's `operations` slice | Since this slice has no persistence/external dependency (no repository layer, unlike applyr/dinherim's DB-backed slices), "integration" = full HTTP round-trip tests via `httptest` against the real Gin router + real handler + real usecase (no mocks, no sqlmock); "unit" = table-driven tests of the parser/usecase logic in isolation, plus handler tests asserting request/response mapping | applyr/dinherim's integration layer specifically targets repository/DB correctness via testcontainers, which doesn't exist in a DB-less slice; a real-router round trip is the faithful analog the seed's "follow applyr's testing standards" instruction maps to here | n |
| Minimal shared backend plumbing | Basic config (listen ports) + Gin engine bootstrap + route registration is included, matching the replicated architectural shape (`internal/routes`, `main.go` wiring), but no DB, cache, auth, or shared-kernel packages are created | Seed forbids DB/cache/auth/"shared kernel" specifically, not basic web-server scaffolding; omitting all shared plumbing would contradict the instruction to replicate dinherim/applyr's architectural shape (see Technical Constraints) | n |
| Observability level | Basic structured logging only (consistent with the replicated architecture's `logger` package), no metrics/tracing | Not requested by seed or grilling; the dimensions sweep below requires this be resolved rather than left blank, and matching the reference repos' minimum baseline is the smallest defensible default | n |
| Numeric overflow (`±Infinity`/`NaN` results, e.g. from extreme exponentiation like `9999999999^9999999999`) | Treated as a math error → `400 { "error": "<message>" }`, same family as division-by-zero/negative-sqrt | `Infinity`/`NaN` cannot be encoded as a valid rounded JSON number per the confirmed rounding rule, and neither seed nor grilling specifies other overflow behavior | n |
| Backspace/`±` scope while an Error or a Result is displayed | Backspace and `±` only act while actively composing a not-yet-submitted expression; after a shown result, the next digit/operator keystroke governs continuation (see the digit-vs-operator row above); after a shown Error, only "AC" has any effect | Keeps the FE state machine's transitions unambiguous and consistent with grilling's confirmed error-lock ("requiring AC to clear before continuing") | n |
| Request/response transport | Standard `application/json` for both the request and response bodies; no custom headers required | Implicit REST convention; not called out as different anywhere in the seed spec or grilling session | n |

**Open questions:** none — all resolved or logged above (required before the spec is confirmed).

### Implicit-Requirement Dimensions Sweep

| Dimension | Resolution |
| --- | --- |
| Auth boundaries & rate limits | N/A because the seed spec explicitly states no auth is required and no rate limiting is requested (see API-06, Out of Scope) |
| Concurrency / ordering | N/A because every request is independently stateless; no shared mutable state exists between requests, so no race condition can arise |
| Data lifecycle / expiry | N/A because no data is persisted anywhere (no DB/cache per the seed's constraints) |
| External-dependency failure | N/A because the service calls no external dependency (no DB, cache, or third-party API) |
| Failure / partial-failure states | N/A because each request performs one atomic, side-effect-free computation — there is nothing to partially complete or roll back |
| Idempotency / retry / duplicate handling | Naturally satisfied, not a new behavior to build: `POST /v1/calculate` is a pure function of its `operation` string (same input always yields the same response), so it is inherently safe to retry; no dedup key is needed |
| Input validation & bounds | Covered by CALC-05..07 and API-03..05 (character whitelist + formal grammar + `400` on any violation); no explicit maximum expression length is requested, so length is bounded only by the HTTP server's ordinary default max-request-body size — no custom limit is added |
| Observability | Covered by the "Observability level" assumption above (basic structured logging only) |
| State-transition integrity | Covered by FE-06/FE-09/FE-10 — the FE's only state transitions (AC-clear, error-lock, result-continuation) are each precisely specified below |

---

## Technical Constraints

### Backend architecture (replicated from `dinherim` and `applyr`)

Both `~/Projects/Personal/dinherim` and `~/Projects/Personal/applyr` share a **slice-based** Go/Gin
architecture. This project replicates the *shape* only — no domain logic, types, or business rules are
copied.

- **Per-slice layout:** `internal/<slice>/` holds `handler.go` (HTTP ↔ use-case translation, Gin
  bindings, `swaggo` annotations for OpenAPI generation), `usecase.go` (the actual business logic,
  dependency-injected), and (only when persistence exists) `domain.go` + `repository.go`. Tests are
  colocated: `handler_test.go`, `usecase_test.go`, `domain_test.go`, `repository_test.go`.
- **This project's single slice:** `internal/operations/` — handler + usecase only, no `repository.go`
  (no persistence to abstract) and no shared kernel, per the seed spec ("Single self-contained
  'operations' slice ... No shared kernel needed at this stage"). Whether the grammar
  parser/evaluator lives in `usecase.go` directly or is split into its own file is a Design-phase
  decision, not fixed here.
- **Shared plumbing kept minimal:** `internal/shared/config` (listen ports), a `main.go` that boots the
  Gin engine, and `internal/routes/routes.go` registering the slice's route(s) on a `v1` route group —
  mirroring both reference repos' convention of registering slice routes on `v1`, never on the bare
  engine (dinherim/applyr's AD-002 lesson). No `internal/shared/db`, `di`, or auth middleware — those
  exist in the references only to support persistence/auth this project explicitly excludes.
  Swagger/ReDoc doc routes are registered the same way applyr's `routes.go` does it (`swaggo/gin-swagger`
  + `go-redoc`, embedded `swagger.json`), satisfying the seed's Swagger requirement.
- **Error responses:** both references funnel error JSON through a shared `response` package
  (`ErrorResponse{Error string}` body, sentinel-error→HTTP-status mapping). This project reuses that
  shape for both `400` families (format errors and math errors), per the grilling-confirmed
  `{"error": "<message>"}` envelope.

### Backend testing conventions (replicated from `applyr`)

- Go standard `testing`, table-driven test cases, colocated `_test.go` files.
- A small `newTest<Thing>(t)` constructor helper per test file (`newTestHandler`, `newTestUseCase`),
  matching applyr's convention — adapted here to build the `operations` handler/usecase directly (no
  `sqlmock`/GORM wiring, since there is no database).
  See the "Meaning of 'integration test'" row in Assumptions above for how applyr's sqlmock-unit /
  testcontainers-integration split maps onto a slice with no persistence layer.

### Frontend

- React + TypeScript, tooling consistent with `applyr/frontend`'s stack (Vitest + `@testing-library/react`
  for unit/component tests, per the seed's "consistent with the chosen tooling" instruction).
- Built using the `/design` skill; the resulting Claude Design system is named
  `seezle-technical-assesment` and linked to this project (see OPS-11).

### Deployment

- Dockerfile(s) for frontend and backend, plus `docker-compose.yml`. Ports fixed by this session's
  earlier port-conflict check: backend `8090`, frontend `8080` (avoids the local k3d cluster's bound
  `80/443/5432/5001/6443`).

---

## User Stories

### P1: Calculate an expression and see the result ⭐ MVP

**User Story**: As a user, I want to enter an arithmetic expression — using the seven supported
operations, including postfix percentage/square-root and contextual negative signs — by clicking
calculator buttons or typing on my keyboard, and get the correct result in one step when I press "="
or Enter, so I can do everyday left-to-right arithmetic without worrying about operator precedence.

**Why P1**: This is the entire product — without it there is no calculator to demo.

**Acceptance Criteria**:

1. WHEN the user clicks number/operator buttons THEN the system SHALL accumulate an expression string
   without performing any calculation (FE-01).
2. WHEN the user types number/operator keys on the keyboard THEN the system SHALL accumulate the same
   expression string without calculating (FE-02); the typed keys `+ - * / ^ \ %` SHALL map to the
   identical semantics as their button counterparts (FE-03).
3. WHEN any key is pressed THEN the system SHALL detect the keydown event, but SHALL only append the key
   to the expression if it is a digit, one of the seven operators, `.`, or one of the control keys
   Enter/Backspace/Escape — every other key SHALL be ignored without altering state (FE-04).
4. WHEN the user clicks "=" or presses Enter THEN the system SHALL make exactly one
   `POST /v1/calculate` call with the accumulated expression as `operation`, and SHALL render the
   response (FE-05).
5. WHEN the user clicks or presses "AC" THEN the system SHALL clear all state — the expression being
   composed, the echoed operation, and any displayed result/error — back to the initial empty state
   (FE-06); the "AC" and "=" controls SHALL both be styled red and visually distinct from every other
   button (FE-07).
6. WHEN the backend returns `200` THEN the system SHALL replace all content in the display's result area
   with the returned `result`, and SHALL show the returned `operation` above it in smaller font (FE-08).
7. WHEN the backend returns `400` (format error or math error) THEN the system SHALL show "Error" in the
   result area, and SHALL ignore all digit/operator input until "AC" is pressed (FE-09).
8. WHEN `POST /v1/calculate` receives `{"operation": "<expr>"}` THEN the system SHALL parse `<expr>`
   against the formal grammar `Expression = Term (BinaryOp Term)*`, `Term = ['-'] Digit+ ['.' Digit+]
   UnaryOp*` (`BinaryOp ∈ {+,-,*,/,^}`, `UnaryOp ∈ {\,%}`, zero-or-more, chained left to right), and
   SHALL evaluate strictly left to right with no operator precedence and no parentheses (CALC-01,
   CALC-07).
9. WHEN a `Term` is followed by one or more `%` and/or `\` THEN the system SHALL apply them, in the order
   written, to that `Term`'s own value only — never to any running total from a preceding `BinaryOp`
   (CALC-02, CALC-03, CALC-04; e.g. `16\%` = `sqrt(16)%` = `4%` = `0.04`).
10. WHEN `-` appears as the first character of the whole expression, or immediately follows another
    operator (binary or unary), THEN the system SHALL parse it as a sign starting a negative operand;
    otherwise `-` SHALL be parsed as binary subtraction (CALC-05). WHEN a second consecutive `-` appears
    in operand-start position THEN the system SHALL reject the expression as a `400` format error
    (CALC-06; e.g. `5--3` = `8`, `-5+3` = `-2`, `5---3` → `400`).
11. WHEN the expression divides by zero, or applies `\` to a negative number, or produces a
    non-finite (`±Infinity`/`NaN`) value THEN the system SHALL reject with `400 {"error": "<message>"}`,
    the same status family as format errors (CALC-08, CALC-09, CALC-11).
12. WHEN the expression contains any character outside `0-9 . + - * / ^ \ %`, or does not fully match the
    formal grammar (e.g. a trailing operator with no following operand, as in `1+1+`), or the request
    body is malformed/missing the `operation` field THEN the system SHALL reject with
    `400 {"error": "<message>"}` (API-03, API-04, API-05).
13. WHEN a calculation succeeds THEN the system SHALL respond `200` with
    `{"operation": "<original operation>", "result": <number>}`, where `result` is rounded to 10
    significant digits, trailing zeros trimmed, and never rendered in scientific notation (CALC-10,
    API-01, API-02).
14. WHEN a request carries no credentials of any kind THEN the system SHALL still process it normally —
    no authentication mechanism exists to reject it against (API-06).
15. WHEN a client requests the API documentation endpoint THEN the system SHALL serve interactive
    Swagger/OpenAPI docs listing `POST /v1/calculate` (API-07).

**Independent Test**: With the backend running, click "2", "+", "2", "=" → display shows small "2+2"
above large "4". Type `16\%` then press Enter → display shows small "16\%" above large "0.04". Type
`1/0` then "=" → display shows "Error"; only "AC" recovers it. `curl -XPOST localhost:8090/v1/calculate
-d '{"operation":"1+1+"}'` → `400`.

---

### P2: Fluent entry, continuity, and visual fidelity

**User Story**: As a user, I want backspace/decimal/sign-toggle keys, the ability to keep building on my
previous result, a shortcuts help modal, and a UI that looks and lays out like the provided references,
so entering and correcting expressions feels as natural as a real calculator.

**Why P2**: Builds directly on P1's working calculation loop; none of it is needed to demo a correct
calculation, but all of it is required by the seed spec/grilling for the finished product.

**Acceptance Criteria**:

1. WHEN the user clicks "±" THEN the system SHALL toggle the sign of the number currently being entered,
   inserting or removing the grammar's single optional leading `-` on that operand (FE-11).
2. WHEN the user clicks the backspace button or presses the Backspace key THEN the system SHALL delete
   the last character of the expression currently being composed (FE-12).
3. WHEN the user clicks "." or presses the `.` key THEN the system SHALL append a decimal point to the
   number currently being entered, subject to the one-decimal-point-per-operand grammar rule (FE-13).
4. WHEN a result is currently displayed and the user presses/clicks an operator THEN the system SHALL
   continue a new expression using the previous result as the starting operand (e.g. result `2`, then
   `+1` → next calculation is `2+1`); WHEN a digit is pressed/clicked instead THEN the system SHALL
   discard the previous result and start a brand-new expression with that digit (FE-10).
5. WHEN the user clicks the "?" button (top-right of the calculator) THEN the system SHALL open a modal
   listing every keyboard shortcut; WHEN the user clicks its close control or presses Escape THEN the
   system SHALL close the modal (FE-14).
6. WHEN the UI is rendered THEN its background/card/accent/status colors SHALL be derived from
   `/Users/flaviostudart/Desktop/ui-reference.png` as a palette source only — near-black/navy
   background, slate cards, blue accent, red/orange/green status hues — without replicating that
   image's job-tracker content or layout (FE-15); its layout SHALL take the macOS Calculator reference
   (`/Users/flaviostudart/Desktop/calculator.png`) as its UI/UX base — echoed-operation-above-result,
   backspace key, decimal key, and sign-toggle key all present (FE-16); the layout SHALL be responsive
   with basic mobile support (FE-17).

**Independent Test**: After a result of `2` is shown, type `+1` then Enter → echoes `2+1`, result `3`.
Click "?" → modal lists shortcuts; press Escape → modal closes. Resize the viewport to a phone width →
calculator remains usable without horizontal scrolling.

*No P3 exists for this feature: every remaining capability in the seed spec and grilling session is a
required deliverable, not an optional nice-to-have — see Non-Functional & Delivery Requirements below for
the rest.*

---

## Edge Cases

- WHEN the expression is empty (`""`) THEN the system SHALL reject with `400` (no `Term` to parse).
- WHEN the expression is a single `Term` with no `BinaryOp` (e.g. `42`, `-5`, `9\`, `50%`) THEN the
  system SHALL accept it and return that `Term`'s own evaluated value (the grammar's `(BinaryOp Term)*`
  is zero-or-more).
- WHEN a `Term`'s literal contains two decimal points (e.g. `1.2.3`) THEN the system SHALL reject with
  `400` (grammar allows at most one `'.' Digit+` per `Term`).
- WHEN a decimal point has no digit before it or no digit after it in the raw request body (e.g. `.5` or
  `5.` sent directly to the API, bypassing the FE's auto-zero) THEN the system SHALL reject with `400`
  (grammar requires `Digit+` on both sides of an optional `.`).
- WHEN two `BinaryOp`s appear consecutively with no operand between them (e.g. `5+*3`) THEN the system
  SHALL reject with `400`.
- WHEN the expression starts with a `BinaryOp` other than `-` (e.g. `+5`, `*5`, `/5`, `^5`), or with a
  `UnaryOp` (`\5` or `%5`) THEN the system SHALL reject with `400` (no valid left operand).
- WHEN the expression ends in a `BinaryOp` with no following `Term` (e.g. `1+1+`) THEN the system SHALL
  reject with `400`.
- WHEN `\` is applied to a `Term` whose own value is negative (e.g. `-4\`, or `3+-4\` where `Term2` is
  `-4\`) THEN the system SHALL reject with `400` as a math error, regardless of what precedes it in the
  expression (postfix ops bind to their own `Term` only, per CALC-02/03).
- WHEN any operand divides by a `Term` that evaluates to zero (e.g. `5/0`, or `5/(2-2)`-style zero
  arising from a chained postfix op like `5/4%%%%...` only if it actually reaches exactly `0`) THEN the
  system SHALL reject with `400` as a math error.
- WHEN a computed value is not finite (`±Infinity`/`NaN`, e.g. an extreme exponentiation like
  `9999999999^9999999999`) THEN the system SHALL reject with `400` as a math error (see Assumptions).
- WHEN the request body is not valid JSON, or is valid JSON missing the `operation` field, or
  `operation` is not a string THEN the system SHALL reject with `400`.
- WHEN the request body's `operation` string contains any character outside `0-9 . + - * / ^ \ %`
  (including whitespace) THEN the system SHALL reject with `400`.

---

## Non-Functional & Delivery Requirements

Cross-cutting deliverables the assessment requires regardless of user-story priority.

| ID | Requirement |
| --- | --- |
| OPS-01 | `README.md` documents setup instructions, API examples, design decisions, a brief project description, the repo link, and links to every `docs/` deliverable below. |
| OPS-02 | `README.md` documents that the project was built via Spec-Driven Development (SDD) with a grilling phase, and that this feature's grilling notes/specs live under `.specs/features/SEZ-1-calculator-mvp/` (`grilling-session.md`, `spec.md`, `design.md`, `tasks.md`, `commits.md`, `validation.md`). |
| OPS-03 | `docs/API.md` describes the API structure and usage. |
| OPS-04 | `docs/codebase/DESIGN.md` documents the UI design rationale, based on the Claude Design system created for this project. |
| OPS-05 | `docs/codebase/COVERAGE.md` summarizes test coverage for both the frontend and backend. |
| OPS-06 | A Postman collection named "Seezle Test Assessment" is committed to the repo. |
| OPS-07 | Dockerfile(s) plus `docker-compose.yml` run frontend (`:8080`) and backend (`:8090`) together. |
| OPS-08 | `docs/PROMPTS.md` records every user prompt given in this session verbatim, as a numbered list with no heading. |
| OPS-09 | The project's root `CLAUDE.md` carries a note instructing future sessions to keep `docs/PROMPTS.md` updated with every user prompt, and to re-read that instruction each session. |
| OPS-10 | Unit and integration tests exist for both layers (no e2e); backend tests follow `applyr`'s conventions adapted for a slice with no persistence layer (see Assumptions); frontend tests use Vitest + React Testing Library. |
| OPS-11 | The frontend UI is built using the `/design` skill; its resulting Claude Design system is named `seezle-technical-assesment` and linked to this project (ongoing maintenance via design-sync is an explicit post-delivery follow-up, not a completion criterion here). |

---

## Requirement Traceability

Each requirement gets a unique ID for tracking across design, tasks, and validation.

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| CALC-01 | P1 | Design | In Design |
| CALC-02 | P1 | Design | In Design |
| CALC-03 | P1 | Design | In Design |
| CALC-04 | P1 | Design | In Design |
| CALC-05 | P1 | Design | In Design |
| CALC-06 | P1 | Design | In Design |
| CALC-07 | P1 | Design | In Design |
| CALC-08 | P1 | Design | In Design |
| CALC-09 | P1 | Design | In Design |
| CALC-10 | P1 | Design | In Design |
| CALC-11 | P1 | Design | In Design |
| API-01 | P1 | Design | In Design |
| API-02 | P1 | Design | In Design |
| API-03 | P1 | Design | In Design |
| API-04 | P1 | Design | In Design |
| API-05 | P1 | Design | In Design |
| API-06 | P1 | Design | In Design |
| API-07 | P1 | Design | In Design |
| FE-01 | P1 | Design | In Design |
| FE-02 | P1 | Design | In Design |
| FE-03 | P1 | Design | In Design |
| FE-04 | P1 | Design | In Design |
| FE-05 | P1 | Design | In Design |
| FE-06 | P1 | Design | In Design |
| FE-07 | P1 | Design | In Design |
| FE-08 | P1 | Design | In Design |
| FE-09 | P1 | Design | In Design |
| FE-10 | P2 | Design | In Design |
| FE-11 | P2 | Design | In Design |
| FE-12 | P2 | Design | In Design |
| FE-13 | P2 | Design | In Design |
| FE-14 | P2 | Design | In Design |
| FE-15 | P2 | Design | In Design |
| FE-16 | P2 | Design | In Design |
| FE-17 | P2 | Design | In Design |
| OPS-01 | Non-functional | Design | In Design |
| OPS-02 | Non-functional | Design | In Design |
| OPS-03 | Non-functional | Design | In Design |
| OPS-04 | Non-functional | Design | In Design |
| OPS-05 | Non-functional | Design | In Design |
| OPS-06 | Non-functional | Design | In Design |
| OPS-07 | Non-functional | Design | In Design |
| OPS-08 | Non-functional | Design | In Design |
| OPS-09 | Non-functional | Design | In Design |
| OPS-10 | Non-functional | Design | In Design |
| OPS-11 | Non-functional | Design | In Design |

**ID format:** `[CATEGORY]-[NUMBER]` — `CALC` (calculation grammar/semantics), `API` (backend REST
contract), `FE` (frontend UI/interaction), `OPS` (non-functional/delivery).

**Status values:** Pending → In Design → In Tasks → Implementing → Verified

**Coverage:** 46 total, 0 mapped to tasks, 46 unmapped ⚠️ (all 46 addressed architecturally in
`design.md`'s Requirement Traceability Crosswalk; Tasks phase maps these to concrete task IDs next)

---

## Success Criteria

How we know the feature is successful:

- [ ] All seven operations (`+ - * / ^ \ %`), including chained postfix and contextual negative signs,
      produce results matching the formal grammar's semantics, verified by backend tests.
- [ ] Every format-invalid expression and every math error (division by zero, negative square root,
      non-finite result) returns `400` with `{"error": "<message>"}`, verified by backend tests.
- [ ] A user can complete an end-to-end calculation (click or type → "=" / Enter → correct rendered
      result) and clear an error state via "AC", verified by frontend tests and manual QA against the
      macOS Calculator and color-palette references.
- [ ] `go build ./... && go vet ./... && go test ./...` (backend) and `npm run typecheck && npm run lint
      && npm run test -- --run` (frontend) all pass with no e2e suite present.
- [ ] `docker compose up` brings up both services reachable at `localhost:8080` (frontend) and
      `localhost:8090` (backend), with Swagger UI listing `POST /v1/calculate`.
- [ ] The Postman collection "Seezle Test Assessment" successfully exercises the API against the
      running compose stack.
- [ ] README.md, `docs/API.md`, `docs/codebase/DESIGN.md`, `docs/codebase/COVERAGE.md`, and
      `docs/PROMPTS.md` are all present, accurate, and cross-linked from the README.
