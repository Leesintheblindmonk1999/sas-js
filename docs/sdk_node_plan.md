# SAS Node SDK Technical Specification

This repository implements the Node.js / TypeScript SDK described by the SAS main repository:

```text
SAS/docs/sdk_node_plan.md
```

The implementation target is v0.1.0 with these 12 methods:

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

Excluded from v0.1.0:

```text
chat
billing
admin
dashboard helpers
```

Security constraints:

```text
No API key storage.
No API key logs.
No hidden telemetry.
No browser-first authenticated usage.
Retries disabled by default.
```

See the main SAS repository for the canonical spec:
https://github.com/Leesintheblindmonk1999/SAS


Implementation audit fixes applied in this scaffold:

```text
- TypeScript-safe error classes.
- Build-only tsconfig for package typecheck.
- Public endpoints strip X-API-Key.
- Auth endpoints use constructor/env API key as canonical.
- Retry-After delay capped by maxRetryDelayMs, default 30s.
- Additional tests for SAS_KEY, auth errors, server errors, query params.
```


Additional final DeepSeek audit improvements applied:

```text
- LICENSE file clarified with GPL-3.0-or-later notice.
- User-Agent header added: sas-node-sdk/0.1.0.
- Retry defaults for opt-in retry use transient 5xx statuses.
- Retry-After delay is capped by maxRetryDelayMs, default 30s.
- Timeout unit test added for SASTimeoutError.
- README documents retry behavior and interaction stability feature flag.
```
