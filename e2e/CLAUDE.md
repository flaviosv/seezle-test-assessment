# E2E (`e2e/`)

## Purpose

A Playwright end-to-end suite that drives a real Chromium browser against the real `frontend/` dev
server and the real `backend/` — no mocks anywhere in the stack. Added in SEZ-4 to close a
deliberate gap: unit/component tests mock the API client, and backend tests never touch a browser,
so neither layer can catch real cross-origin behavior, real keyboard-event timing, or the things
[`docs/codebase/COVERAGE.md`](../docs/codebase/COVERAGE.md) previously listed as manually-verified
only. See `.specs/STATE.md` AD-005 for the decision record (including why this is a sibling
package rather than nested inside `frontend/`).

Deliberately scoped narrow: it does not re-assert grammar edge cases `backend/internal/operations/parser_test.go`
already covers exhaustively (49 cases) — it targets only what a real browser round trip adds.

## Architecture

```
playwright.config.ts     boots backend + frontend via a webServer array, chromium-only project
tests/
  calculator.ts             shared helpers — not matched as a test file (no .spec/.test suffix)
  calculation.spec.ts       P1 MVP flow: click + keyboard entry, chained postfix, styling
  operators.spec.ts         one round trip per README's operator table, plus two regression cases
  error-handling.spec.ts    error-lock and its two recovery paths (AC, Escape)
  continuity-and-editing.spec.ts   P2: result continuation, backspace, decimal, sign toggle
  help-modal.spec.ts        open/close via button, close control, Escape, backdrop click
  responsive.spec.ts        FE-17: 320/375/390px viewports, no horizontal scroll
```

`playwright.config.ts`'s `webServer` array runs `go run ./main.go` (`cwd: ../backend`) and
`npm run dev -- --port 8080 --strictPort` (`cwd: ../frontend`) in parallel, with
`reuseExistingServer: !process.env.CI` — so a `docker compose up` stack already running on the
same ports is reused instead of double-booting.

## Key Components

| Component | Role |
| --- | --- |
| `gotoApp(page)` | Navigates and waits for the "AC" button before returning — without this, `page.keyboard.*` calls immediately after `page.goto()` can race React's `keydown`-listener `useEffect` on a cold dev server and silently drop keystrokes (discovered and fixed while building this suite; see the note in `tests/calculator.ts`) |
| `pressButtons(page, ...names)` | Clicks a sequence of calculator buttons by accessible name |
| `resultText(page)` / `echoedOperationText(page)` | Locate the large-result / small-echoed-operation `<span>`s inside `Display` |
| `expectResult(page, expected)` | Asserts the result line's text |

## Internal Design

Button interactions use `page.getByRole('button', { name, exact: true })` — the accessible names
match `CalculatorApp.test.tsx`'s own convention (`'2'`, `'+'`, `'AC'`, `'Backspace'`,
`'Toggle sign'`, `'Square root'`, `'Keyboard shortcuts help'`), so a test reads the same way in
both layers.

Asserting a "locked" digit/operator button during an Error state uses `toBeDisabled()`, not a
`.click()` that expects no effect — Playwright's `.click()` auto-waits for the element to become
actionable (enabled) and will time out against a `disabled` button, since that *is* the locked
state (`ButtonGrid.tsx` sets `disabled` directly). The keyboard-input side of the same lock (the
reducer's `error-shown` no-op, unrelated to the `disabled` attribute) is checked separately via
`page.keyboard.press(...)`.

## Dependencies (External)

`@playwright/test` 1.62.1 (pinned exact version) · `typescript` 5.9.3 + `@types/node` 26.4.1
(type-checking only, via `npm run typecheck` — not needed to run tests, Playwright transpiles TS
itself).

## Integration Points

- Boots and drives `../backend/` (`go run ./main.go`) and `../frontend/` (`npm run dev`) directly —
  the only package in this monorepo that runs both other packages together outside of
  `docker compose`.
- Exercises the exact contract documented in `backend/CLAUDE.md`'s Public API section and the
  exact UI documented in `frontend/CLAUDE.md`'s Architecture section, but never imports code from
  either — everything is driven through the rendered page.

## Constraints

- Chromium only (no Firefox/WebKit project configured) — sufficient for this suite's purpose;
  cross-browser fidelity is not a stated requirement anywhere in spec.md.
- Requires Chromium to be installed (`npx playwright install chromium`) and Go/Node toolchains
  available locally — this suite is not run inside `docker compose`.

## Conventions

- One `.spec.ts` file per user-facing concern, named after that concern (not after the component
  under test) — matches how the acceptance criteria in spec.md are grouped (P1/P2/error/responsive)
  rather than how the frontend's own component tree is organized.
- Every test starts with `gotoApp(page)`, never a bare `page.goto('/')`.
- Test names cite the spec/requirement ID they cover (`FE-09`, `CALC-08`, …), matching the
  convention already established in `frontend/src/components/CalculatorApp.test.tsx` and
  `backend/internal/operations/parser_test.go`.

## Testing Strategy

35 cases across the 6 spec files above. Run with `cd e2e && npm install && npm test` (first time:
also `npx playwright install chromium`); `npm run test:ui` for the interactive runner. Verified
against both a cold-started `go run`/`npm run dev` pair (proves the `webServer` config itself
works) and an already-running `docker compose` stack. Full case-by-case breakdown:
[`docs/codebase/COVERAGE.md`](../docs/codebase/COVERAGE.md)'s "End-to-End (Playwright)" section.
