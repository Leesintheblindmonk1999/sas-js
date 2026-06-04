# Contributing to sas-js

Thank you for your interest in improving **sas-js**, the Node.js / TypeScript SDK for **SAS - Symbiotic Autoprotection System**.

This SDK provides a typed client for the SAS hosted API and compatible self-hosted SAS deployments.

## Code of Conduct

By participating in this project, you agree to follow our [Code of Conduct](CODE_OF_CONDUCT.md).

## Project Scope

This repository is for the Node.js / TypeScript SDK only.

In scope:

- TypeScript client implementation;
- request/response types;
- error classes;
- retry behavior;
- Node.js examples;
- unit tests;
- integration tests;
- SDK documentation.

Out of scope for v0.1.x:

- backend API changes;
- billing endpoints;
- admin endpoints;
- chat endpoint;
- dashboard UI;
- browser-first authenticated usage;
- hidden telemetry;
- local API key storage.

For backend changes, use the main SAS repository:

```text
https://github.com/Leesintheblindmonk1999/SAS
```

## Development Setup

Clone the repository:

```bash
git clone https://github.com/Leesintheblindmonk1999/sas-js.git
cd sas-js
```

Install dependencies:

```bash
npm install
```

Run checks:

```bash
npm run typecheck
npm test
npm run build
npm run pack:check
```

Run a public example after build:

```bash
node examples/health.mjs
```

Run authenticated examples:

```bash
SAS_API_KEY=sas_xxxxxxxxxxxxxxxxxxxxx node examples/whoami.mjs
SAS_API_KEY=sas_xxxxxxxxxxxxxxxxxxxxx node examples/diff.mjs
SAS_API_KEY=sas_xxxxxxxxxxxxxxxxxxxxx node examples/batch.mjs
```

On Windows PowerShell:

```powershell
$env:SAS_API_KEY="sas_xxxxxxxxxxxxxxxxxxxxx"

node examples/whoami.mjs
node examples/diff.mjs
```

## Testing

Unit tests:

```bash
npm test
```

Integration tests are opt-in and require a real API key:

```bash
SAS_API_KEY=sas_xxxxxxxxxxxxxxxxxxxxx npm run test:integration
```

Integration tests must:

- avoid excessive request volume;
- never print API keys;
- skip automatically when `SAS_API_KEY` is missing;
- use safe demo payloads.

## Code Style

Guidelines:

- Use TypeScript strict mode.
- Avoid unnecessary `any`.
- Prefer `unknown` for untrusted response bodies.
- Export public types intentionally.
- Do not export internal snake_case mapping types unless needed.
- Keep `SASClient` behavior faithful to the backend API.
- Keep request mappings explicit.
- Keep errors catchable with `instanceof`.
- Keep public endpoints free of `X-API-Key`.
- Keep authenticated endpoints using `X-API-Key` from constructor/env only.
- Do not add hidden telemetry.
- Do not store API keys.
- Do not log API keys.
- Do not mutate `process.env`.

## Pull Requests

Before opening a pull request:

1. Fork the repository.
2. Create a branch:

```bash
git checkout -b fix/short-description
```

3. Make your changes.
4. Run:

```bash
npm run typecheck
npm test
npm run build
npm run pack:check
```

5. Commit with a clear message:

```bash
git commit -m "fix: correct retry handling"
```

6. Push and open a pull request.

## Commit Style

Recommended prefixes:

```text
feat:
fix:
docs:
test:
refactor:
chore:
security:
```

Examples:

```text
feat: add public interaction stats method
fix: prevent API key header on public endpoints
test: cover timeout handling
docs: document retry configuration
```

## Core Integrity Rules

Do not change the following without explicit discussion:

- endpoint paths;
- public method names;
- `diff()` mapping from `textA/textB` to `text_a/text_b`;
- `interactionStability()` mapping from `kappaD` to `kappa_d`;
- `interactionStability()` mapping from `normalizeDemand` to `normalize_demand`;
- retry disabled by default;
- public endpoints without API key;
- no `domain` field in `diff()`, `audit()`, or `batch()` for v0.1.x;
- exclusion of chat, billing, and admin from v0.1.x;
- attribution to Gonzalo Emir Durante and SAS.

## Security Contributions

For security vulnerabilities, do not open a public issue with exploit details.

Email:

```text
duranteg2@gmail.com
```

See [SECURITY.md](SECURITY.md).

## License

By contributing, you agree that your contributions are licensed under:

```text
GPL-3.0-or-later + Durante Invariance attribution requirements
```

The Durante Invariance attribution requirements apply to the SAS ecosystem and the use of `κD = 0.56` as part of the SAS standard candidate.
