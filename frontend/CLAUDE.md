# Frontend (`frontend/`)

## Purpose

A single-screen React SPA — a calculator UI that accumulates an expression string from clicks or
keystrokes and sends it to the backend's `POST /v1/calculate` for evaluation. No routing, no
client-side calculation logic, no history/memory of past results — one screen, one endpoint
(`.specs/STATE.md` AD-003).

Sibling package in a two-service monorepo (`backend/`, `e2e/`). Cross-cutting docs live at the repo
root: [`docs/codebase/DESIGN.md`](../docs/codebase/DESIGN.md) (UI design rationale) and
[`docs/codebase/COVERAGE.md`](../docs/codebase/COVERAGE.md) (full coverage summary).

## Architecture

Vite + React 19 + TypeScript + Tailwind CSS v4 (CSS custom-property tokens), tested with Vitest +
`@testing-library/react`. No router, data-fetching library, form library, or global state manager —
plain `fetch` and a single `useReducer` (AD-003): none of that machinery is justified by a
single-screen, single-endpoint app.

```
src/
  main.tsx                   entry: mounts <App/> in StrictMode, imports the two style sheets
  App.tsx                    composition root: <CalculatorApp/> + <HelpModal/>, owns isHelpOpen
  hooks/useCalculator.ts     the state machine — all calculator logic lives here
  api/calculate.ts           the one fetch wrapper (POST /v1/calculate)
  components/
    CalculatorApp.tsx          wires useCalculator to Display + ButtonGrid + HelpButton
    Display.tsx                 renders echoedOperation (small) + displayValue (large)
    ButtonGrid.tsx               the 4x6 button grid, dispatches through useCalculator's callbacks
    HelpButton.tsx               "?" button, opens the help modal
    HelpModal.tsx                keyboard-shortcuts modal (Escape/backdrop/close-control close it)
  styles/
    tokens.css                   design tokens (--color-bg, --color-surface, --color-accent, --color-danger, ...)
    index.css                    Tailwind entry
  test/setup.ts               Vitest + RTL global setup
```

### State Machine (`useCalculator`)

A single `useReducer` with three statuses: `composing` → `result-shown` → `error-shown`.

- `INPUT_CHAR`/`INPUT_DECIMAL`: appended to `expression` while `composing`; a no-op while
  `error-shown` (this is the FE-09 error-lock). From `result-shown`, a digit starts a fresh
  expression, anything else continues from the previous result (FE-10).
- `TOGGLE_SIGN`/`BACKSPACE`: only act while `composing`.
- `submit()`: calls `api/calculate.ts`'s `calculate()`; success → `SUBMIT_SUCCESS` (→
  `result-shown`), failure → `SUBMIT_ERROR` (→ `error-shown`, displays `"Error"`).
- `CLEAR`: resets to `initialState` from any status — wired to both the "AC" button and the
  `Escape` key (the `isHelpOpen` param suppresses this while the help modal owns `Escape` instead).

`currentOperandStart()` and its `toggleSignInExpression`/`appendDecimal` callers mirror the
backend parser's own operand-boundary rule (a `-` only ever starts an operand at position 0 or
right after a `BinaryOp`) so sign-toggle and decimal auto-zero stay grammar-consistent with what
the backend will actually parse — see `backend/`'s `parseTerm` for the server-side analog.

## Public API (Component Boundary)

- `CalculatorApp({ onHelpClick, isHelpOpen? })` — the calculator screen.
- `HelpModal({ isOpen, onClose })` — the shortcuts modal, portal-free (renders inline, backdrop
  click and `Escape` both call `onClose`; a click inside the dialog does not).
- `calculate(operation: string): Promise<CalculateResponse>` (`api/calculate.ts`) — throws
  `CalculateError` (carries `statusCode` + optional `serverError`) on any non-2xx response or
  network failure.

## Dependencies (External)

