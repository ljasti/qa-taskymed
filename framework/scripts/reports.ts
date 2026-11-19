/**
 * File: framework/scripts/reports.ts
 * Purpose: Reads Playwright summaries and runs explicit dry-run cleanup.
 * Maintainer: Lakshmikiran J. | Project: TaskyMed QA
 * Origin: Manually maintained consolidation of reporting and cleanup commands.
 * Usage: npm run summary or npm run cleanup:dry-run. Edit manually.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { cleanupDryRun } from '../support/data.js';

function latestFile(root: string, filename: string): string | undefined {
  if (!existsSync(root)) return undefined;
  const candidates: string[] = [];
  const visit = (directory: string): void => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) visit(path);
      else if (entry.name === filename) candidates.push(path);
    }
  };
  visit(root);
  return candidates.sort((left, right) => statSync(right).mtimeMs - statSync(left).mtimeMs)[0];
}

function summary(): void {
  const file = latestFile('test-results', 'results.json') ?? 'test-results/results.json';
  // Playwright owns report generation; this command only reads its JSON output.
  if (!existsSync(file)) {
    console.log(
      JSON.stringify({ status: 'NOT RUN', reason: 'No Playwright JSON report exists.' }, null, 2),
    );
    return;
  }
  const report = JSON.parse(readFileSync(file, 'utf8')) as { stats?: Record<string, unknown> };
  console.log(
    JSON.stringify(
      { environment: process.env.QA_ENV ?? 'unset', stats: report.stats ?? {}, source: file },
      null,
      2,
    ),
  );
}

function report(): void {
  const index = latestFile('test-results', 'index.html');
  if (!index) {
    console.error('No Playwright HTML report exists. Run an authorized test first.');
    process.exitCode = 1;
    return;
  }
  const reportDirectory = index.slice(0, -'/index.html'.length);
  // Delegate report serving to Playwright so the command uses the native viewer.
  const result = spawnSync('npx', ['playwright', 'show-report', reportDirectory], {
    stdio: 'inherit',
    shell: false,
  });
  process.exitCode = result.status ?? 1;
}

function cleanup(): void {
  const dryRun = process.argv.includes('--dry-run');
  console.log(
    JSON.stringify(
      {
        ...cleanupDryRun(),
        result: dryRun
          ? 'No deletion performed; approved cleanup adapter is not configured.'
          : 'Refused: cleanup adapter requires an approved environment-specific implementation.',
      },
      null,
      2,
    ),
  );
  if (!dryRun) process.exitCode = 2;
}

const operation = process.argv[2] ?? 'summary';
if (operation === 'summary') summary();
else if (operation === 'cleanup') cleanup();
else if (operation === 'report') report();
else {
  console.error('Usage: tsx scripts/reports.ts <summary|report|cleanup> [--dry-run]');
  process.exitCode = 2;
}
