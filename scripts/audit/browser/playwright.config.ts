import path from 'node:path';
import { defineConfig, devices } from '@playwright/test';

// Phase 11 Part B: executes the 8 `untested-needs-browser` behavior claims (ADLG-01,
// DLG-01, DLG-02, SEL-01, SEL-02, SHEET-01, TOAST-01, TOAST-02) against the real
// BeePOS web build, which the Jest/react-test-renderer claims harness (scripts/audit/
// claims/) cannot exercise because it stubs the overlay/portal/gesture runtime.
const projectRoot = path.resolve(__dirname, '../../..');
const PORT = 8098;

export default defineConfig({
  testDir: './specs',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  timeout: 30_000,
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: `npx expo start --web --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    cwd: projectRoot,
    reuseExistingServer: true,
    timeout: 180_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
