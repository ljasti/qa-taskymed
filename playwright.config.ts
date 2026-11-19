/**
 * File: playwright.config.ts
 *
 * Purpose: Configures Playwright projects, reporters, timeouts, traces and the
 * selected environment's report metadata. It loads no secret values itself.
 *
 * Maintainer: Lakshmikiran J. | Project: TaskyMed QA
 * Origin: Manually maintained; browser projects come from native Playwright devices.
 * Used by: Playwright CLI, Docker and GitHub Actions.
 * Run: npx playwright test --list. Edit manually for execution policy changes.
 */
import { defineConfig } from '@playwright/test';
import { loadConfig } from './framework/config/environments.js';
import { projects } from './framework/config/browsers.js';

// Configuration is loaded once before Playwright creates projects. A failure
// here blocks the run instead of allowing an unsafe default environment.
const config = loadConfig();

// Reports and artifacts are namespaced by environment to avoid mixing evidence.
const reportDir = `test-results/${config.reportNamespace}`;
const artifactDir = `${reportDir}/artifacts`;

// Native Playwright options provide isolation, retries, diagnostics and the
// reporters used by local, Docker and CI execution.
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: Number(process.env.QA_WORKERS ?? (process.env.CI ? 2 : 1)),
  timeout: 30_000,
  expect: { timeout: 8_000 },
  outputDir: artifactDir,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: `${reportDir}/html` }],
    ['junit', { outputFile: `${reportDir}/junit.xml` }],
    ['json', { outputFile: `${reportDir}/results.json` }],
  ],
  use: {
    baseURL: config.uiBaseUrl,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 20_000,
    testIdAttribute: 'data-testid',
  },
  projects,
  metadata: {
    qaEnvironment: config.environment,
    tenantId: config.tenantId,
    datasetId: config.datasetId,
    licenseProfile: config.licenseProfile,
    reportNamespace: config.reportNamespace,
  },
});
