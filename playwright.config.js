import process from 'node:process';
import { defineConfig, devices } from '@playwright/test';

const playwrightPort = Number.parseInt(process.env.PLAYWRIGHT_PORT || '4173', 10);

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  use: {
    baseURL: `http://127.0.0.1:${playwrightPort}`,
    trace: 'on-first-retry',
  },
  webServer: {
    command: `pnpm exec vite --host 127.0.0.1 --port ${playwrightPort} --strictPort`,
    url: `http://127.0.0.1:${playwrightPort}`,
    reuseExistingServer: false,
    timeout: 30000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
