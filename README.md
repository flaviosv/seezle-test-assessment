# Seezle Calculator MVP

A stateless two-service calculator: a React SPA (`:8080`) that sends a raw arithmetic expression to a
Go + Gin JSON API (`:8090`), which owns the entire grammar — parsing, evaluation, and rounding — and
returns the result. There is no database, cache, or auth anywhere in the system; every request is an
independent, side-effect-free computation.

Expressions evaluate strictly left-to-right — no operator precedence, no parentheses. There are two
kinds of operator:

- **Binary** (`+ - * / ^`): sit between two numbers, e.g. `2+2`.
- **Postfix unary** (`\ %`): come *after* the number they apply to, and bind only to that number —
  never to a running total from an earlier binary operator. They chain in the order written, e.g.
  `16\%` = √16 (`4`), then `%` (`0.04`).

| Operator | Symbol | Usage | Example | Result |
| --- | --- | --- | --- | --- |
| Addition | `+` | `a+b` | `2+2` | `4` |
| Division | `/` | `a/b` (`b ≠ 0`) | `6/3` | `2` |
| Exponentiation | `^` | `a^b` | `2^3` | `8` |
| Multiplication | `*` | `a*b` | `2*3` | `6` |
| Percent | `%` | `a%` — postfix, divides `a` by 100 | `50%` | `0.5` |
| Square Root | `\` | `a\` — postfix, **after** the digits, never before | `9\` | `3` |
| Subtraction | `-` | `a-b`; also a sign prefix on a negative number (start of expression, or right after another operator) | `5-3` / `-5+3` | `2` / `-2` |

Two common mistakes:

- `\9` is invalid — square root is postfix only, so it's `9\`, not `\9`.
- `%` is percent, not modulo — there is no modulo operator. `10%9` is invalid: it parses as `10%`
  (`0.1`) followed by a stray `9` with no operator before it.

## Repository

`https://github.com/flaviosv/seezle-test-assessment`

## Setup

**Prerequisites**: Go 1.26+, Node 22+, Docker + Docker Compose (optional, for the quick start).

```bash
# Backend
cd backend && go mod download

# Frontend
cd frontend && npm install
```

## Quick Start

```bash
docker compose up --build
```

- Frontend: http://localhost:8080
- Backend: http://localhost:8090
- Swagger UI: http://localhost:8090/swagger/index.html
- ReDoc: http://localhost:8090/docs

Or run each service manually:

```bash
# Backend
cd backend && go run ./main.go

# Frontend (separate terminal)
cd frontend && npm run dev
```

## Building

```bash
cd backend && go build ./...
cd frontend && npm run build
```

## Testing

```bash
cd backend && go test ./...
cd frontend && npm run test -- --run
```

See [`docs/codebase/COVERAGE.md`](docs/codebase/COVERAGE.md) for the full coverage summary.

## API

A single endpoint, `POST /v1/calculate`. Full request/response contract, error catalogue, and curl
examples: [`docs/API.md`](docs/API.md).

```bash
curl -X POST http://localhost:8090/v1/calculate \
  -H "Content-Type: application/json" \
  -d '{"operation":"2+2"}'
# {"operation":"2+2","result":4}
```

## Design

UI design rationale, architecture, state machine, and component responsibilities:
[`docs/codebase/DESIGN.md`](docs/codebase/DESIGN.md).

## Spec-Driven Development

This project was built using Spec-Driven Development (SDD) with a grilling phase. The
specification, design, task breakdown, commit log, and validation report all live under
`.specs/features/SEZ-1-calculator-mvp/`:

- `grilling-session.md` — questions resolved during grilling
- `spec.md` — full requirements and acceptance criteria
- `design.md` — architecture and component design
- `tasks.md` — atomic task breakdown
- `commits.md` — log of commits, one per task
- `validation.md` — verification report from the independent Verifier

Every user prompt given in this session is recorded verbatim in [`docs/PROMPTS.md`](docs/PROMPTS.md).

## Postman Collection

`Seezle Test Assessment.postman_collection.json` (repo root) — a runnable collection covering the
happy path, all seven operators, chained postfix operators, negative-number handling, and every
documented error case.

## License

MIT
