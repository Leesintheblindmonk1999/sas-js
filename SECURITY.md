# Security Policy

## Scope

This security policy applies to `sas-js`, the Node.js / TypeScript SDK for **SAS - Symbiotic Autoprotection System**.

This repository is a client SDK. It does not host the SAS API, store server-side data, manage billing, or run the backend rate-limiting/database layer.

For backend/API vulnerabilities, use the main SAS security process:

```text
https://github.com/Leesintheblindmonk1999/SAS
```

## Supported Versions

| Version | Supported |
|---------|-----------|
| 0.1.x   | ✅ Initial SDK line once released |
| <0.1.0  | ⚠️ Pre-release scaffold, best-effort only |

## Reporting a Vulnerability

We take security seriously.

If you discover a vulnerability in this SDK, please:

**DO NOT** open a public issue with exploit details.

**DO** send a report to:

```text
duranteg2@gmail.com
```

Include:

- affected SDK version or commit hash;
- Node.js version;
- operating system;
- reproduction steps;
- whether the issue affects API key handling;
- whether the issue can leak request bodies, headers, or credentials;
- expected vs actual behavior;
- suggested fix, if available.

You can expect:

- acknowledgment within 48 hours when possible;
- follow-up during investigation;
- credit upon public disclosure, if desired.

## SDK Security Design

The SDK is designed around these rules:

| Rule | Status |
|------|--------|
| API key accepted through constructor | ✅ |
| API key accepted through `process.env.SAS_API_KEY` | ✅ |
| Optional `process.env.SAS_KEY` alias | ✅ |
| API key stored on disk by SDK | ❌ No |
| API key written to logs by SDK | ❌ No |
| API key sent in query string | ❌ No |
| API key sent to public endpoints by default | ❌ No |
| Hidden telemetry | ❌ No |
| Browser-first authenticated usage | ❌ Out of scope |
| Native `fetch` on Node.js 18+ | ✅ |
| Timeout with `AbortController` | ✅ |
| Retries disabled by default | ✅ |

## API Key Safety

Do not expose SAS API keys in browser-side code.

Recommended server-side usage:

```ts
const client = new SASClient({
  apiKey: process.env.SAS_API_KEY
});
```

Avoid:

```ts
console.log(process.env.SAS_API_KEY);
console.log(client);
console.log(headers);
```

Never place API keys in:

- query strings;
- committed source files;
- README examples with real keys;
- screenshots;
- issue reports;
- browser bundles;
- frontend environment variables.

## Environment Files

Do not commit:

```text
.env
.env.*
*.local
```

The repository may include `.env.example` as a template only.

## Dependency Security

Before publishing or releasing, run:

```bash
npm audit --omit=dev
npm run typecheck
npm test
npm run build
npm run pack:check
```

Development dependencies may report issues that do not affect the runtime package, but runtime dependencies must remain minimal and clean.

## Responsible Disclosure

We follow responsible disclosure practices.

We will:

- confirm receipt of your report when possible;
- investigate impact;
- prepare a fix or mitigation;
- disclose publicly only after a reasonable remediation window.

## Contact

Security contact:

```text
duranteg2@gmail.com
```

PGP key: available upon request.
