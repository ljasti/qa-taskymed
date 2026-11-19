/**
 * File: framework/support/data.ts
 * Purpose: Creates unique synthetic patient values; it never uses real PHI.
 * Maintainer: Lakshmikiran J. | Project: TaskyMed QA
 * Origin: Manually maintained; no generator command.
 * Usage: Imported by workflow specs. Edit manually when an approved synthetic-data schema changes.
 */
export type SyntheticPatient = {
  firstName: string;
  lastName: string;
  phone: string;
  externalOwner: string;
};

/** Creates unique, synthetic values owned by one test identifier. */
export function patientFactory(owner: string): SyntheticPatient {
  // The generated suffix prevents parallel tests from sharing mutable records;
  // the values are synthetic and contain no real patient information.
  const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  return {
    firstName: 'QA',
    lastName: `Synthetic-${suffix}`,
    phone: `980${suffix.slice(-7)}`,
    externalOwner: owner,
  };
}

/**
 * Records cleanup intent without deleting data.
 *
 * Cleanup belongs beside the data factory because both describe test-owned
 * resource lifecycle. The dry-run remains deliberately non-destructive until
 * an approved environment-specific deletion contract exists.
 */
export function cleanupDryRun(runId = process.env.QA_RUN_ID ?? 'unset'): {
  mode: 'dry-run';
  runId: string;
  deleted: number;
} {
  return { mode: 'dry-run', runId, deleted: 0 };
}
