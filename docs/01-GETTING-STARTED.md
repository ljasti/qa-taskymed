# 01 — Getting started

This is the first learner document after README. It explains prerequisites, where commands run, the project map and the first safe checks.

## Prerequisites

Use VS Code connected to WSL Ubuntu. Node.js/npm and Docker are needed for local development; Git is needed for version control. Run normal commands in WSL or the VS Code WSL terminal, not an unrelated Windows shell.

```bash
# WSL Ubuntu or VS Code WSL terminal
cd /mnt/d/workdir/health-care/TASKYMED/QA-Practice
node --version
npm --version
npm ci
npm run typecheck
npm run test:unit
```

The first framework-only check does not require TaskyMed to be running. `npm run test:discover` loads the Playwright configuration and lists tests. Application tests need an approved environment, credentials and data policy.

## Learning order

Read this file, then `02-QA-FUNDAMENTALS.md`, `03-PLAYWRIGHT-TYPESCRIPT.md`, `04-TASKYMED-PRACTICAL-TESTING.md`, `06-DAILY-QA-WORKFLOW.md`, `07-QA-TERMINOLOGY-QUICK-REFERENCE.md` and finally `08-QA-INTERVIEW-QUESTIONS-ANSWERS.md`. Advanced material is in `05-ADVANCED-QA-ENGINEERING.md` and is not a beginner prerequisite.

## Actual project map

`tests/` contains Playwright specs, with Reception and Physician workflows in their own folders and cross-cutting checks at the root; `framework/pages/` contains reusable UI behavior; `framework/support/` contains fixtures, API, data/cleanup, safety and diagnostics; `framework/catalog/catalog.yaml` is the traceability source; `framework/config/` controls environments, projects and dataset manifests; `framework/scripts/` contains verification, suite and reporting commands; `docs/` contains learner guides; `artifacts/audits/` contains evidence reports; `.github/workflows/` contains CI; `Dockerfile` and `compose.yaml` contain Docker execution.

## Local URL status

The canonical human-readable local URL is `http://taskymed.local`, but it is currently UNVERIFIED: no hosts/DNS entry or listener was observed. Use the troubleshooting section in `05-ADVANCED-QA-ENGINEERING.md` before application testing. Never silently substitute a different service.
