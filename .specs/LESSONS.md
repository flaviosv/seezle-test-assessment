# LESSONS — auto-maintained by scripts/lessons.py

> Machine-owned. Do NOT hand-edit. Changes are overwritten on the next `lessons.py` write.
> Canonical state lives in `.specs/lessons.json`. Edit lessons only via the script.
> promote_threshold=2 distinct features · window_days=45 · quarantine_threshold=2

## Confirmed (load these at Specify/Design)

Corroborated across multiple features. Safe to apply as guidance.

_none_

## Candidates (under observation — do NOT load as guidance yet)

Seen once or not yet corroborated. Tracked, not trusted.

### L-001 — When a task's Done-when requires creating a specific documentation file, verify the file exists on disk before marking the task complete — a commit message deferring the content is not a substitute for a follow-up commit that actually creates it.
- signal: `ac_gap` · recurrence: 1 feature(s) · scope: `docs` · harmful: 0
- features: SEZ-1-calculator-mvp
- evidence: OPS-08: docs/PROMPTS.md (docs)
- last seen: 2026-09-02T19:49:47Z

### L-002 — When spec.md names a specific deliverable file, confirm during Tasks planning that some task explicitly owns creating it — a file named only in a README-content Done-when bullet, with no task assigned to generate it, silently falls through Execute.
- signal: `ac_gap` · recurrence: 1 feature(s) · scope: `tasks-planning` · harmful: 0
- features: SEZ-1-calculator-mvp
- evidence: OPS-02: commits.md (tasks-planning)
- last seen: 2026-09-02T19:49:52Z

### L-003 — Flag visual-fidelity acceptance criteria (color palette or layout matching a reference image) as requiring interactive UAT during spec writing, since no code-level assertion can verify a match to an image.
- signal: `spec_precision_gap` · recurrence: 1 feature(s) · scope: `frontend` · harmful: 0
- features: SEZ-1-calculator-mvp
- evidence: FE-15/FE-16: palette and layout match to reference images (frontend)
- last seen: 2026-09-02T19:49:57Z

### L-004 — When a spec's Independent Test names a specific verification scenario, write a test for that exact scenario rather than a weaker proxy assertion (e.g. checking static CSS class names) and then marking the criterion done.
- signal: `ac_gap` · recurrence: 1 feature(s) · scope: `frontend` · harmful: 0
- features: SEZ-1-calculator-mvp
- evidence: FE-17: viewport-resize/no-horizontal-scroll Independent Test scenario (frontend)
- last seen: 2026-09-02T19:50:02Z

### L-005 — When a left-to-right scanning helper tracks an 'expect start' boundary, add an explicit test for the case where the scanned token is the very last character (e.g. a trailing operator) — that zero-length-remainder boundary is where off-by-one bugs hide.
- signal: `spec_deviation` · recurrence: 1 feature(s) · scope: `frontend` · harmful: 0
- features: SEZ-1-calculator-mvp
- evidence: frontend/src/hooks/useCalculator.ts:44-52 (currentOperandStart) (frontend)
- last seen: 2026-09-02T19:50:07Z

## Quarantined (failed when applied — ignore)

A confirmed lesson that recurred alongside failure. Kept for the maintainer to review.

_none_
