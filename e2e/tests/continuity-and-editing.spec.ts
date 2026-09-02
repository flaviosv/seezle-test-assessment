import { test } from '@playwright/test'
import { expectResult, gotoApp, pressButtons } from './calculator'

// P2 (spec.md FE-10..13): fluent entry — continuation vs. fresh start after
// a result, backspace, decimal auto-zero, and sign toggle.

test.describe('continuity and editing (P2)', () => {
  test('an operator after a result continues from it; a digit starts fresh (FE-10)', async ({ page }) => {
    await gotoApp(page)
    await pressButtons(page, '2', '+', '2', '=')
    await expectResult(page, '4')

    await pressButtons(page, '+', '1', '=')
    await expectResult(page, '5')

    await pressButtons(page, '2', '+', '2', '=')
    await expectResult(page, '4')

    await pressButtons(page, '9')
    await expectResult(page, '9')
  })

  test('backspace deletes the last character of the composed expression (FE-12)', async ({ page }) => {
    await gotoApp(page)
    await pressButtons(page, '1', '2', '3', 'Backspace')
    await expectResult(page, '12')
  })

  test('decimal auto-prefixes a leading zero (FE-13)', async ({ page }) => {
    await gotoApp(page)
    await pressButtons(page, '.')
    await expectResult(page, '0.')
    await pressButtons(page, '5')
    await expectResult(page, '0.5')
  })

  test('sign toggle inserts and removes the leading minus (FE-11)', async ({ page }) => {
    await gotoApp(page)
    await pressButtons(page, '5', 'Toggle sign')
    await expectResult(page, '-5')
    await pressButtons(page, 'Toggle sign')
    await expectResult(page, '5')
  })

  test('AC resets the display back to empty, including after a shown result (FE-06)', async ({ page }) => {
    await gotoApp(page)
    await pressButtons(page, '2', '+', '2', '=')
    await expectResult(page, '4')
    await pressButtons(page, 'AC')
    await expectResult(page, '0')
  })
})