`react`/`react-dom` 19.2 · `vite` 8 + `@vitejs/plugin-react` (build/dev server) · `tailwindcss` 4 +
`@tailwindcss/vite` (styling) · `vitest` 4 + `@vitest/coverage-v8` + `@testing-library/react` +
`@testing-library/jest-dom` + `jsdom` (testing) · `oxlint` (lint) · `typescript` 5.9. No router, no
data-fetching library, no form library, no state manager (AD-003).

## Integration Points

- Calls `../backend/` at `POST {VITE_API_BASE_URL}/v1/calculate` (default
  `http://localhost:8090`, overridable via the `VITE_API_BASE_URL` build arg — see `Dockerfile`).
  Cross-origin in dev (frontend `:8080` → backend `:8090`), which is why the backend's CORS
  middleware exists.
- Driven end-to-end (real browser, real backend, no mocks) by `../e2e/` as of SEZ-4.
- Built by `Dockerfile` into a static bundle served by `nginx` (`nginx.conf`): gzip, 1-year
  immutable caching on `.js`/`.css`, SPA fallback (`try_files ... /index.html`), and the same
  `X-Content-Type-Options`/`X-Frame-Options`/CSP hardening headers the backend sets on its own
  responses. Run as the `frontend` service on `:8080` by the repo-root `docker-compose.yml`.

## Error Handling

`api/calculate.ts` is the single seam between network failures and the UI: a `fetch` rejection
(network error) and a non-`ok` HTTP response are both normalized into a `CalculateError`. The
hook's `submit()` never inspects the error further — any failure collapses to the same
`error-shown` / `"Error"` display state (matches FE-09's "clear Error state, no error detail
shown" requirement).

## Constraints

- Client-side input validation is a character whitelist only (digits, the seven operators, `.`,
  and the control keys); full grammar validation is server-side only, surfaced as `"Error"` on any
  `400` (AD-003/spec.md's Assumptions — deliberately avoids building the grammar engine twice).
  See `backend/CLAUDE.md`'s Internal Design section for the grammar semantics this UI never itself
  validates.
- Responsive down to phone width with no horizontal scroll (FE-17) — see `../e2e/tests/responsive.spec.ts`
  for the automated check.
- No client-side history/memory of past calculations — only the current expression and the
  immediately-preceding result are ever live.

## Conventions

- Colocated `*.test.tsx`/`*.test.ts` files next to the code they test.
- Components split by concern (`Display`/`ButtonGrid`/`HelpButton` are purely presentational,
  tested only through `CalculatorApp.test.tsx`, not in isolation — see Testing Strategy below).
- Design tokens as CSS custom properties in `styles/tokens.css`, referenced via Tailwind's
  `bg-[var(--color-...)]` arbitrary-value syntax rather than a Tailwind theme extension.

## Testing Strategy

- **Unit**: `hooks/useCalculator.test.ts` (51 cases — every reducer transition) +
  `api/calculate.test.ts` (11 cases — request shape, success/error parsing, network failure).
- **Component**: `components/CalculatorApp.test.tsx` (15 cases — click/keyboard accumulation,
  submit, result/error rendering, styling, responsive card classes) +
  `components/HelpModal.test.tsx` (8 cases).
- Coverage: 90.85% statements / 96.29% branches / 71.15% functions (all files) — `App.tsx` (0%,
  trivial composition root) and parts of `ButtonGrid.tsx` (61.53%, one-line closures identical in
  shape to the covered ones) are documented, intentional gaps. Full detail:
  [`docs/codebase/COVERAGE.md`](../docs/codebase/COVERAGE.md).
- As of SEZ-4, `../e2e/` automates what this layer previously only checked by hand — most notably
  FE-17's responsive no-horizontal-scroll check (`responsive.spec.ts`) — and adds direct regression
  coverage for two real production bugs (AC/Escape error recovery; `%`-as-modulo parsing) in
  `error-handling.spec.ts` and `operators.spec.ts`.
