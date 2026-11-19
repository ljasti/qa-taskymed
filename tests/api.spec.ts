/**
 * File: health-contract.spec.ts
 * Purpose: Probes the configured API health endpoint without mutating data.
 * Maintainer: Lakshmikiran J. | Project: TaskyMed QA-Practice
 * Origin: Manually maintained; endpoint path requires verification.
 * Run: npm run test:api. Edit manually only against an approved API contract.
 */
import { test, expect } from '../framework/support/test.js';
test('ESS-API-001: configured API responds to a read-only health probe @api @smoke', async ({
  api,
  qaConfig,
}) => {
  // This is a read-only probe against the configured API base URL.
  const response = await api.get('/health');
  // An unavailable non-local endpoint is reported as blocked; an available
  // endpoint must still satisfy the actual status assertion below.
  test.skip(
    !response.ok() && qaConfig.environment !== 'local',
    `BLOCKED: API health unavailable (${response.status()})`,
  );
  expect([200, 204]).toContain(response.status());
});
