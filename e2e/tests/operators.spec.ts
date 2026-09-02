import { test } from '@playwright/test'
import { expectResult, gotoApp, pressButtons } from './calculator'

// One real-browser round trip per operator from README.md's operator table,
// plus the exact expressions that previously reached production broken
// (docs/PROMPTS.md) — regression coverage for the modulo-vs-percent
// context-sensitivity fix (CALC-12).

test.describe('operators (README table)', () => {
  test('addition: 2+2 = 4', async ({ page }) => {
    await gotoApp(page)
    await pressButtons(page, '2', '+', '2', '=')
    await expectResult(page, '4')
  })

  test('subtraction: 5-3 = 2', async ({ page }) => {
    await gotoApp(page)
    await pressButtons(page, '5', '-', '3', '=')
    await expectResult(page, '2')
  })

  test('multiplication: 2*3 = 6', async ({ page }) => {
    await gotoApp(page)
    await pressButtons(page, '2', '*', '3', '=')
    await expectResult(page, '6')
  })

  test('division: 6/3 = 2', async ({ page }) => {
    await gotoApp(page)
    await pressButtons(page, '6', '/', '3', '=')
    await expectResult(page, '2')
  })

  test('exponentiation: 2^3 = 8', async ({ page }) => {
    await gotoApp(page)
    await pressButtons(page, '2', '^', '3', '=')
    await expectResult(page, '8')
  })

  test('square root (postfix): 9\\ = 3', async ({ page }) => {
    await gotoApp(page)
    await pressButtons(page, '9', 'Square root', '=')
    await expectResult(page, '3')
  })

  test('percent (postfix, no trailing digit): 50% = 0.5', async ({ page }) => {
    await gotoApp(page)
    await pressButtons(page, '5', '0', '%', '=')
    await expectResult(page, '0.5')
  })

  test('modulo (binary, digit follows %): 10%9 = 1 — previously broken in production', async ({
    page,
  }) => {
    await gotoApp(page)
    await pressButtons(page, '1', '0', '%', '9', '=')
    await expectResult(page, '1')
  })

  test('negative sign: -5+3 = -2', async ({ page }) => {
    await gotoApp(page)
    await pressButtons(page, '-', '5', '+', '3', '=')
    await expectResult(page, '-2')
  })

  test('modulo folds left-to-right through a chain — previously broken in production: 8^6*3%9+0 = 3', async ({
    page,
  }) => {
    await gotoApp(page)
    await pressButtons(page, '8', '^', '6', '*', '3', '%', '9', '+', '0', '=')
    await expectResult(page, '3')
  })

  test('square root of a term computed earlier in the expression: 4+16\\ = 8', async ({ page }) => {
    await gotoApp(page)
    await pressButtons(page, '4', '+', '1', '6', 'Square root', '=')
    await expectResult(page, '8')
  })
})
