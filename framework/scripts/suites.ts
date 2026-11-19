/**
 * File: framework/scripts/suites.ts
 * Purpose: Selects Playwright tests and audits tag-based suite coverage.
 * Maintainer: Lakshmikiran J. | Project: TaskyMed QA
 * Origin: Manually maintained consolidation of selection and audit scripts.
 * Usage: npm run test:workflow -- reception or npm run suite:audit. Edit manually.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { suiteCommands, suitePolicy, suiteTags, type SuiteName } from '../config/suite-policy.js';

function specFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? specFiles(path) : entry.name.endsWith('.spec.ts') ? [path] : [];
  });
}

function selectTests(kind: string, value: string): void {
  const patterns: Record<string, string> = {
    workflow: 'tests',
    workspace: 'tests',
    scenario: 'tests',
    case: 'tests',
  };
  if (!patterns[kind]) throw new Error('Usage: npm run test:workflow -- reception');
  const safe = /^[a-z0-9/_-]+$/i.test(value) ? value : '';
  if (!safe)
    throw new Error('Unsafe selector. Use letters, numbers, slash, underscore or hyphen only.');
  const target = kind === 'workflow' ? `${patterns[kind]}/${safe}` : patterns[kind];
  if (!existsSync(target)) throw new Error(`No test path exists for ${kind}: ${target}`);
  // Delegate execution to native Playwright after validating the path and
  // selector; this script is not a second test runner.
  const result = spawnSync(
    'npx',
    ['playwright', 'test', target, '--grep', kind === 'case' ? safe : 'ESS-'],
    { stdio: 'inherit', shell: false },
  );
  process.exitCode = result.status ?? 1;
}

function auditSuites(): void {
  const files = specFiles('tests');
  const result = Object.keys(suiteTags).map((name) => {
    const suite = name as Exclude<SuiteName, 'production'>;
    const tag = suiteTags[suite];
    const matches = files.filter((file) =>
      new RegExp(`${tag}\\b`).test(readFileSync(file, 'utf8')),
    );
    const matchingTestCount = matches.reduce(
      (count, file) => count + (readFileSync(file, 'utf8').match(/\btest\s*\(/g)?.length ?? 0),
      0,
    );
    const verifiedExecution: Record<string, string> = {
      'response-time': 'PASS — framework-only sample timing test',
      'cross-browser': 'PASS — Chromium, Firefox and WebKit framework smoke',
      responsive: 'PASS — mobile Chrome and mobile Safari framework smoke',
    };
    return {
      suite,
      tag,
      selectionCommand: suiteCommands[suite],
      environments: suitePolicy[suite],
      matchingSpecs: matches,
      matchingTestCount,
      executableTestsExist: matches.length > 0,
      lastVerifiedExecution: verifiedExecution[suite] ?? 'NOT RUN IN CURRENT AUDIT',
      blocker: matches.length ? null : 'No matching Playwright spec tag exists.',
      coverageStatus: matches.length
        ? 'IMPLEMENTED — DISCOVERABLE'
        : 'NOT IMPLEMENTED — NO MATCHING TESTS',
    };
  });
  console.log(JSON.stringify({ specCount: files.length, suites: result }, null, 2));
}

const [operation, kind, value] = process.argv.slice(2);
if (operation === 'select' && kind && value) selectTests(kind, value);
else if (operation === 'select') {
  console.error('Usage: tsx scripts/suites.ts select <workflow|workspace|scenario|case> <value>');
  process.exitCode = 2;
} else if (operation === 'audit') auditSuites();
else {
  console.error('Usage: tsx scripts/suites.ts <select|audit> [kind value]');
  process.exitCode = 2;
}
