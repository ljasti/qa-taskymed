/**
 * File: framework/config/environments.ts
 *
 * Purpose: Loads one complete, environment-specific QA context and rejects
 * unsafe or incomplete combinations before Playwright starts.
 *
 * Maintainer: Lakshmikiran J. | Project: TaskyMed QA
 * Origin: Manually maintained; no generation command.
 * Used by: playwright.config.ts, support/test.ts, safety checks and unit tests.
 * Run: npm run verify:config. Edit manually when environment policy changes.
 */
import { existsSync, readFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { z } from 'zod';

/** These names are the only environments the framework can select. */
export const environmentNames = ['local', 'dev', 'qa', 'poc', 'uat', 'production'] as const;
export type QaEnvironment = (typeof environmentNames)[number];

/** Suite names are shared by configuration, tags and safety-policy checks. */
export const suiteNames = [
  'smoke',
  'sanity',
  'functional',
  'integration',
  'api',
  'e2e',
  'regression',
  'security',
  'licensing',
  'accessibility',
  'performance',
  'reliability',
  'negative',
  'rbac',
  'response-time',
  'cross-browser',
  'mobile-web',
  'responsive',
  'uat',
] as const;
export type QaSuite = (typeof suiteNames)[number];
export type QaRole = 'reception' | 'physician' | 'nursing' | 'pharmacy' | 'customer_admin';

// Runtime values come from environment files or CI, so TypeScript types alone
// cannot prove that the values are present, valid or safe to use.
const schema = z.object({
  QA_ENV: z.enum(environmentNames),
  QA_UI_BASE_URL: z.string().url(),
  QA_API_BASE_URL: z.string().url(),
  QA_TENANT_ID: z.string().min(1),
  QA_FACILITY_ID: z.string().min(1),
  QA_EXPECTED_APP_ID: z.string().min(1),
  QA_EXPECTED_ENVIRONMENT: z.enum(environmentNames),
  QA_CREDENTIAL_SCOPE: z.enum(environmentNames),
  QA_DATASET_ID: z.string().min(1),
  QA_LICENSE_PROFILE: z.string().min(1),
  QA_ALLOWED_SUITES: z.string().min(1),
  QA_CLEANUP_POLICY: z.enum(['dry-run', 'test-owned-only']),
  QA_REPORT_NAMESPACE: z.string().min(1),
  QA_ALLOW_SYNTHETIC_DATA: z.enum(['true', 'false']).default('false'),
  QA_ALLOW_STATE_CHANGES: z.enum(['true', 'false']).default('false'),
});

// Dataset manifests are validated separately so a valid environment cannot
// silently use a manifest for another tenant or subscription profile.
const datasetSchema = z.object({
  environment: z.string(),
  datasetId: z.string(),
  available: z.boolean(),
  tenantId: z.string(),
  facilityId: z.string(),
  syntheticOnly: z.literal(true),
  licenseFixture: z.string().min(1),
  licenseProfile: z.literal('essential'),
  workflows: z.array(z.string()),
  expectedResults: z.array(z.string()),
  creationStrategy: z.string().min(1),
  cleanup: z.object({
    owner: z.string().min(1),
    policy: z.string().min(1),
    restrictions: z.string().min(1),
  }),
});

// A host allowlist prevents a mistyped environment from targeting an unrelated
// application. Production is intentionally empty and therefore fail-closed.
const hostAllowlist: Record<QaEnvironment, RegExp[]> = {
  local: [/^https?:\/\/(taskymed\.local|127\.0\.0\.1|localhost|host\.docker\.internal)(:\d+)?$/],
  dev: [/^https:\/\/.*\bdev\b.*$/],
  qa: [/^https:\/\/.*\bqa\b.*$/],
  poc: [/^https:\/\/.*\bpoc\b.*$/],
  uat: [/^https:\/\/.*\buat\b.*$/],
  production: [],
};

/** The hosted domain is deliberately unclassified until an owner verifies it. */
export const unclassifiedHostedDomain = 'taskymed.amroth.life';

export type QaConfig = {
  environment: QaEnvironment;
  uiBaseUrl: string;
  apiBaseUrl: string;
  tenantId: string;
  facilityId: string;
  expectedAppId: string;
  expectedEnvironment: QaEnvironment;
  credentialScope: QaEnvironment;
  datasetId: string;
  licenseProfile: string;
  allowedSuites: QaSuite[];
  cleanupPolicy: 'dry-run' | 'test-owned-only';
  reportNamespace: string;
  configSource: string;
  datasetManifest: {
    available: boolean;
    licenseFixture: string;
    workflows: string[];
  };
  allowSyntheticData: boolean;
  allowStateChanges: boolean;
  production: boolean;
};

/** Converts the comma-separated suite setting into unique, typed suite names. */
function parseSuites(value: string): QaSuite[] {
  const requested = value
    .split(',')
    .map((suite) => suite.trim())
    .filter(Boolean);
  if (!requested.length || requested.some((suite) => !suiteNames.includes(suite as QaSuite))) {
    throw new Error('Invalid QA_ALLOWED_SUITES. Use known suite names separated by commas.');
  }
  return [...new Set(requested as QaSuite[])];
}

/** Reads simple KEY=VALUE files without adding another configuration loader. */
function readEnvFile(filePath: string): NodeJS.ProcessEnv {
  if (!existsSync(filePath)) return {};
  const values: NodeJS.ProcessEnv = {};
  for (const line of readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const separator = trimmed.indexOf('=');
    if (separator < 1) continue;
    const key = trimmed.slice(0, separator).trim();
    const value = trimmed
      .slice(separator + 1)
      .trim()
      .replace(/^(['"])(.*)\1$/, '$2');
    values[key] = value;
  }
  return values;
}

/**
 * Selects the environment file and merges it with process variables.
 * Explicit process variables win so CI can inject secrets without writing them.
 * The filename check prevents QA_ENV=qa from reading a UAT file.
 */
function resolveEnvironmentSource(env: NodeJS.ProcessEnv): {
  values: NodeJS.ProcessEnv;
  source: string;
} {
  const rootFile = env.QA_ENV_FILE ?? (existsSync(resolve('.env')) ? '.env' : undefined);
  const rootValues = rootFile ? readEnvFile(resolve(rootFile)) : {};
  const requestedEnvironment = env.QA_ENV ?? rootValues.QA_ENV;
  const selectedFile = env.QA_ENV_FILE ?? rootValues.QA_ENV_FILE;
  if (selectedFile && requestedEnvironment) {
    const selectedName = basename(selectedFile);
    if (selectedName !== `${requestedEnvironment}.env` && selectedName !== '.env') {
      throw new Error(
        `QA_ENV_FILE '${selectedFile}' does not match QA_ENV=${requestedEnvironment}.`,
      );
    }
  }
  const selectedValues = selectedFile ? readEnvFile(resolve(selectedFile)) : {};
  return {
    values: { ...rootValues, ...selectedValues, ...env },
    source: selectedFile ?? rootFile ?? 'process environment',
  };
}

/**
 * Loads and validates one complete QA execution context before Playwright runs.
 * It checks configuration, dataset identity, credential scope, host policy and
 * production restrictions, and throws before any application test can start.
 *
 * @param env Values to validate; defaults to process.env.
 * @returns A validated configuration used by fixtures and Playwright.
 * @throws Error when configuration or safety policy is invalid.
 */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): QaConfig {
  const resolved = resolveEnvironmentSource(env);
  const sourceEnv = resolved.values;
  const parsed = schema.safeParse({
    QA_ENV: sourceEnv.QA_ENV,
    QA_UI_BASE_URL: sourceEnv.QA_UI_BASE_URL,
    QA_API_BASE_URL: sourceEnv.QA_API_BASE_URL,
    QA_TENANT_ID: sourceEnv.QA_TENANT_ID,
    QA_FACILITY_ID: sourceEnv.QA_FACILITY_ID,
    QA_EXPECTED_APP_ID: sourceEnv.QA_EXPECTED_APP_ID,
    QA_EXPECTED_ENVIRONMENT: sourceEnv.QA_EXPECTED_ENVIRONMENT,
    QA_CREDENTIAL_SCOPE: sourceEnv.QA_CREDENTIAL_SCOPE,
    QA_DATASET_ID: sourceEnv.QA_DATASET_ID,
    QA_LICENSE_PROFILE: sourceEnv.QA_LICENSE_PROFILE,
    QA_ALLOWED_SUITES: sourceEnv.QA_ALLOWED_SUITES,
    QA_CLEANUP_POLICY: sourceEnv.QA_CLEANUP_POLICY,
    QA_REPORT_NAMESPACE: sourceEnv.QA_REPORT_NAMESPACE,
    QA_ALLOW_SYNTHETIC_DATA: sourceEnv.QA_ALLOW_SYNTHETIC_DATA,
    QA_ALLOW_STATE_CHANGES: sourceEnv.QA_ALLOW_STATE_CHANGES,
  });
  if (!parsed.success) {
    throw new Error(
      `Invalid QA configuration: ${parsed.error.issues.map((issue) => issue.path.join('.') || 'QA_ENV').join(', ')}`,
    );
  }
  const c = parsed.data;
  // The manifest path is derived from the validated environment name, not from
  // caller input, preventing cross-environment dataset injection.
  const datasetPath = new URL(`./datasets/${c.QA_ENV}.json`, import.meta.url);
  if (!existsSync(datasetPath))
    throw new Error(`No dataset manifest exists for QA_ENV=${c.QA_ENV}.`);
  const dataset = datasetSchema.parse(JSON.parse(readFileSync(datasetPath, 'utf8')));
  // Stop before execution if the selected environment and dataset disagree.
  // Otherwise a local test could accidentally mutate a QA-owned dataset.
  if (dataset.environment !== c.QA_ENV || dataset.datasetId !== c.QA_DATASET_ID) {
    throw new Error(
      `Dataset manifest does not match QA_ENV=${c.QA_ENV} and QA_DATASET_ID=${c.QA_DATASET_ID}.`,
    );
  }
  // The dataset and selected license profile must describe the same contract.
  if (dataset.licenseProfile !== c.QA_LICENSE_PROFILE) {
    throw new Error('Dataset license profile does not match the selected license profile.');
  }
  // Available datasets are bound to one tenant and facility; placeholders for
  // unavailable environments remain non-runnable until approved.
  if (
    dataset.available &&
    (dataset.tenantId !== c.QA_TENANT_ID || dataset.facilityId !== c.QA_FACILITY_ID)
  ) {
    throw new Error(
      'Available dataset tenant/facility binding does not match selected configuration.',
    );
  }
  // Environment identity and credential scope must change together. No fallback
  // to another environment's credentials is permitted.
  if (c.QA_EXPECTED_ENVIRONMENT !== c.QA_ENV || c.QA_CREDENTIAL_SCOPE !== c.QA_ENV) {
    throw new Error(
      'Environment identity and credential scope must match QA_ENV. Refusing to run.',
    );
  }
  // The prefix is a second, simple ownership check on the dataset identifier.
  if (!c.QA_DATASET_ID.startsWith(`${c.QA_ENV}-`)) {
    throw new Error(
      `Dataset '${c.QA_DATASET_ID}' is not scoped to QA_ENV=${c.QA_ENV}. Refusing to run.`,
    );
  }
  // Report separation prevents results from different environments being mixed.
  if (!c.QA_REPORT_NAMESPACE.startsWith(`${c.QA_ENV}/`)) {
    throw new Error(`Report namespace must start with '${c.QA_ENV}/'. Refusing to run.`);
  }
  if (c.QA_LICENSE_PROFILE !== 'essential') {
    throw new Error(
      `This project targets the Essential profile; received '${c.QA_LICENSE_PROFILE}'.`,
    );
  }
  // Only known hosts may be targeted by each environment. An unknown hosted
  // domain therefore blocks before browser or API traffic is attempted.
  const allowed =
    hostAllowlist[c.QA_ENV].some((regex) => regex.test(c.QA_UI_BASE_URL)) &&
    hostAllowlist[c.QA_ENV].some((regex) => regex.test(c.QA_API_BASE_URL));
  if (!allowed) throw new Error(`Host is not allowlisted for QA_ENV=${c.QA_ENV}. Refusing to run.`);
  // Production is read-only by design; this guard remains fail-closed even if
  // an engineer accidentally supplies permissive state-change flags.
  if (
    c.QA_ENV === 'production' &&
    (c.QA_ALLOW_STATE_CHANGES === 'true' || c.QA_ALLOW_SYNTHETIC_DATA === 'true')
  ) {
    throw new Error('Production is fail-closed: state changes and synthetic data are prohibited.');
  }
  return {
    environment: c.QA_ENV,
    uiBaseUrl: c.QA_UI_BASE_URL,
    apiBaseUrl: c.QA_API_BASE_URL,
    tenantId: c.QA_TENANT_ID,
    facilityId: c.QA_FACILITY_ID,
    expectedAppId: c.QA_EXPECTED_APP_ID,
    expectedEnvironment: c.QA_EXPECTED_ENVIRONMENT,
    credentialScope: c.QA_CREDENTIAL_SCOPE,
    datasetId: c.QA_DATASET_ID,
    licenseProfile: c.QA_LICENSE_PROFILE,
    allowedSuites: parseSuites(c.QA_ALLOWED_SUITES),
    cleanupPolicy: c.QA_CLEANUP_POLICY,
    reportNamespace: c.QA_REPORT_NAMESPACE,
    configSource: resolved.source,
    datasetManifest: {
      available: dataset.available,
      licenseFixture: dataset.licenseFixture,
      workflows: dataset.workflows,
    },
    allowSyntheticData: c.QA_ALLOW_SYNTHETIC_DATA === 'true',
    allowStateChanges: c.QA_ALLOW_STATE_CHANGES === 'true',
    production: c.QA_ENV === 'production',
  };
}
