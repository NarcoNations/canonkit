# Security policy

## Reporting a vulnerability

Please report security vulnerabilities privately using GitHub's **Report a vulnerability** feature under the repository Security tab. Do not open a public issue containing exploit details or sensitive repository content.

## Current security posture

The repository contains a static concept site and a local TypeScript CLI. It has no hosted application server, user accounts, data storage, telemetry, or third-party browser scripts. The CLI is repository-bounded, read-only, and network-disabled.

Repository documents and context-pack bodies are untrusted data rather than executable instructions. Pack policy defaults to public, active, governing documents; wider disclosure and historical material require explicit opt-in. Pack generation verifies repository-bounded source bytes against the validated model, removes visibility- and scope-excluded material before disclosure, enforces hard limits, and returns no partial output on failure. Markdown projection uses body-specific fences so untrusted content cannot close its own pack boundary. CLI output has a separate fixed 8 MiB ceiling and writes to standard output without modifying repository files.

## Stage 4 review

The Stage 4 acceptance review found no Critical or High severity issue inside the safe context-pack boundary. The complete evidence, including disclosure, provenance, determinism, package, dependency, browser-surface, and residual-risk checks, is recorded in [`docs/STAGE-4-ACCEPTANCE.md`](./docs/STAGE-4-ACCEPTANCE.md).

The repository-grounded model, attacker assumptions, abuse paths, risk ratings, and review focus are recorded in [`canonkit-threat-model.md`](./canonkit-threat-model.md). The proposed package identity, publishing authority, CI disclosure rules, and mandatory alpha blockers are recorded in [`docs/ALPHA-RELEASE-BOUNDARY.md`](./docs/ALPHA-RELEASE-BOUNDARY.md).

The static site has no third-party scripts or untrusted browser input. Deployment hardening remains a release-rehearsal task: current production headers include HSTS but the repository does not yet configure CSP, framing, or explicit content-type protections.
