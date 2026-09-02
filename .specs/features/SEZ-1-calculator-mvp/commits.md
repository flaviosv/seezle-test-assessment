# SEZ-1 Calculator MVP — Commit Log

Generated at the end of Execute. One row per commit on `feature/SEZ-1_calculator-mvp`, in order,
mapped to the `tasks.md` task(s) it closes. Range: `05f0930..HEAD`.

| Commit | Date | Task(s) | Subject |
| ------ | ---- | ------- | ------- |
| `01fae34` | 2026-09-02 | Specify/Design/Tasks | docs(spec): add SEZ-1 calculator MVP spec, design, and tasks |
| `b71bb71` | 2026-09-02 | T1 | chore(backend): scaffold go module, config, and logger packages |
| `0eaff5c` | 2026-09-02 | T2 | feat(middleware): add request context, security headers, cors, timeout |
| `a0c336b` | 2026-09-02 | T3 | feat(routes): add response envelope, routes, and swagger/redoc bootstrap |
| `c96bd0c` | 2026-09-02 | T4 | feat(operations): add calculate handler with swagger annotations |
| `db0dab4` | 2026-09-02 | T5 | feat(operations): add usecase rounding, formatting, and sentinel errors |
| `a227a66` | 2026-09-02 | T6 | feat(operations): add grammar parser and evaluator |
| `2c52cb4` | 2026-09-02 | T7 | feat(server): wire main.go with middleware stack and graceful shutdown |
| `b3a8444` | 2026-09-02 | T8 | test(operations): add parser unit tests covering grammar and edge cases |
| `6be9866` | 2026-09-02 | T9 | test(operations): add usecase unit tests for rounding and formatting |
| `ec7ca70` | 2026-09-02 | T10 | test(operations): add handler integration tests via httptest |
| `0f8e017` | 2026-09-02 | T11 | test(routes): add Swagger/ReDoc and route registration integration tests |
| `353dcc5` | 2026-09-02 | T12 | chore(frontend): scaffold vite + react + typescript + tailwind v4 project |
| `907035e` | 2026-09-02 | T13 | feat(hooks): add useCalculator state machine |
| `30853bd` | 2026-09-02 | T14 | feat(api): add calculate.ts typed fetch client |
| `f8e6c98` | 2026-09-02 | T15 | feat(components): add App and CalculatorApp layout shell |
| `6e87fba` | 2026-09-02 | T16 | feat(components): add Display component |
| `ae47918` | 2026-09-02 | T17 | feat(components): add ButtonGrid and HelpButton components |
| `a3cafa9` | 2026-09-02 | T18 | feat(components): add HelpModal component and design tokens |
| `bd6b77f` | 2026-09-02 | T19 | test(hooks): add useCalculator state machine unit tests |
| `4d95e12` | 2026-09-02 | T20 | test(api): add calculate.ts client unit tests |
| `4b47d60` | 2026-09-02 | T21 | test(components): add CalculatorApp component tests |
| `73e71d9` | 2026-09-02 | T22 | test(components): add HelpModal component tests |
| `cb63168` | 2026-09-02 | T23 | build(deploy): add Dockerfiles and docker-compose.yml |
| `8989a03` | 2026-09-02 | T24 | docs: add README.md and docs/API.md |
| `1646aaf` | 2026-09-02 | T25 | docs(codebase): add DESIGN.md, COVERAGE.md, and root CLAUDE.md note |
| `0b5dad7` | 2026-09-02 | T26 | test(api): add Postman collection for POST /v1/calculate |
| `5af1e26` | 2026-09-02 | T26 | docs(codebase): link the /design mockup canvas in DESIGN.md |

27 commits, one task-scoped change per commit, no batching. Fix-round commits made after the
Verifier's first pass are appended below as they land.
