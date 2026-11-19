/**
 * File: framework/support/test.ts
 * Purpose: Extends Playwright with validated environment/API fixtures and
 * small route/timing diagnostics used by framework-only tests.
 * Maintainer: Lakshmikiran J. | Project: TaskyMed QA
 * Origin: Manually maintained; uses native test.extend(), not a custom runner.
 * Usage: Import `{ test, expect }` in specs. Edit manually when fixture or diagnostic contracts change.
 */
import { test as base, expect } from '@playwright/test';
import { loadConfig, type QaConfig } from '../config/environments.js';
import { ApiClient } from './api.js';
import type { Page, Route } from '@playwright/test';

// Native test.extend() creates a validated environment fixture and a thin API
// client for every test without introducing a second test runner.
export const test = base.extend<{ qaConfig: QaConfig; api: ApiClient }>({
  // Loading here means missing or unsafe configuration blocks before test steps.
  qaConfig: async ({}, use) => use(loadConfig()),
  // The API client receives the same validated base URL as the browser context.
  api: async ({ request, qaConfig }, use) => use(new ApiClient(request, qaConfig.apiBaseUrl)),
});
export { expect };

/** Registers a response simulation for a matching route pattern. */
export async function failNext(page: Page, urlPart: string, status: number): Promise<void> {
  await page.route(`**/*${urlPart}*`, async (route: Route) =>
    route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify({ error: `simulated-${status}` }),
    }),
  );
}

/** Aborts matching requests to exercise frontend network-failure handling. */
export async function abortNext(page: Page, urlPart: string): Promise<void> {
  await page.route(`**/*${urlPart}*`, (route) => route.abort('failed'));
}

/** Measures one awaited browser action; this is a functional signal, not load testing. */
export async function measureNavigation(
  page: Page,
  action: () => Promise<void>,
): Promise<{ durationMs: number; url: string }> {
  const start = performance.now();
  await action();
  return { durationMs: Math.round(performance.now() - start), url: page.url() };
}

export type TimingSummary = {
  sampleCount: number;
  minimumMs: number;
  maximumMs: number;
  averageMs: number;
};

/** Summarizes bounded samples and rejects an empty sample set. */
export function summarizeTimings(samplesMs: number[]): TimingSummary {
  if (!samplesMs.length) throw new Error('At least one timing sample is required.');
  const rounded = samplesMs.map((value) => Math.max(0, Math.round(value)));
  return {
    sampleCount: rounded.length,
    minimumMs: Math.min(...rounded),
    maximumMs: Math.max(...rounded),
    averageMs: Math.round(rounded.reduce((sum, value) => sum + value, 0) / rounded.length),
  };
}
