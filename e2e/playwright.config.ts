import { defineConfig, devices } from '@playwright/test'

const FRONTEND_URL = 'http://localhost:8080'
const BACKEND_URL = 'http://localhost:8090'

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : [['list']],

  use: {
    baseURL: FRONTEND_URL,
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: [
    {
      command: 'go run ./main.go',
      cwd: '../backend',
      url: BACKEND_URL,
      name: 'backend',
      timeout: 60 * 1000,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'npm run dev -- --port 8080 --strictPort',
      cwd: '../frontend',
      url: FRONTEND_URL,
      name: 'frontend',
      timeout: 60 * 1000,
      reuseExistingServer: !process.env.CI,
    },
  ],
})
