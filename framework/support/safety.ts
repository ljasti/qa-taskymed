/**
 * File: framework/support/safety.ts
 *
 * Purpose: Applies the final safety checks before state changes, credentials or
 * suite execution are used. It never prints secret values or performs cleanup.
 *
 * Maintainer: Lakshmikiran J. | Project: TaskyMed QA
 * Origin: Manually maintained; no generation command.
 * Used by: fixtures and framework isolation tests; production is always denied.
 */
import type { QaConfig, QaRole, QaSuite } from '../config/environments.js';

/** Rejects writes unless the selected non-production policy explicitly permits them. */
export function assertStateChangeAllowed(config: QaConfig, operation: string): void {
  if (config.production || !config.allowStateChanges || !config.allowSyntheticData)
    throw new Error(
      `Blocked state-changing operation '${operation}': environment policy does not authorize it.`,
    );
}

/** Rejects suites not allowed by the selected environment policy. */
export function assertSuiteAllowed(config: QaConfig, suite: QaSuite): void {
  if (!config.allowedSuites.includes(suite)) {
    throw new Error(`Suite '${suite}' is not allowed in QA_ENV=${config.environment}.`);
  }
  if (config.production && suite !== 'smoke' && suite !== 'api') {
    throw new Error(
      'Production is fail-closed: only explicitly approved read-only suites are allowed.',
    );
  }
}

// Role-to-variable mapping is explicit so a missing role credential cannot fall
// through to another role or environment.
const credentialVariables: Record<QaRole, readonly [string, string]> = {
  reception: ['QA_RECEPTION_EMAIL', 'QA_RECEPTION_PASSWORD'],
  physician: ['QA_PHYSICIAN_EMAIL', 'QA_PHYSICIAN_PASSWORD'],
  nursing: ['QA_NURSING_EMAIL', 'QA_NURSING_PASSWORD'],
  pharmacy: ['QA_PHARMACY_EMAIL', 'QA_PHARMACY_PASSWORD'],
  customer_admin: ['QA_CUSTOMER_ADMIN_EMAIL', 'QA_CUSTOMER_ADMIN_PASSWORD'],
};

/**
 * Requires credentials from the selected environment only; there is no fallback.
 * Throws with variable names, never secret values, when setup is incomplete.
 */
export function requireCredentials(
  config: QaConfig,
  role: QaRole,
  env: NodeJS.ProcessEnv = process.env,
): { email: string; password: string } {
  const [emailName, passwordName] = credentialVariables[role];
  const email = env[emailName];
  const password = env[passwordName];
  if (!email || !password) {
    throw new Error(
      `Missing ${config.environment}-scoped credentials for role '${role}' (${emailName}, ${passwordName}).`,
    );
  }
  if (env.QA_CREDENTIAL_SCOPE !== config.environment) {
    throw new Error(`Credential scope does not match QA_ENV=${config.environment}.`);
  }
  return { email, password };
}

/** Ensures a runtime dataset belongs to the selected environment and config. */
export function assertDatasetAllowed(config: QaConfig, datasetId: string): void {
  if (datasetId !== config.datasetId || !datasetId.startsWith(`${config.environment}-`)) {
    throw new Error(`Dataset '${datasetId}' is not authorized for QA_ENV=${config.environment}.`);
  }
}
