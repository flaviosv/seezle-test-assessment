# Test Coverage

Real numbers from running each layer's coverage tooling — never fabricated. Reproduce with:

```bash
cd backend && go test ./... -cover
cd frontend && npx vitest run --coverage
cd e2e && npm test
```

## Backend (Go, `go test ./... -cover`)

| Package | Test file | Type | Cases | Statement coverage |
| ------- | --------- | ---- | ----- | ------------------- |
| `internal/operations` (parser) | `parser_test.go` | unit | 49 | — |
| `internal/operations` (usecase) | `usecase_test.go` | unit | 21 | — |
| `internal/operations` (handler) | `handler_test.go` | integration (`httptest`) | 13 | — |
| `internal/operations` (package total) | — | — | **83** | **98.3%** |
| `internal/routes` | `routes_test.go` | integration (`httptest`) | 10 | **100.0%** |
| **Total** | | | **93** | |

SEZ-4 added two cases that closed real gaps found by re-reviewing coverage against the actual
uncovered lines (not just the aggregate percentage): `usecase_test.go` now exercises an
exact-zero result (`roundToSignificantDigits`'s `v == 0` special case was previously never hit),
and `parser_test.go` now exercises a `Term` literal long enough to overflow `float64` during
`strconv.ParseFloat` itself (distinct from the already-tested `9999999999^9999999999` case, which
overflows via computation, not parsing).

`main`, `internal/middleware`, `internal/shared/config`, `internal/shared/logger`, and the generated
`docs` package report 0% statement coverage — by design (Test Coverage Matrix: "Build gate only — no
domain logic to test independently"). These are exercised indirectly by the integration tests above
(a broken middleware chain, config default, or route registration would fail `handler_test.go` /
`routes_test.go`), and by the manual `docker compose up` verification recorded in
`.specs/features/SEZ-1-calculator-mvp/tasks.md` (T23).

The `internal/operations` package's remaining 1.7% (two statements) is defensive code that is
genuinely unreachable given the parser's own call-site invariants, not an untested behavior:
`applyBinaryOp`'s `default` case (every caller already filters to a valid `BinaryOp` via
`isBinaryOp` before calling it) and `parseTerm`'s postfix-loop non-finite guard (`\` and `%` can
only shrink a finite value — `ParseFloat`'s own overflow check, now covered per above, is what
actually rejects a `Term` that would otherwise be non-finite).

## Frontend (Vitest + `@testing-library/react`, `--coverage`)

| File | Test file | Type | Cases | Statement % | Branch % | Function % |
| ---- | --------- | ---- | ----- | ------------ | -------- | ----------- |
| `hooks/useCalculator.ts` | `useCalculator.test.ts` | unit | 51 | 98.98 | 98.03 | 100 |
| `api/calculate.ts` | `calculate.test.ts` | unit | 11 | 100 | 87.5 | 100 |
| `components/CalculatorApp.tsx` (+ Display, ButtonGrid, HelpButton) | `CalculatorApp.test.tsx` | component | 15 | — | — | — |
| `components/HelpModal.tsx` | `HelpModal.test.tsx` | component | 8 | 100 | 83.33 | 100 |
| **Total** | | | **85** | **90.85 (all files)** | **96.29 (all files)** | **71.15 (all files)** |

Per-file breakdown for the components exercised only through `CalculatorApp.test.tsx`:

| File | Statement % | Note |
| ---- | ------------ | ---- |
| `components/ButtonGrid.tsx` | 61.53 | Every digit/operator dispatches through the same handler shape (`onInputChar`); the test suite spot-checks representative buttons (`2`, `+`, `AC`, `=`, backspace, `.`, `±`) per the Test Coverage Matrix rather than clicking all 20 buttons individually — the untouched click handlers are one-line closures identical in shape to the covered ones |
| `App.tsx` | 0 | Trivial composition root (mounts `CalculatorApp` + `HelpModal`, owns one `useState`) — not required by the Test Coverage Matrix; its behavior is exercised end-to-end by the `docker compose` manual verification in T23 and by the E2E suite below |

## End-to-End (Playwright, `e2e/`)

Added in SEZ-4. Runs a real Chromium browser against the actual frontend dev server and the actual
Go backend (no mocks anywhere in the stack) via Playwright's `webServer` — see
`e2e/playwright.config.ts`. Deliberately does not re-assert grammar edge cases already exhaustively
covered by `parser_test.go`; it targets what only a real browser round trip can verify, plus the two
things this project's coverage previously only checked by hand.

| Spec file | Cases | What it covers |
| --- | --- | --- |
| `calculation.spec.ts` | 5 | P1 MVP flow: click and keyboard entry, chained postfix, danger-button styling, initial display |
| `operators.spec.ts` | 11 | One real round trip per README operator, plus the exact `10%9` and `8^6*3%9+0` expressions that previously reached production broken (docs/PROMPTS.md) |
| `error-handling.spec.ts` | 5 | Error-lock and its two recovery paths; Escape-clears-Error is a direct regression test for the AC/Escape bug in docs/PROMPTS.md |
| `continuity-and-editing.spec.ts` | 5 | P2 fluent entry: result continuation vs. fresh start, backspace, decimal auto-zero, sign toggle, AC |
| `help-modal.spec.ts` | 5 | Open/close via button, close control, Escape, backdrop click; in-dialog click does not close |
| `responsive.spec.ts` | 4 | Automates the FE-17 check below — 320/375/390px viewports, `document.documentElement.scrollWidth` vs. `clientWidth` |
| **Total** | **35** | |

Run with `cd e2e && npm install && npm test` (or `npm run test:ui` for the interactive runner).

## Gap Analysis (by design, not oversight)

- **Visual fidelity (FE-15/16: palette, macOS-reference layout)** — verified manually against the
  two reference images, not by automated visual-regression assertions; this is out of scope per
  design.md's Test Strategy. `CalculatorApp.test.tsx` and `calculation.spec.ts` both assert the
  danger/accent color tokens structurally, but neither is a pixel-level comparison.
- **FE-17 (responsive, no horizontal scroll at phone width)** is now automated by
  `e2e/tests/responsive.spec.ts` (see above) — previously verified only by hand, as recorded here
  before SEZ-4. `CalculatorApp.test.tsx` still separately asserts the presence of the
  `w-full`/`max-w-sm` Tailwind classes as a fast structural proxy.
- **`HelpModal`'s backdrop-click-to-close and dialog-click-does-not-close paths** are covered here
  (`HelpModal.test.tsx`), going beyond the Test Coverage Matrix's stated minimum ("opens on click,
  closes on close-control click and on Escape") since the component already implements them; the
  same two paths are re-verified in a real browser by `e2e/tests/help-modal.spec.ts`.
- **`ButtonGrid`'s per-button click handlers** are not each individually unit-tested — see the note
  above; this matches the Test Coverage Matrix's explicit instruction that `Display`/`ButtonGrid`/
  `HelpButton` are "covered by CalculatorApp integration... exercised through the parent component's
  interactions," not tested in isolation.
