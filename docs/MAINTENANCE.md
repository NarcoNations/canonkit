# Maintenance model

## Purpose

This document defines the minimum sustainable operating model for CanonKit as a solo-maintained open-source alpha. It does not promise response times or imply a larger team.

## Cadence

- Review security reports and failing default-branch checks as the highest priority.
- Triage public issues when maintainer capacity permits.
- Review runtime dependencies and supported Node.js versions at least once per alpha release cycle.
- Re-run the complete release rehearsal for every publication candidate.
- Record contract changes in the changelog, relevant contract document, tests, and release notes.

## Triage order

1. Suspected credential, publication, disclosure, traversal, integrity, or code-execution risk.
2. Regression that produces incorrect authority or exposes disallowed content.
3. Determinism, compatibility, packaging, or installation failure.
4. Documentation and developer-experience defects.
5. New capability proposals.

## Decision rules

- Git history and approved review remain the authority for project changes.
- Issue agreement does not promote a proposal into the product contract.
- Security and disclosure boundaries outrank convenience.
- Ambiguous authority must fail closed rather than select arbitrarily.
- New networked services, model calls, write capabilities, adapters, or dashboards require a separately approved roadmap decision.
- Examples and tests use neutral synthetic or already-public material.

## Release roles

During solo maintenance, Ashley is the accountable maintainer and publication approver. Automation may build, test, inspect, and stage an approved candidate only within the documented workflow. Automation does not grant publication authority.

If another maintainer is added, ownership, recovery, package permissions, security-report access, and publication approval must be recorded before granting write access.

## Sustainability boundary

CanonKit deliberately avoids a hosted control plane, on-call commitment, telemetry service, and broad compatibility promise. Support is best-effort until usage evidence justifies a wider maintenance commitment.
