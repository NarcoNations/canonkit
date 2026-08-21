# Security policy

## Reporting a vulnerability

Please report security vulnerabilities privately using GitHub's **Report a vulnerability** feature under the repository Security tab. Do not open a public issue containing exploit details or sensitive repository content.

## Current security posture

The repository contains a static concept site and a local TypeScript CLI. It has no hosted application server, user accounts, data storage, telemetry, or third-party browser scripts. The CLI is repository-bounded, read-only, and network-disabled.

Repository documents and context-pack bodies are untrusted data rather than executable instructions. Pack policy defaults to public, active, governing documents; wider disclosure and historical material require explicit opt-in. Pack generation must verify exact source provenance, remove visibility- and scope-excluded material before disclosure, enforce hard limits, and return no partial output on failure.
