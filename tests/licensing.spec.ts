/**
 * File: seat-limit.spec.ts
 * Purpose: Records the Essential eleventh-seat case; it stays blocked without an approved fixture.
 * Maintainer: Lakshmikiran J. | Project: TaskyMed QA
 * Origin: Manually maintained; no generated license fixture is committed.
 * Run: npm run test:licensing. Edit manually only with approved entitlement evidence.
 */
import { test } from '../framework/support/test.js';
test('ESS-LIC-SEAT-S001-TC001: eleventh Essential seat is rejected @licensing @security @regression', async () => {
  // Keep the requirement visible without manufacturing a license fixture or
  // changing a customer tenant. The case is intentionally blocked by policy.
  test.fail(
    true,
    'BLOCKED: no approved Essential license fixture or authorized seat-allocation API is configured',
  );
});
