import { expect, type Page } from '@playwright/test'

/**
 * Navigates to the app and waits for React to mount and attach its keydown
 * listener before returning — without this, `page.keyboard.*` calls made
 * immediately after `page.goto()` can race the listener's `useEffect` and
 * silently drop keystrokes (only observable on a cold-started dev server,
 * not a warm one).
 */
export async function gotoApp(page: Page) {
  await page.goto('/')
  await page.getByRole('button', { name: 'AC', exact: true }).waitFor()
}

/** Locates the calculator's result line — the large digits, not the small echoed-operation line. */
export function resultText(page: Page) {
  return page.getByRole('main').locator('span').last()
}

/** Locates the small echoed-operation line above the result. */
export function echoedOperationText(page: Page) {
  return page.getByRole('main').locator('span').first()
}

export async function pressButtons(page: Page, ...names: string[]) {
  for (const name of names) {
    await page.getByRole('button', { name, exact: true }).click()
  }
}

export async function expectResult(page: Page, expected: string) {
  await expect(resultText(page)).toHaveText(expected)
}
