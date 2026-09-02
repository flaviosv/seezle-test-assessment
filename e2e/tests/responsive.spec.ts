import { test, expect } from '@playwright/test'
import { pressButtons, expectResult, gotoApp } from './calculator'

// FE-17: responsive, no horizontal scroll at phone width. Previously
// verified only manually (see docs/codebase/COVERAGE.md's Gap Analysis) —
// this automates that same document.documentElement.scrollWidth vs.
// clientWidth check across the three widths that were checked by hand.

const PHONE_WIDTHS = [320, 375, 390]

test.describe('responsive layout (FE-17)', () => {
  for (const width of PHONE_WIDTHS) {
    test(`no horizontal overflow at ${width}px viewport width`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 })
      await gotoApp(page)

      const { scrollWidth, clientWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }))
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth)
    })
  }

  test('the calculator remains fully usable at 320px width', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 })
    await gotoApp(page)
    await pressButtons(page, '2', '+', '2', '=')
    await expectResult(page, '4')
  })
})
