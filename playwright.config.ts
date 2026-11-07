import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: 'tests/browser',
  timeout: 30000,
  fullyParallel: true,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.TEST_BASE_URL || 'http://127.0.0.1:4321',
    browserName: 'chromium',
    trace: 'retain-on-failure',
  },
  webServer: process.env.TEST_BASE_URL
    ? undefined
    : {
        // Exercise the exact production assets already built by CI.
        command: 'npm run preview:static',
        url: 'http://127.0.0.1:4321',
        reuseExistingServer: false,
        stdout: 'pipe',
        stderr: 'pipe',
      },
});
