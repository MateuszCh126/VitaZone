import { defineConfig, devices } from '@playwright/test';
import process from 'node:process';

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: 'terrarium-production.spec.js',
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4181',
    trace: 'on-first-retry',
    ...devices['Desktop Chrome']
  },
  webServer: {
    command: 'pnpm exec vite preview --host 127.0.0.1 --port 4181 --strictPort',
    url: 'http://127.0.0.1:4181',
    reuseExistingServer: !process.env.CI,
    timeout: 30000
  }
});
