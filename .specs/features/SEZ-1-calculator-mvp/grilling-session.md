# Grilling Session: SEZ-1 — Calculator MVP

## Seed

User provided a complete, detailed single-shot spec covering frontend (React+TS), backend (Go+Gin), testing, docs, and deployment requirements before any grilling started (see `full_spec` passed into `/build-feature`). Grilling targeted only genuine gaps/ambiguities left open by that spec.

Fixed constraints from the seed (not re-litigated): React+TS frontend; Go+Gin backend; single `POST /v1/calculate` endpoint; no DB/cache/auth; no e2e tests; slice architecture modeled after `~/Projects/Personal/dinherim` and `~/Projects/Personal/applyr`; AC/`=` buttons red; color scheme from `/Users/flaviostudart/Desktop/ui-reference.png`; macOS Calculator (`/Users/flaviostudart/Desktop/calculator.png`, note: actual filename has no typo, unlike the user's mention of "calcualtor.png") as layout reference; Swagger endpoint; Postman collection "Seezle Test Assessment"; `docs/API.md`; `docs/codebase/DESIGN.md`; `docs/codebase/COVERAGE.md`; Dockerfile + docker-compose; public GitHub repo (bootstrapped this session: `flaviosv/seezle-test-assessment`); `docs/PROMPTS.md` numbered list of user prompts; `human_review=no`; `/design` + Claude Design system "seezle-technical-assesment" + design-sync expected as a post-delivery follow-up.

## Facts gathered directly (no user input needed)

- Viewed `calculator.png`: confirms macOS Calculator layout — "1+1" echoed small above "2" result large; `⌫` backspace key; `.` decimal key; `±` sign-toggle key; `%` grouped with `AC`/`⌫` (not with the binary operator column ÷×−+).
- Viewed `ui-reference.png`: **not** a calculator screenshot — a dark-theme job-application tracker UI (near-black/navy background, blue-outlined selected card, slate cards, green/orange/red "days ago" status badges). Flagged to user as Q1 rather than silently extracting a palette from unrelated content.
- Checked local Docker/k3d/OrbStack: ports 80, 443, 5432, 5001, 6443 already bound by the local k3d cluster / OrbStack. Chose 8080 (frontend) / 8090 (backend) for docker-compose, both free.
- `architecture-evaluate` quick gate (Step 4, dispatched to Haiku): decision = `none` — brand-new repo, no code yet, no `docs/codebase/` anywhere; nothing to sync now, Incremental sync happens after Execute (Step 14).

## Round 1 — Questions and Answers

1. **`ui-reference.png` mismatch** — recommended treating it literally as a color-palette source (dark navy/near-black background, slate cards, blue accent, red/orange/green status colors) adapted into the calculator with red AC/=.
   → **User: confirmed** — "the ui-reference.png file is a reference for the color schema you can use, as you identified."

2. **Percentage semantics** — recommended binary `a % b = a*(b/100)`.
   → **User: "It's the percentage, as a real calculator."** Resolved as: **unary postfix**, `x% = x/100`, applied to the immediately preceding number — matching a real (non-"smart") calculator's simple percent key, and consistent with `calculator.png`'s layout (`%` grouped with AC/⌫, not the binary operator column). This overrides my original recommendation.

3. **Square root grammar** — recommended postfix, unary, applies to the immediately preceding number only (not the running total); e.g. `4+16\` = `4 + sqrt(16)` = `20`.
   → **User: "What operator do you suggest for sqrt?"** — read as delegating the mechanics to me. **Resolved: kept `\` as the symbol** (already fixed in the original spec), adopted the postfix/unary-on-preceding-number semantics as recommended, made symmetric with the resolved percentage semantics (both are postfix unary ops that can chain after a number, e.g. `16\%` = `sqrt(16)%` = `4%` = `0.04`).

4. **Negative numbers** — recommended out of scope for MVP.
   → **User: "Yes, there is negative numbers, add to the scope."** Overridden — negative numbers are in scope. Resolved grammar (my design decision, not re-asked): `-` is parsed **contextually** — a sign (starts a negative number) when it is the first character of the whole expression or immediately follows another operator; subtraction otherwise. Exactly one optional sign character is allowed per operand — a second consecutive `-` in operand-start position is a 400 format error. Examples: `5--3` = `5 - (-3)` = `8`; `-5+3` = `-2`; `5---3` → 400 (format error, extra sign char). UI gets a `±` button (toggles the sign of the number currently being entered), consistent with `calculator.png`'s `±` key. No new typed keyboard shortcut is introduced — `-` is reused per the above rule.

5. **Rounding/precision** — recommended round to 10 significant digits, trim trailing zeros, no scientific notation.
   → **User: "Yes, good enough."** Confirmed as specified.

6. **Error responses for math errors (div-by-zero, sqrt-of-negative)** — recommended 400 Bad Request with `{"error": "<message>"}` body (same status family as format errors), FE shows `Error` in the result area, requires AC to clear.
   → **User: "Yes."** Confirmed as specified.

7. **Backspace key** — recommended adding a backspace button + Backspace key binding (deletes last character), matching `calculator.png`.
   → **User: "Yes, you can add it."** Confirmed as specified.

8. **Post-result continuation** (operator after a result continues the chain using that result; digit after a result starts fresh) — not separately re-confirmed in the numbered reply, but this is verbatim the user's own worked example from the original spec ("1+1, result 2, then +1 → 2+1"), so it is already settled by the seed spec, not an open branch.

## Additional scope item (raised outside Q&A)

- User: "One detail to add to the scope of this task, add to README.md that I use SDD with grilling notes and specs under each spec folder." → README.md must document the SDD (spec-driven development) workflow used to build this feature: grilling notes and specs live under `.specs/features/<task-id>-<slug>/` (this folder: `grilling-session.md`, `spec.md`, `design.md`/tasks skip note, `tasks.md`, plus Execute's `commits.md`/`validation.md`), and reference this folder from the README as evidence of the process.

## Frontier status

Empty. No further branches require user input — remaining work (exact validation grammar formalization, component structure, test matrix, Docker/Compose details) is engineering execution of the above, carried out autonomously per `human_review=no`.
