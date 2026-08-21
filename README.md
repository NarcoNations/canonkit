# CanonKit

Make repository knowledge trustworthy.

CanonKit is a local-first trust layer for repository documentation. It is designed to help people and AI agents determine which documents are current, authoritative, owned, superseded, and safe to use.

This repository contains the public concept site and the clean-room implementation of the planned v0.1 CLI.

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

See the [concept site](./public/index.html) for the product explanation, extraction audit, architecture, security model, scope, and roadmap.

## Project documentation

- [Current status and exact resume point](./STATUS.md)
- [Staged roadmap and acceptance gates](./ROADMAP.md)
- [Architecture and decisions](./ARCHITECTURE.md)
- [Ordered build plan](./BUILD-PLAN.md)
- [Changelog](./CHANGELOG.md)
- [Code of Conduct](./CODE_OF_CONDUCT.md)
- [Public metadata contract](./schema/README.md)
- [Frontmatter parser contract](./docs/PARSER-CONTRACT.md)
- [Repository discovery contract](./docs/DISCOVERY-CONTRACT.md)
- [Normalised collection contract](./docs/COLLECTION-CONTRACT.md)
- [Document policy contract](./docs/DOCUMENT-POLICY-CONTRACT.md)
- [Validate CLI contract](./docs/CLI-CONTRACT.md)
- [Development handover and exact restart point](./docs/DEVELOPMENT-HANDOVER.md)

## Clean-room boundary

CanonKit is an independent implementation of generic documentation-governance concepts. It does not contain private source documents, customer material, internal application code, database schemas, credentials, proprietary project rules, or private operating playbooks.

See [docs/EXTRACTION-BOUNDARY.md](./docs/EXTRACTION-BOUNDARY.md).

## Development

The concept site has no build step. Open `public/index.html` directly or serve `public/` with any static file server.

The TypeScript package requires Node.js 22 or newer:

```sh
npm ci
npm run check
```

`npm run check` runs lint, strict typechecking, unit tests, and the declaration/source-map build.

The Stage 1.3 parser is available from the package root:

```ts
import { parseMarkdownFrontmatter } from 'canonkit';

const result = parseMarkdownFrontmatter(markdown, {
  path: 'docs/architecture.md',
});
```

It returns either a parsed metadata/body document or stable diagnostics. See the [parser contract](./docs/PARSER-CONTRACT.md) for the full boundary.

Bounded repository discovery is also available:

```ts
import { discoverMarkdownFiles } from 'canonkit';

const result = await discoverMarkdownFiles('./docs');
```

See the [discovery contract](./docs/DISCOVERY-CONTRACT.md) for exclusions, limits, path rules, and diagnostics.

Discovery and parsing can be composed into a stable collection:

```ts
import { scanRepository } from 'canonkit';

const collection = await scanRepository('./docs');
```

See the [collection contract](./docs/COLLECTION-CONTRACT.md) for normalised documents, unified diagnostics, and summary counts.

The Stage 2 CLI validates that collection through a read-only command:

```sh
canonkit validate [path]
canonkit validate [path] --format json
```

The command reports schema, parsing, discovery, read, and deterministic document-policy failures. See the [document policy](./docs/DOCUMENT-POLICY-CONTRACT.md) and [CLI](./docs/CLI-CONTRACT.md) contracts for rules, formats, and exit codes.

## Status

Stage 1 and Stage 2.2 are complete. The versioned schema, bounded parser, repository discovery, normalised collection, executable boundary, and document-policy rules are implemented; relationship validation is next. See [STATUS.md](./STATUS.md) for the exact current state and next task.

## Licence

[MIT](./LICENSE)
