# SAS Node SDK

![CI](https://github.com/Leesintheblindmonk1999/sas-js/actions/workflows/ci.yml/badge.svg)
[![npm](https://img.shields.io/npm/v/sas-audit-client?style=for-the-badge)](https://www.npmjs.com/package/sas-audit-client)
[![License](https://img.shields.io/badge/License-GPL--3.0%20%2B%20Durante%20Invariance-purple?style=for-the-badge)](LICENSE)
[![DOI](https://img.shields.io/badge/DOI-10.5281%2Fzenodo.19702379-blue?style=for-the-badge)](https://doi.org/10.5281/zenodo.19702379)
[![Qeios](https://img.shields.io/badge/Qeios-10.32388%2FT420IV-purple?style=for-the-badge)](https://www.qeios.com/read/T420IV)

Node.js / TypeScript SDK for **SAS - Symbiotic Autoprotection System**.

**κD = 0.56 · κR = 0.15** — Structural Coherence Auditing for Generative AI.

This package is the official JavaScript/TypeScript client for the SAS hosted API and self-hosted SAS deployments. Published on npm as `sas-audit-client`.

## Naming

Repository: sas-js
npm package: sas-audit-client
Exported class: SASClient

## Install

After publication:

```bash
npm install sas-audit-client
```

For local development:

```bash
npm install
npm run typecheck
npm test
npm run build
```

## Requirements

```text
Node.js 18+
TypeScript-first
Native fetch
No hidden telemetry
No API key storage
```

## Quick start

```ts
import { SASClient } from "sas-audit-client";

const client = new SASClient({
  apiKey: process.env.SAS_API_KEY
});

const result = await client.diff({
  textA: "Paris is in France.",
  textB: "Paris is in Germany.",
  experimental: true
});

console.log(result.verdict);
console.log(result.isi);
```

## Public demo without API key

```ts
import { SASClient } from "sas-audit-client";

const client = new SASClient();

const result = await client.demoAudit({
  source: "The Eiffel Tower is located in Paris, France.",
  response: "The Eiffel Tower is located in Berlin, Germany."
});

console.log(result);
```

## Tribunal classification (v0.2.0+)

The **SAS Multimetric Tribunal v1.1.0** classifies (source, response) pairs into 3 structural zones using 7 detection modules with cascading multiplicative penalty, plus an optional R3.1 Differential Guard (F1 0.833 ± 0.0055 on held-out data).

```ts
import { SASClient } from "sas-audit-client";

const client = new SASClient({
  apiKey: process.env.SAS_API_KEY
});

const result = await client.tribunal({
  source: "The Eiffel Tower is located in Paris, France.",
  response: "The Eiffel Tower is located in Berlin, Germany.",
});

console.log(result.zona);       // e.g. "RUPTURA_RECUPERABLE"
console.log(result.isi_final);  // e.g. 0.49
console.log(result.codigo_zona);// e.g. "B"
console.log(result.modulos_disparados);
```

Optional parameters:

```ts
const result = await client.tribunal({
  source: "...",
  response: "...",
  enableR3_1: false,   // Disable R3.1 Differential Guard
  kappaD: 0.50,        // Override κD threshold
  kappaR: 0.10,        // Override κR threshold
});
```

## Methods

```text
health()
readyz()
demoAudit()
whoami()
diff()
audit()
batch()
tribunal()          # v0.2.0 — SAS Multimetric Tribunal v1.1.0
publicStats()
publicActivity()
publicInteractionStats()
interactionStability()
interactionStabilityExample()
```

## Examples

Examples import from `dist`, so build first:

```bash
npm run build
node examples/health.mjs
```

Authenticated examples require `SAS_API_KEY`:

```bash
SAS_API_KEY=sas_xxxxxxxxxxxxxxxxxxxxx node examples/whoami.mjs
SAS_API_KEY=sas_xxxxxxxxxxxxxxxxxxxxx node examples/diff.mjs
SAS_API_KEY=sas_xxxxxxxxxxxxxxxxxxxxx node examples/batch.mjs
SAS_API_KEY=sas_xxxxxxxxxxxxxxxxxxxxx node examples/tribunal.mjs
```

## Tests

```bash
npm test
```

Integration tests are opt-in:

```bash
SAS_API_KEY=sas_xxxxxxxxxxxxxxxxxxxxx npm run test:integration
```

## Security notes

- Do not expose SAS API keys in browser-side code.
- Do not log `process.env.SAS_API_KEY`.
- Do not put API keys in query strings.
- Use authenticated methods from trusted server-side Node.js environments.
- Public endpoints do not send `X-API-Key` by default.

## License

GPL-3.0-or-later + Durante Invariance License. See `LICENSE`.


## Publish safety

Do not publish until all checks pass:

```bash
npm run typecheck
npm test
npm run build
npm run pack:check
npm audit --omit=dev
```

`sas-audit-client` requires npm scope availability. If the scope is unavailable, use the fallback package name `sas-audit-client`.


## Retry configuration

Retries are disabled by default.

```ts
const client = new SASClient({
  retry: false
});
```

To enable retries, pass an explicit configuration:

```ts
const client = new SASClient({
  apiKey: process.env.SAS_API_KEY,
  retry: {
    attempts: 2,
    backoffMs: 500,
    respectRetryAfter: true,
    maxRetryDelayMs: 30_000
  }
});
```

When retry is enabled and `retryOnStatuses` is omitted, the SDK retries transient
server errors by default:

```text
500, 502, 503, 504
```

HTTP errors are never retried unless retry is explicitly enabled. Validation and
authentication errors are not retried.

## Interaction stability example

`interactionStabilityExample()` calls:

```text
GET /v1/interaction/stability/example
```

This endpoint is feature-flag controlled by the backend. If the feature is
disabled, the API may return `503`, which the SDK exposes as `SASServerError`.

## License

This package is distributed under GPL-3.0-or-later. See `LICENSE`.

The SDK is part of the SAS ecosystem and is intended to remain compatible with
the attribution model of the main SAS repository.
