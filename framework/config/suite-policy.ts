/**
 * File: framework/config/suite-policy.ts
 *
 * Purpose: Defines the safe environment policy and tag used by each execution
 * suite. It is consumed by catalog validation and suite-audit reporting.
 * Maintainer: Lakshmikiran J. | Project: TaskyMed QA
 * Origin: Manually maintained; no generation command.
 * Edit manually when suite policy or tag ownership changes.
 */
// A suite is allowed only in environments listed here. This is policy metadata,
// not proof that matching executable tests currently exist.
export const suitePolicy = {
  smoke: ['local', 'dev', 'qa', 'poc', 'uat'],
  sanity: ['local', 'dev', 'qa', 'poc', 'uat'],
  functional: ['local', 'dev', 'qa', 'poc', 'uat'],
  negative: ['local', 'dev', 'qa', 'poc', 'uat'],
  regression: ['local', 'dev', 'qa', 'uat'],
  api: ['local', 'dev', 'qa', 'uat'],
  integration: ['local', 'dev', 'qa', 'uat'],
  e2e: ['local', 'dev', 'qa', 'uat'],
  security: ['local', 'dev', 'qa'],
  rbac: ['local', 'dev', 'qa'],
  licensing: ['local', 'dev', 'qa'],
  accessibility: ['local', 'dev', 'qa', 'uat'],
  reliability: ['local', 'dev', 'qa'],
  performance: ['local', 'dev', 'qa'],
  'response-time': ['local', 'dev', 'qa'],
  'cross-browser': ['local', 'dev', 'qa', 'uat'],
  'mobile-web': ['local', 'dev', 'qa', 'uat'],
  responsive: ['local', 'dev', 'qa', 'uat'],
  uat: ['uat'],
  production: ['read-only'],
} as const;

export type SuiteName = keyof typeof suitePolicy;
// Tags let one test participate in several suites without copying its code.
export const suiteTags: Record<Exclude<SuiteName, 'production'>, string> = {
  smoke: '@smoke',
  sanity: '@sanity',
  functional: '@functional',
  negative: '@negative',
  regression: '@regression',
  api: '@api',
  integration: '@integration',
  e2e: '@e2e',
  security: '@security',
  rbac: '@rbac',
  licensing: '@licensing',
  accessibility: '@accessibility',
  reliability: '@reliability',
  performance: '@performance',
  'response-time': '@response-time',
  'cross-browser': '@cross-browser',
  'mobile-web': '@mobile',
  responsive: '@responsive',
  uat: '@uat',
};

// These commands are displayed by suite-audit.ts as the supported entry points.
export const suiteCommands: Record<Exclude<SuiteName, 'production'>, string> = {
  smoke: 'npm run test:smoke',
  sanity: 'npm run test:sanity',
  functional: 'npm run test:functional',
  negative: 'npm run test:negative',
  regression: 'npm run test:regression',
  api: 'npm run test:api',
  integration: 'npm run test:integration',
  e2e: 'npm run test:e2e',
  security: 'npm run test:security',
  rbac: 'npm run test:rbac',
  licensing: 'npm run test:licensing',
  accessibility: 'npm run test:accessibility',
  reliability: 'npm run test:reliability',
  performance: 'npm run test:performance',
  'response-time': 'npm run test:response-time',
  'cross-browser': 'npm run test:cross-browser',
  'mobile-web': 'npm run test:mobile',
  responsive: 'npm run test:responsive',
  uat: 'npm run test:uat',
};
