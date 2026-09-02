import { test, expect } from '@playwright/test'
import { expectResult, gotoApp, pressButtons } from './calculator'

// FE-06, FE-09: error-lock and its two recovery paths. Escape-recovers-error
// is a direct regression test for the bug reported in docs/PROMPTS.md
// ("the esc keyboard button must be the shortcut for the AC").

test.describe('error handling (FE-09)', () => {
  test('division by zero shows Error and locks digit input until AC (CALC-08)', async ({ page }) => {
    await gotoApp(page)
    await pressButtons(page, '1', '/', '0', '=')
    await expectResult(page, 'Error')

    await expect(page.getByRole('button', { name: '5', exact: true })).toBeDisabled()
    await page.keyboard.press('5')
    await expectResult(page, 'Error')

    await pressButtons(page, 'AC')
    await expectResult(page, '0')
  })

  test('square root of a negative term shows Error (CALC-09)', async ({ page }) => {
    await gotoApp(page)
    await pressButtons(page, '4', 'Toggle sign', 'Square root', '=')
    await expectResult(page, 'Error')
  })

  test('a trailing operator with no right-hand term is rejected as a format error (API-04)', async ({
    page,
  }) => {
    await gotoApp(page)
    await pressButtons(page, '1', '+', '1', '+', '=')
    await expectResult(page, 'Error')
  })

  test('pressing Escape clears an Error state back to composing, same as AC — regression for the AC/Escape bug', async ({
    page,
  }) => {
    await gotoApp(page)
    await pressButtons(page, '1', '/', '0', '=')
    await expectResult(page, 'Error')

    await page.keyboard.press('Escape')
    await expectResult(page, '0')

    await pressButtons(page, '2', '+', '2', '=')
    await expectResult(page, '4')
  })

  test('an Error only unlocks via AC or Escape, not any other key', async ({ page }) => {
    await gotoApp(page)
    await pressButtons(page, '1', '/', '0', '=')
    await expectResult(page, 'Error')

    await expect(page.getByRole('button', { name: '+', exact: true })).toBeDisabled()
    await page.keyboard.press('+')
    await page.keyboard.press('Enter')
    await expectResult(page, 'Error')
  })
})
