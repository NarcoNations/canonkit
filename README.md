# CanonKit

Make repository knowledge trustworthy.

CanonKit is a local-first trust layer for repository documentation. It is designed to help people and AI agents determine which documents are current, authoritative, owned, superseded, and safe to use.

This repository currently contains the public concept site and the clean-room boundary for the planned v0.1 CLI.

## Principles

- Local-first and offline-capable
- Deterministic rules before model judgement
- Human-controlled promotion to canonical status
- Explicit authority, lifecycle, ownership, visibility, and provenance
- No document uploads or hosted service required for the core

## Planned v0.1

- Neutral Markdown frontmatter contract and JSON Schema
- `init`, `validate`, `list`, `resolve`, `graph`, and `pack` commands
- Duplicate-authority, broken-reference, review-date, and supersession-cycle checks
- Human-readable, JSON, and Markdown context-pack outputs
- CI example, threat model, and synthetic fixtures

See the [concept site](./index.html) for the product explanation, extraction audit, architecture, security model, scope, and roadmap.

## Project documentation

- [Current status and exact resume point](./STATUS.md)
- [Staged roadmap and acceptance gates](./ROADMAP.md)
- [Architecture and decisions](./ARCHITECTURE.md)
- [Ordered build plan](./BUILD-PLAN.md)
- [Changelog](./CHANGELOG.md)
- [Code of Conduct](./CODE_OF_CONDUCT.md)

## Clean-room boundary

CanonKit is an independent implementation of generic documentation-governance concepts. It does not contain private source documents, customer material, internal application code, database schemas, credentials, proprietary project rules, or private operating playbooks.

See [docs/EXTRACTION-BOUNDARY.md](./docs/EXTRACTION-BOUNDARY.md).

## Development

The concept site has no build step. Open `index.html` directly or serve the repository with any static file server.

The Stage 1 TypeScript foundation requires Node.js 22 or newer:

```sh
npm ci
npm run check
```

`npm run check` runs lint, strict typechecking, unit tests, and the declaration/source-map build.

## Status

Stage 1 is in progress. The package foundation is implemented; the public metadata schema and CLI are not. See [STATUS.md](./STATUS.md) for the exact current state and next task.

## Licence

[MIT](./LICENSE)
