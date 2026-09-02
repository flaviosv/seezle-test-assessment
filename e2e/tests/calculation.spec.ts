import { test, expect } from '@playwright/test'
import { echoedOperationText, expectResult, gotoApp, pressButtons, resultText } from './calculator'

// P1 MVP flow (spec.md P1, CALC-01/07, FE-01/02/05/08): a real click-driven
// and keyboard-driven calculation round trip through the actual backend —
// the one thing unit/component tests (which mock the API client) cannot
// exercise (see docs/codebase/COVERAGE.md's former "No end-to-end test
// suite" gap).

test.describe('calculation (P1 MVP)', () => {
  test('clicking digits and an operator, then "=", shows the correct result (FE-01, FE-05, FE-08)', async ({
    page,
  }) => {
    await gotoApp(page)
    await pressButtons(page, '2', '+', '2', '=')
    await expectResult(page, '4')
    await expect(echoedOperationText(page)).toHaveText('2+2')
  })

  test('typing on the keyboard produces the same result as clicking (FE-02, FE-03)', async ({ page }) => {
    await gotoApp(page)
    await page.keyboard.type('2+2')
    await page.keyboard.press('Enter')
    await expectResult(page, '4')
  })

  test('chained postfix operators bind to their own term (16\\% = sqrt(16) then %) (CALC-02..04)', async ({
    page,
  }) => {
    await gotoApp(page)
    await pressButtons(page, '1', '6', 'Square root', '%', '=')
    await expectResult(page, '0.04')
    await expect(echoedOperationText(page)).toHaveText('16\\%')
  })

  test('AC and "=" are styled as the danger/red controls (FE-07)', async ({ page }) => {
    await gotoApp(page)
    const ac = page.getByRole('button', { name: 'AC', exact: true })
    const equals = page.getByRole('button', { name: '=', exact: true })
    await expect(ac).toHaveClass(/color-danger/)
    await expect(equals).toHaveClass(/color-danger/)
  })

  test('the display shows "0" before anything is entered', async ({ page }) => {
    await gotoApp(page)
    await expect(resultText(page)).toHaveText('0')
  })
})
