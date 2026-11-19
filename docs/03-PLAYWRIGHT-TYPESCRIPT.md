# 03 — Playwright and TypeScript

Node.js runs JavaScript tools; npm installs packages. TypeScript checks types before execution. Playwright Test provides `test`, `expect`, projects, fixtures, retries, traces, screenshots, videos and reporters.

## The execution model

`playwright.config.ts` loads `framework/config/environments.ts` and `framework/config/browsers.ts`, then Playwright selects a `.spec.ts`. The spec consumes `framework/support/test.ts`; the fixture supplies validated config and an API client. A Page Object or API helper talks to TaskyMed, an assertion checks the expected outcome, cleanup stays test-owned, and built-in reporters create evidence.

## Core concepts

- Browser is the engine; context is an isolated session; page is a tab.
- A locator describes a control; prefer roles, labels and stable test IDs.
- An assertion expresses business evidence and auto-waits for the expected state.
- A fixture is prepared test input; `test.extend()` adds reusable setup.
- A Page Object owns reusable UI behavior, not every individual control.
- `APIRequestContext` supports API checks and approved setup.
- Projects select Chromium, Firefox, WebKit, mobile and tablet configurations.

## TypeScript used here

Read `framework/support/data.ts` for a type alias and factory, `framework/support/api.ts` for a class, and `framework/support/test.ts` for imports/exports and a typed fixture. `async/await` makes browser/API operations readable. TypeScript types do not validate arbitrary JSON returned by a server; runtime validation is a separate concern.

## Debugging commands

```bash
npm run test:discover
npm run test:debug
npm run test:ui
npm run test:last-failed
npm run test:report
npm run trace
```

Do not add arbitrary waits to hide a race. Inspect locators, missing awaits, data isolation, auth expiry, network errors and the trace instead. The complete walkthrough is in `04-TASKYMED-PRACTICAL-TESTING.md` and the test files under `tests/reception/`.
