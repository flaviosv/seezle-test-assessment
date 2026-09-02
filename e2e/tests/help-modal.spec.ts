import { test, expect } from '@playwright/test'
import { gotoApp } from './calculator'

// FE-14: the shortcuts help modal — opens on click, closes on its close
// control, on Escape, and on a backdrop click; a click inside the dialog
// itself must not close it.

test.describe('help modal (FE-14)', () => {
  test('opens on "?" click and lists the keyboard shortcuts', async ({ page }) => {
    await gotoApp(page)
    await page.getByRole('button', { name: 'Keyboard shortcuts help' }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog).toContainText('Keyboard Shortcuts')
  })

  test('closes on its close control', async ({ page }) => {
    await gotoApp(page)
    await page.getByRole('button', { name: 'Keyboard shortcuts help' }).click()
    await page.getByRole('button', { name: 'Close' }).click()
    await expect(page.getByRole('dialog')).toBeHidden()
  })

  test('closes on Escape', async ({ page }) => {
    await gotoApp(page)
    await page.getByRole('button', { name: 'Keyboard shortcuts help' }).click()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toBeHidden()
  })

  test('closes on a backdrop click', async ({ page }) => {
    await gotoApp(page)
    await page.getByRole('button', { name: 'Keyboard shortcuts help' }).click()
    await page.mouse.click(5, 5)
    await expect(page.getByRole('dialog')).toBeHidden()
  })

  test('a click inside the dialog does not close it', async ({ page }) => {
    await gotoApp(page)
    await page.getByRole('button', { name: 'Keyboard shortcuts help' }).click()
    await page.getByRole('dialog').getByText('Keyboard Shortcuts').click()
    await expect(page.getByRole('dialog')).toBeVisible()
  })
})
