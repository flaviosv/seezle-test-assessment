# API Reference

## Overview

A single stateless endpoint. No auth, no persistence, no side effects — every request is evaluated
independently.

## `POST /v1/calculate`

**URL**: `http://localhost:8090/v1/calculate`

**Headers**: `Content-Type: application/json`

**Body**:

```json
{ "operation": "2+2" }
```

`operation` is a raw expression string over the grammar below.

### Success response (`200`)

```json
{ "operation": "2+2", "result": 4 }
```

- `operation` echoes the request's original string verbatim (not reformatted).
- `result` is a JSON **number** (never a string), rounded to 10 significant digits, trailing zeros
  trimmed, never rendered in scientific notation.

### Error response (`400`)

```json
{ "error": "operations: division by zero" }
```

One envelope for every failure mode: malformed JSON, invalid characters, grammar mismatches,
division by zero, modulo by zero, square root of a negative number, and non-finite results (overflow).

## Grammar

Left-to-right evaluation, no operator precedence, no parentheses:

```
Expression := Term (BinaryOp Term)*
Term       := Sign? Digit+ ('.' Digit+)? UnaryOp*
Sign       := '-'
BinaryOp   := '+' | '-' | '*' | '/' | '^' | '%'   ('%' only when a Digit follows it)
UnaryOp    := '\' | '%'                           ('%' only when a Digit does NOT follow it)
Digit      := '0'..'9'
```

`UnaryOp`s are postfix and apply only to the `Term` they're attached to, not the running total.
`%` is the one symbol that's both: a digit immediately after it makes it binary modulo (`10%9` = `1`);
anything else (another operator, or end of expression) makes it postfix percent (`50%` = `0.5`).

| Symbol | Meaning |
| ------ | ------- |
| `+` `-` `*` `/` `^` | Binary: add, subtract, multiply, divide, exponent |
| `%` (digit follows) | Binary: modulo, right operand must be non-zero and positive |
| `\` | Postfix: square root of the term's value |
| `%` (digit does not follow) | Postfix: term's value divided by 100 |

Full formal grammar and worked examples: `.specs/features/SEZ-1-calculator-mvp/design.md`
("Grammar & Parser Design").

## Error Catalogue

| Error message | Cause |
| ------------- | ----- |
| `operations: expression is empty` | `operation` is `""` |
| `operations: expression contains an invalid character` | A character outside `0-9 . + - * / ^ \ %` |
| `operations: expression does not match the grammar` | Any grammar mismatch — double sign, leading/trailing binary operator, double binary operator, double decimal, bare `.` |
| `operations: division by zero` | `/` with a zero right-hand operand |
| `operations: modulo by zero` | `%` (modulo form) with a zero right-hand operand |
| `operations: square root of a negative number` | `\` applied to a negative term value |
| `operations: result is not a finite number` | Overflow (e.g. an extreme `^`) |
| (Gin bind error text) | Malformed JSON body, or `operation` missing / non-string |

## Examples

```bash
curl -X POST http://localhost:8090/v1/calculate \
  -H "Content-Type: application/json" \
  -d '{"operation":"2+2"}'
# {"operation":"2+2","result":4}

curl -X POST http://localhost:8090/v1/calculate \
  -H "Content-Type: application/json" \
  -d '{"operation":"16\\%"}'
# {"operation":"16\\%","result":0.04}

curl -X POST http://localhost:8090/v1/calculate \
  -H "Content-Type: application/json" \
  -d '{"operation":"10%9"}'
# {"operation":"10%9","result":1}

curl -X POST http://localhost:8090/v1/calculate \
  -H "Content-Type: application/json" \
  -d '{"operation":"1/0"}'
# {"error":"operations: division by zero"}
```

## Interactive Docs

- Swagger UI: `http://localhost:8090/swagger/index.html`
- ReDoc: `http://localhost:8090/docs`

Both are unauthenticated (no auth exists anywhere in this service).
