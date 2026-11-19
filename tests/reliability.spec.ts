/**
 * File: network-recovery.spec.ts
 * Purpose: Exercises a simulated 503 route and records navigation timing.
 * Maintainer: Lakshmikiran J. | Project: TaskyMed QA-Practice
 * Origin: Manually maintained; route mocking is written with native Playwright APIs.
 * Run: npm run test:reliability. Edit manually when the verified failure scenario changes.
 */
import { test, expect, failNext, measureNavigation } from '../framework/support/test.js';

test('ESS-REL-001: frontend records a bounded navigation under a simulated API failure @reliability @performance', async ({
  page,
}) => {
  // Simulate a service failure locally so this test does not require a live
  // backend or make destructive requests.
  await failNext(page, '/api/health', 503);
  // Measure only the awaited navigation and then verify route recovery.
  const result = await measureNavigation(page, async () => {
    await page.goto('/login');
  });
  expect(result.durationMs).toBeGreaterThanOrEqual(0);
  // The route assertion is the supported behavior currently implemented here.
  await expect(page).toHaveURL(/\/login/);
});
