import path from 'node:path';
import { defineConfig } from '@playwright/test';

// Integrated end-to-end Web QA for BeePOS (phase 05 step 2). One long user journey per
// viewport/locale/theme combination; BeePOS keeps all state in memory, so a journey must
// never hard-reload between steps (navigation goes through lib/session.ts).
const projectRoot = path.resolve(__dirname, '../../..');
const PORT = Number(process.env.BEEPOS_E2E_PORT ?? 8099);
// Point the suite at a deployed build: BEEPOS_E2E_BASEURL=https://beepos.beemvp.com npm run qa:e2e
const BASE_URL = process.env.BEEPOS_E2E_BASEURL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './specs',
  testIgnore: process.env.E2E_DISCOVER ? [] : [/_discover/],
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  timeout: 300_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 20_000,
    screenshot: 'only-on-failure',
  },
  webServer: process.env.BEEPOS_E2E_BASEURL ? undefined : {
    command: `npx expo start --web --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    cwd: projectRoot,
    reuseExistingServer: true,
    timeout: 240_000,
  },
  projects: [
    { name: 'wide', use: { viewport: { width: 1280, height: 800 } } },
    { name: 'narrow', use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
  ],
});
