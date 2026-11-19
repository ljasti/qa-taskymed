/**
 * File: framework/scripts/framework.test.ts
 * Purpose: Verifies catalog, environment safety, diagnostics and suite policy.
 * Maintainer: Lakshmikiran J. | Project: TaskyMed QA
 * Origin: Manually maintained consolidation of four Node test modules.
 * Usage: npm run test:unit. Edit manually when framework contracts change.
 */
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { loadConfig, unclassifiedHostedDomain } from '../config/environments.js';
import { suitePolicy, suiteTags } from '../config/suite-policy.js';
import { summarizeTimings } from '../support/test.js';
import {
  assertDatasetAllowed,
  assertStateChangeAllowed,
  requireCredentials,
} from '../support/safety.js';

// One in-memory LOCAL context keeps all safety tests independent of secrets,
// application availability and a developer's actual environment.
const localEnv: NodeJS.ProcessEnv = {
  QA_ENV: 'local',
  QA_UI_BASE_URL: 'http://taskymed.local',
  QA_API_BASE_URL: 'http://taskymed.local',
  QA_TENANT_ID: 'local-tenant',
  QA_FACILITY_ID: 'local-facility',
  QA_EXPECTED_APP_ID: 'taskymed-health-os',
  QA_EXPECTED_ENVIRONMENT: 'local',
  QA_CREDENTIAL_SCOPE: 'local',
  QA_DATASET_ID: 'local-essential-synthetic',
  QA_LICENSE_PROFILE: 'essential',
  QA_ALLOWED_SUITES: 'smoke,api,regression',
  QA_CLEANUP_POLICY: 'dry-run',
  QA_REPORT_NAMESPACE: 'local/run',
  QA_ALLOW_SYNTHETIC_DATA: 'false',
  QA_ALLOW_STATE_CHANGES: 'false',
};

test('catalog: authoritative workflow catalog is present', () =>
  assert.equal(existsSync(new URL('../catalog/catalog.yaml', import.meta.url)), true));

test('diagnostics: summarizes a controlled timing sample', () => {
  assert.deepEqual(summarizeTimings([12.2, 18.8, 15]), {
    sampleCount: 3,
    minimumMs: 12,
    maximumMs: 19,
    averageMs: 15,
  });
});

test('diagnostics: rejects an empty timing sample', () => {
  assert.throws(() => summarizeTimings([]), /sample/);
});

test('environment: rejects a QA credential scope when LOCAL is selected', () => {
  assert.throws(() => loadConfig({ ...localEnv, QA_CREDENTIAL_SCOPE: 'qa' }), /credential scope/i);
});

test('environment: rejects a QA dataset when LOCAL is selected', () => {
  assert.throws(
    () => loadConfig({ ...localEnv, QA_DATASET_ID: 'qa-essential-synthetic' }),
    /Dataset/,
  );
});

test('environment: rejects an unknown environment', () => {
  assert.throws(() => loadConfig({ ...localEnv, QA_ENV: 'sandbox' }), /QA_ENV/);
  assert.throws(() => loadConfig({ ...localEnv, QA_ENV: 'perf' }), /QA_ENV/);
});

test('environment: does not classify the hosted domain as LOCAL', () => {
  assert.equal(unclassifiedHostedDomain, 'taskymed.amroth.life');
  assert.throws(
    () =>
      loadConfig({
        ...localEnv,
        QA_UI_BASE_URL: `https://${unclassifiedHostedDomain}`,
        QA_API_BASE_URL: `https://${unclassifiedHostedDomain}`,
      }),
    /allowlisted/i,
  );
});

test('environment: loads only the selected file and dataset manifest', () => {
  const directory = mkdtempSync(join(tmpdir(), 'taskymed-qa-'));
  const file = join(directory, 'local.env');
  const contents = Object.entries(localEnv)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  writeFileSync(file, contents);
  try {
    const config = loadConfig({ QA_ENV_FILE: file });
    assert.equal(config.configSource, file);
    assert.equal(config.datasetManifest.available, false);
    assert.equal(
      config.datasetManifest.licenseFixture,
      '<approved-local-essential-license-fixture>',
    );
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('environment: rejects a mismatched expected environment', () => {
  assert.throws(() => loadConfig({ ...localEnv, QA_EXPECTED_ENVIRONMENT: 'qa' }), /identity/i);
});

test('environment: requires selected-environment credentials without fallback', () => {
  const config = loadConfig(localEnv);
  assert.throws(
    () =>
      requireCredentials(config, 'reception', {
        ...localEnv,
        QA_RECEPTION_EMAIL: 'qa-user@example.test',
      }),
    /Missing local-scoped credentials/,
  );
  assert.throws(
    () =>
      requireCredentials(config, 'reception', {
        ...localEnv,
        QA_RECEPTION_EMAIL: 'local-user@example.test',
        QA_RECEPTION_PASSWORD: 'not-a-real-secret',
        QA_CREDENTIAL_SCOPE: 'qa',
      }),
    /Credential scope/,
  );
});

test('environment: rejects a dataset outside the selected environment', () => {
  const config = loadConfig(localEnv);
  assert.throws(() => assertDatasetAllowed(config, 'qa-essential-synthetic'), /not authorized/);
});

test('environment: QA cannot use UAT credentials or a LOCAL dataset', () => {
  const qa = {
    ...localEnv,
    QA_ENV: 'qa',
    QA_EXPECTED_ENVIRONMENT: 'qa' as const,
    QA_CREDENTIAL_SCOPE: 'uat' as const,
    QA_DATASET_ID: 'qa-essential-synthetic',
    QA_REPORT_NAMESPACE: 'qa/run',
    QA_UI_BASE_URL: 'https://qa.example.test',
    QA_API_BASE_URL: 'https://qa.example.test',
  };
  assert.throws(() => loadConfig(qa), /credential scope|identity/i);
  assert.throws(
    () =>
      loadConfig({ ...qa, QA_CREDENTIAL_SCOPE: 'qa', QA_DATASET_ID: 'local-essential-synthetic' }),
    /Dataset/,
  );
});

test('environment: production state changes remain blocked', () => {
  const config = { ...loadConfig(localEnv), environment: 'production' as const, production: true };
  assert.throws(() => assertStateChangeAllowed(config, 'registration'), /Blocked state-changing/);
});

test('suites: every execution suite has a policy and Playwright tag', () => {
  for (const suite of Object.keys(suiteTags)) {
    assert.ok(suite in suitePolicy, `missing policy for ${suite}`);
    assert.match(suiteTags[suite as keyof typeof suiteTags], /^@[a-z0-9-]+$/);
  }
});

test('suites: performance policy does not claim load testing', () => {
  assert.ok('performance' in suitePolicy);
  assert.ok(!('load' in suitePolicy));
});
