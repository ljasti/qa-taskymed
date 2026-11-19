# Contributing to QA-Practice

Maintainer: Lakshmikiran J.
Project: TaskyMed QA
Origin: Manually maintained Markdown guidance.
Editability: Edit manually; preserve the file-header and safety conventions below.

Keep new TypeScript, JavaScript, Docker, YAML and workflow files self-documenting: add a concise header with filename, purpose, Maintainer `Lakshmikiran J.`, Project `TaskyMed QA`, truthful origin, verified generation command where applicable, usage and editability. Use “Maintainer”, not “Author”, unless authorship is explicitly established. JSON files must remain strict JSON, so document them in the README file-origin table instead.

For a new test, prefer one readable Playwright spec under the relevant workflow. Add one stable workflow/scenario/case entry to `framework/catalog/catalog.yaml` only when coverage is new. Use accessible locators, web-first assertions and synthetic data. Do not weaken safety guards, invent credentials, modify TaskyMed application repositories or claim blocked tests passed.

Before committing:

```bash
npm run typecheck
npm run lint
npm run format:check
npm run catalog:validate
npm run test:unit
QA_ENV=local QA_UI_BASE_URL=http://taskymed.local QA_API_BASE_URL=http://taskymed.local QA_TENANT_ID=ten_local QA_FACILITY_ID=fac_local_main QA_EXPECTED_APP_ID=taskymed-health-os QA_EXPECTED_ENVIRONMENT=local QA_CREDENTIAL_SCOPE=local QA_DATASET_ID=local-essential-synthetic QA_LICENSE_PROFILE=essential QA_ALLOWED_SUITES=smoke,api,regression QA_CLEANUP_POLICY=dry-run QA_REPORT_NAMESPACE=local/run npm run test:discover
```

Use `PASS`, `FAIL`, `BLOCKED` and `NOT RUN` accurately in reports. Never commit `.env`, authentication state, reports, traces or real patient data.
