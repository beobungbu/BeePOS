import path from 'node:path';
import { defineConfig } from '@playwright/test';

// Integrated end-to-end Web QA for BeePOS. One long user journey per viewport/locale/theme
// combination, plus the phase-5 feature specs (multi-order till, inventory operations,
// customer quick-add, reports and settings, persistence, POS features, perf harness).
//
// Every test starts from the login screen with storage wiped (lib/session.ts), so tests are
// independent and run in parallel. Navigation inside a test goes through `go()` rather than a
// reload, except where a spec is deliberately measuring what survives one.
const projectRoot = path.resolve(__dirname, '../../..');
const PORT = Number(process.env.BEEPOS_E2E_PORT ?? 8099);
// Point the suite at a deployed build: BEEPOS_E2E_BASEURL=https://beepos.beemvp.com npm run qa:e2e
const BASE_URL = process.env.BEEPOS_E2E_BASEURL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './specs',
  testIgnore: process.env.E2E_DISCOVER ? [] : [/_discover/],
  // Two workers keeps the whole suite inside the 15 minute budget while leaving the machine
  // enough headroom that the perf spec's frame timings stay meaningful.
  fullyParallel: true,
  workers: 2,
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
