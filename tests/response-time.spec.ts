/**
 * File: timing-summary.spec.ts
 *
 * Purpose: Demonstrates response-time sample summarization without contacting
 * TaskyMed. It verifies the measurement helper while live endpoint timing stays
 * blocked until an approved endpoint is available.
 * Maintainer: Lakshmikiran J. | Project: TaskyMed QA
 * Origin: Manually maintained; no Codegen or performance tool generated it.
 *
 * Run: npm run test:response-time. Edit manually when timing evidence changes.
 */
import { test, expect, summarizeTimings } from '../framework/support/test.js';

test('ESS-PERF-001: summarizes controlled response-time samples @performance @response-time', () => {
  // Use a small deterministic sample to verify the helper, not a load test.
  const summary = summarizeTimings([12, 18, 15]);
  // The expected summary proves count, bounds and rounded average behavior.
  expect(summary).toEqual({ sampleCount: 3, minimumMs: 12, maximumMs: 18, averageMs: 15 });
});
