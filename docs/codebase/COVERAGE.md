# Test Coverage

Real numbers from running each layer's coverage tooling — never fabricated. Reproduce with:

```bash
cd backend && go test ./... -cover
cd frontend && npx vitest run --coverage
```

## Backend (Go, `go test ./... -cover`)

| Package | Test file | Type | Cases | Statement coverage |
| ------- | --------- | ---- | ----- | ------------------- |
| `internal/operations` (parser) | `parser_test.go` | unit | 43 | — |
| `internal/operations` (usecase) | `usecase_test.go` | unit | 22 | — |
| `internal/operations` (handler) | `handler_test.go` | integration (`httptest`) | 14 | — |
| `internal/operations` (package total) | — | — | **79** | **96.3%** |
| `internal/routes` | `routes_test.go` | integration (`httptest`) | 10 | **100.0%** |
| **Total** | | | **89** | |

`main`, `internal/middleware`, `internal/shared/config`, `internal/shared/logger`, and the generated
`docs` package report 0% statement coverage — by design (Test Coverage Matrix: "Build gate only — no
domain logic to test independently"). These are exercised indirectly by the integration tests above
(a broken middleware chain, config default, or route registration would fail `handler_test.go` /
`routes_test.go`), and by the manual `docker compose up` verification recorded in
`.specs/features/SEZ-1-calculator-mvp/tasks.md` (T23).

## Frontend (Vitest + `@testing-library/react`, `--coverage`)

| File | Test file | Type | Cases | Statement % | Branch % | Function % |
| ---- | --------- | ---- | ----- | ------------ | -------- | ----------- |
| `hooks/useCalculator.ts` | `useCalculator.test.ts` | unit | 49 | 98.93 | 97.82 | 100 |
| `api/calculate.ts` | `calculate.test.ts` | unit | 11 | 100 | 87.5 | 100 |
| `components/CalculatorApp.tsx` (+ Display, ButtonGrid, HelpButton) | `CalculatorApp.test.tsx` | component | 15 | — | — | — |
| `components/HelpModal.tsx` | `HelpModal.test.tsx` | component | 8 | 100 | 83.33 | 100 |
| **Total** | | | **83** | **90.56 (all files)** | **96 (all files)** | **72.54 (all files)** |

Per-file breakdown for the components exercised only through `CalculatorApp.test.tsx`:

| File | Statement % | Note |
| ---- | ------------ | ---- |
| `components/ButtonGrid.tsx` | 61.53 | Every digit/operator dispatches through the same handler shape (`onInputChar`); the test suite spot-checks representative buttons (`2`, `+`, `AC`, `=`, backspace, `.`, `±`) per the Test Coverage Matrix rather than clicking all 20 buttons individually — the untouched click handlers are one-line closures identical in shape to the covered ones |
| `App.tsx` | 0 | Trivial composition root (mounts `CalculatorApp` + `HelpModal`, owns one `useState`) — not required by the Test Coverage Matrix; its behavior is exercised end-to-end by the `docker compose` manual verification in T23 |

## Gap Analysis (by design, not oversight)

- **No end-to-end test suite** — explicitly excluded by spec.md and the Test Coverage Matrix (OPS-10).
- **Visual fidelity (FE-15/16/17: palette, macOS-reference layout, responsive breakpoints)** —
  verified manually against the two reference images, not by automated visual-regression assertions;
  this is out of scope per design.md's Test Strategy.
- **`HelpModal`'s backdrop-click-to-close and dialog-click-does-not-close paths** are covered here
  (`HelpModal.test.tsx`), going beyond the Test Coverage Matrix's stated minimum ("opens on click,
  closes on close-control click and on Escape") since the component already implements them.
- **`ButtonGrid`'s per-button click handlers** are not each individually unit-tested — see the note
  above; this matches the Test Coverage Matrix's explicit instruction that `Display`/`ButtonGrid`/
  `HelpButton` are "covered by CalculatorApp integration... exercised through the parent component's
  interactions," not tested in isolation.
