/**
 * File: framework/config/browsers.ts
 * Purpose: Defines the browser/device projects consumed by playwright.config.ts.
 * Maintainer: Lakshmikiran J. | Project: TaskyMed QA
 * Origin: Manually maintained; browser binaries are installed by npm run install:browsers.
 * Usage: Select with npx playwright test --project=<name>. Edit manually when the supported matrix changes.
 */
import { devices, type Project } from '@playwright/test';

// These are named Playwright projects, so a learner can select one browser or
// device without duplicating a test specification. Mobile profiles emulate a
// viewport and browser engine; they are not native Android or iOS tests.
export const projects: Project[] = [
  { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  { name: 'mobile-chrome', use: { ...devices['Pixel 5'] } },
  { name: 'mobile-safari', use: { ...devices['iPhone 13'] } },
  { name: 'tablet', use: { ...devices['iPad (gen 7)'] } },
];
