/**
 * File: framework/scripts/verify.ts
 * Purpose: Provides environment verification and catalog validation commands.
 * Maintainer: Lakshmikiran J. | Project: TaskyMed QA
 * Origin: Manually maintained consolidation of the former verification scripts.
 * Usage: npm run verify:config or npm run catalog:validate. Edit manually.
 */
import { existsSync, readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { loadConfig } from '../config/environments.js';
import { suitePolicy } from '../config/suite-policy.js';

function verifyEnvironment(): void {
  // loadConfig performs fail-closed checks; this command prints only metadata
  // so a human can confirm the selected non-secret execution context.
  const config = loadConfig();
  console.log(
    JSON.stringify(
      {
        environment: config.environment,
        uiBaseUrl: config.uiBaseUrl,
        apiBaseUrl: config.apiBaseUrl,
        tenantId: config.tenantId,
        facilityId: config.facilityId,
        expectedAppId: config.expectedAppId,
        expectedEnvironment: config.expectedEnvironment,
        credentialScope: config.credentialScope,
        datasetId: config.datasetId,
        licenseProfile: config.licenseProfile,
        allowedSuites: config.allowedSuites,
        cleanupPolicy: config.cleanupPolicy,
        reportNamespace: config.reportNamespace,
        configSource: config.configSource,
        datasetAvailable: config.datasetManifest.available,
        licenseFixture: config.datasetManifest.licenseFixture,
        stateChanges: config.allowStateChanges,
        syntheticData: config.allowSyntheticData,
        productionFailClosed: config.production,
      },
      null,
      2,
    ),
  );
}

function validateCatalog(): void {
  // Catalog validation checks stable IDs, parent references, suite policy and
  // executable files before coverage is reported as valid.
  const catalog = parse(
    readFileSync(new URL('../catalog/catalog.yaml', import.meta.url), 'utf8'),
  ) as Record<string, unknown>;
  const workflows = catalog.workflows as Array<{ id: string }>;
  const scenarios = catalog.scenarios as Array<{ id: string; workflowId: string }>;
  const cases = catalog.testCases as Array<{
    id: string;
    scenarioId: string;
    automatedFile: string;
  }>;
  const suiteMapping = catalog.suiteMapping as Record<string, string[]>;
  const duplicate = (items: string[]) => items.filter((id, i) => items.indexOf(id) !== i);
  const errors = [
    ...duplicate(workflows.map((x) => x.id)).map((x) => `duplicate workflow ${x}`),
    ...duplicate(scenarios.map((x) => x.id)).map((x) => `duplicate scenario ${x}`),
    ...duplicate(cases.map((x) => x.id)).map((x) => `duplicate case ${x}`),
  ];
  const workflowIds = new Set(workflows.map((x) => x.id));
  const scenarioIds = new Set(scenarios.map((x) => x.id));

  for (const scenario of scenarios) {
    if (!workflowIds.has(scenario.workflowId)) {
      errors.push(`${scenario.id} references unknown workflow ${scenario.workflowId}`);
    }
  }
  for (const testCase of cases) {
    if (!scenarioIds.has(testCase.scenarioId)) {
      errors.push(`${testCase.id} references unknown scenario ${testCase.scenarioId}`);
    }
    if (!existsSync(new URL(`../../${testCase.automatedFile}`, import.meta.url))) {
      errors.push(`${testCase.id} has no executable file ${testCase.automatedFile}`);
    }
  }
  for (const suite of Object.keys(suiteMapping)) {
    if (!(suite in suitePolicy)) errors.push(`suite ${suite} has no environment policy`);
  }
  if (errors.length) {
    console.error(errors.join('\n'));
    process.exitCode = 1;
    return;
  }
  console.log(
    `Catalog valid: ${workflows.length} workflows, ${scenarios.length} scenarios, ${cases.length} test cases.`,
  );
}

const command = process.argv[2] ?? 'environment';
if (command === 'environment') verifyEnvironment();
else if (command === 'catalog') validateCatalog();
else {
  console.error('Usage: tsx scripts/verify.ts <environment|catalog>');
  process.exitCode = 2;
}
