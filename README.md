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
- [Relationship policy contract](./docs/RELATIONSHIP-POLICY-CONTRACT.md)
- [Trust graph index contract](./docs/GRAPH-CONTRACT.md)
- [Validate CLI contract](./docs/CLI-CONTRACT.md)
- [List and graph CLI contract](./docs/GRAPH-CLI-CONTRACT.md)
- [Deterministic resolution contract](./docs/RESOLUTION-CONTRACT.md)
- [Resolve CLI contract](./docs/RESOLVE-CLI-CONTRACT.md)
- [Safe context-pack contract](./docs/PACK-CONTRACT.md)
- [Pack CLI contract](./docs/PACK-CLI-CONTRACT.md)
- [Stage 4 acceptance evidence](./docs/STAGE-4-ACCEPTANCE.md)
- [Repository-grounded threat model](./canonkit-threat-model.md)
- [Public-alpha release boundary](./docs/ALPHA-RELEASE-BOUNDARY.md)
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
canonkit validate [path] --quiet
```

The command reports schema, parsing, discovery, read, document-policy, and supersession-relationship failures through one normalized report. Quiet mode suppresses only completely clean runs. See the [document policy](./docs/DOCUMENT-POLICY-CONTRACT.md), [relationship policy](./docs/RELATIONSHIP-POLICY-CONTRACT.md), and [CLI](./docs/CLI-CONTRACT.md) contracts for rules, formats, and exit codes.

Validated documents can be projected into a deterministic in-memory graph:

```ts
import { buildTrustGraphIndex } from 'canonkit';

const graph = buildTrustGraphIndex(collection.documents);
```

The graph indexes identities, versions, subjects, supersession, and explicit relations while applying public-only fail-closed eligibility by default. See the [graph contract](./docs/GRAPH-CONTRACT.md).

Validated repositories can be inspected through bounded, read-only projections:

```sh
canonkit list [path] --format json
canonkit graph [path] --format json
canonkit graph [path] --allow-visibility public --allow-visibility internal
canonkit graph [path] --scope products/example --limit 50
```

Both commands default to public-only metadata, exclude bodies, and refuse partial graph output when validation fails. See the [list and graph CLI contract](./docs/GRAPH-CLI-CONTRACT.md).

Library callers can deterministically select and explain a governing source from that graph:

```ts
import { resolveTrustGraph } from 'canonkit';

const resolution = resolveTrustGraph(graph, 'products/example');
```

Resolution considers explicit subjects, document identities, and aliases; ranks eligible candidates through declared policy; and returns no winner for an equal top-rank tie. See the [resolution contract](./docs/RESOLUTION-CONTRACT.md).

The complete flow is available through the packaged CLI:

```sh
canonkit resolve products/example [path]
canonkit resolve products/example [path] --format json --limit 50
canonkit resolve products/example [path] --allow-visibility public --allow-visibility internal
```

Only a unique permitted result exits successfully. Ambiguity, ineligible-only matches, no match, and invalid repositories fail closed. See the [resolve CLI contract](./docs/RESOLVE-CLI-CONTRACT.md).

The Stage 4 pack policy can be normalized before pack construction:

```ts
import { normalizePackPolicy } from 'canonkit';

const policy = normalizePackPolicy({
  audience: 'public',
  maxDocuments: 20,
  maxContentBytes: 128 * 1024,
});
```

Build and render a pack from a scanned collection:

```ts
import {
  buildContextPack,
  renderContextPackJson,
  renderContextPackMarkdown,
  scanRepository,
} from 'canonkit';

const collection = await scanRepository('./docs');
const result = await buildContextPack(collection, {
  audience: 'public',
  maxDocuments: 20,
  maxContentBytes: 128 * 1024,
});

if (result.ok) {
  const json = renderContextPackJson(result.pack);
  const markdown = renderContextPackMarkdown(result.pack);
}
```

Construction revalidates the complete policy graph and exact selected source bytes, then fails atomically on validation, disclosure, provenance, or budget errors. See the [safe context-pack contract](./docs/PACK-CONTRACT.md).

The same projection is available through the read-only CLI:

```sh
canonkit pack [path]
canonkit pack [path] --format json
canonkit pack [path] --audience internal --include-status superseded
canonkit pack [path] --scope products/example --max-documents 20 --max-content-bytes 131072
```

Markdown and public-only active governing content are the defaults. Wider audience and every non-active lifecycle require explicit options. See the [pack CLI contract](./docs/PACK-CLI-CONTRACT.md).

## Status

Stages 1–4 and Stage 5.1 are complete. Stage 5.2 aggregate input safety, installation guidance, and a public-only CI example are next. The package remains private and unpublished. See [STATUS.md](./STATUS.md) for the exact current state and next task.

## Licence

[MIT](./LICENSE)
