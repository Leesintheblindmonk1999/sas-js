# SAS Node SDK

Node.js / TypeScript SDK for **SAS - Symbiotic Autoprotection System**.

This package is the planned JavaScript/TypeScript client for the SAS hosted API and self-hosted SAS deployments.

> Status: initial I1 scaffold. Not published to npm yet.

## Install

After publication:

```bash
npm install @sas-audit/sdk
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
import { SASClient } from "@sas-audit/sdk";

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
import { SASClient } from "@sas-audit/sdk";

const client = new SASClient();

const result = await client.demoAudit({
  source: "The Eiffel Tower is located in Paris, France.",
  response: "The Eiffel Tower is located in Berlin, Germany."
});

console.log(result);
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

GPL-3.0-or-later. See `LICENSE`.


## Publish safety

Do not publish until all checks pass:

```bash
npm run typecheck
npm test
npm run build
npm run pack:check
npm audit --omit=dev
```

`@sas-audit/sdk` requires npm scope availability. If the scope is unavailable, use the fallback package name `sas-audit-client`.


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
