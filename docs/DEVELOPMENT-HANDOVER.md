# CanonKit development handover

This is the durable restart guide for implementation work. It records the completed foundation, the boundaries that must remain true, and the exact next checkpoint.

## Snapshot

- **Snapshot date:** 2026-08-21
- **Baseline commit:** `bbb3e93` — Stage 4.1 pack contract and budgets merged to `main`
- **Completed:** Stages 0–3 plus Stage 4.1–4.2 pack contract and projection library
- **Completed after baseline:** Build-plan task 4.2 — pack projection library
- **Next:** Build-plan task 4.3 — pack command
- **Repository:** <https://github.com/NarcoNations/canonkit>
- **Production concept site:** <https://canonkit.vercel.app>
- **Latest release:** None; the package remains private until the public-alpha gate

`STATUS.md` owns the live checkpoint. If this handover and `STATUS.md` ever disagree, inspect current source and Git history before changing code.

## What exists now

The complete Stage 3 validation, graph, command, and resolution flow is implemented and tested:

```text
explicit path
    -> Git repository boundary
    -> stable Markdown discovery
    -> bounded UTF-8 reads
    -> strict YAML frontmatter parsing
    -> public JSON Schema validation
    -> normalised documents
    -> document policy + supersession policy
    -> one versioned validation report
    -> deterministic graph index + explainable eligibility
    -> bounded list or graph projection
    -> deterministic candidate resolution + explanation
    -> bounded terminal or JSON resolve report
```

Public package APIs:

| API | Purpose | Contract |
| --- | --- | --- |
| `parseMarkdownFrontmatter()` | Parse and validate one bounded Markdown string | [`PARSER-CONTRACT.md`](./PARSER-CONTRACT.md) |
| `discoverMarkdownFiles()` | Find eligible Markdown inside one Git boundary | [`DISCOVERY-CONTRACT.md`](./DISCOVERY-CONTRACT.md) |
| `scanRepository()` | Compose discovery, reading, parsing, and normalisation | [`COLLECTION-CONTRACT.md`](./COLLECTION-CONTRACT.md) |
| `validateDocumentPolicies()` | Validate document identity, ownership, review, authority, and visibility | [`DOCUMENT-POLICY-CONTRACT.md`](./DOCUMENT-POLICY-CONTRACT.md) |
| `validateRelationshipPolicies()` | Validate the explicit document supersession graph | [`RELATIONSHIP-POLICY-CONTRACT.md`](./RELATIONSHIP-POLICY-CONTRACT.md) |
| `buildTrustGraphIndex()` | Index validated documents and apply fail-closed eligibility | [`GRAPH-CONTRACT.md`](./GRAPH-CONTRACT.md) |
| `resolveTrustGraph()` | Select and explain a governing source without arbitrary tie-breakers | [`RESOLUTION-CONTRACT.md`](./RESOLUTION-CONTRACT.md) |
| `normalizePackPolicy()` | Normalize frozen disclosure, lifecycle, scope, and hard-budget policy | [`PACK-CONTRACT.md`](./PACK-CONTRACT.md) |
| `buildContextPack()` | Validate, filter, reverify, hash, and project an atomic context pack | [`PACK-CONTRACT.md`](./PACK-CONTRACT.md) |
| `renderContextPackJson()` | Serialize the versioned pack envelope deterministically | [`PACK-CONTRACT.md`](./PACK-CONTRACT.md) |
| `renderContextPackMarkdown()` | Serialize explicit metadata and injection-safe untrusted body boundaries | [`PACK-CONTRACT.md`](./PACK-CONTRACT.md) |

The package exposes read-only `canonkit validate`, `canonkit list`, `canonkit graph`, and `canonkit resolve` commands. Their formats and stable exit behaviour are defined in [`CLI-CONTRACT.md`](./CLI-CONTRACT.md), [`GRAPH-CLI-CONTRACT.md`](./GRAPH-CLI-CONTRACT.md), and [`RESOLVE-CLI-CONTRACT.md`](./RESOLVE-CLI-CONTRACT.md). Document and supersession rules are defined in [`DOCUMENT-POLICY-CONTRACT.md`](./DOCUMENT-POLICY-CONTRACT.md) and [`RELATIONSHIP-POLICY-CONTRACT.md`](./RELATIONSHIP-POLICY-CONTRACT.md).

The public metadata contracts are schema `1.0` and the current schema `1.1` in [`schema/`](../schema/). Version `1.1` separates document identity from explicit governed subjects, aliases, document kinds, and typed lineage. Version `1.0` remains supported without inference.

## Stage 1 guarantees

- Node.js 22 or newer, strict TypeScript, ESM, and a single package.
- No server, database, hosted control plane, telemetry, model call, or network dependency in the core.
- Read-only operation; discovery and scanning never edit repository content.
- Only `.md` and `.markdown` files inside the resolved Git boundary are eligible.
- Default dependency/generated directories, nested repositories, and traversal symlinks are excluded.
- File and document-count limits fail closed.
- YAML merge keys, duplicate keys, aliases, malformed metadata, and unsupported schema versions fail validation.
- Markdown bodies remain untrusted content and cannot promote their own authority.
- Raw metadata is retained under `reporting.rawMetadata` only; later policy must use explicit normalised fields.
- Invalid files do not hide valid neighbouring documents or other diagnostics.
- Fixtures are synthetic and contain no private or organisation-specific content.

## Validation baseline

The Stage 4.2 checkpoint passed locally while preserving the Stage 3 acceptance baseline:

- lint and strict typechecking
- 160 tests across fourteen test files at the Stage 4.2 implementation checkpoint
- declaration and source-map build
- Node.js 22 and 24 GitHub CI
- Vercel deployment check
- dependency audit with zero reported vulnerabilities
- package preview with 74 intended distributable files
- production-only packaged `canonkit resolve` run with development dependencies absent
- production-only packaged pack-projection API import with development dependencies absent
- JSON round-trip, documentation-link, and clean-room vocabulary checks

Run the standard local gate with:

```sh
npm ci
npm run check
npm audit --audit-level=high
npm pack --dry-run
```

## Completed delivery history

| PR | Checkpoint |
| --- | --- |
| [#1](https://github.com/NarcoNations/canonkit/pull/1) | Stage 0 delivery documentation |
| [#2](https://github.com/NarcoNations/canonkit/pull/2) | TypeScript package foundation |
| [#3](https://github.com/NarcoNations/canonkit/pull/3) | Supported GitHub Action runtimes |
| [#4](https://github.com/NarcoNations/canonkit/pull/4) | Public metadata contract |
| [#5](https://github.com/NarcoNations/canonkit/pull/5) | Bounded Markdown frontmatter parser |
| [#6](https://github.com/NarcoNations/canonkit/pull/6) | Repository-bounded discovery |
| [#7](https://github.com/NarcoNations/canonkit/pull/7) | Normalised collection and diagnostics |
| [#8](https://github.com/NarcoNations/canonkit/pull/8) | Stage 1 documentation and restart checkpoint |
| [#9](https://github.com/NarcoNations/canonkit/pull/9) | Stage 2.1 CLI shell |
| [#10](https://github.com/NarcoNations/canonkit/pull/10) | Stage 2.2 document model and policy rules |
| [#11](https://github.com/NarcoNations/canonkit/pull/11) | Stage 2.3 relationship rules |
| [#12](https://github.com/NarcoNations/canonkit/pull/12) | Stage 2.4 reports and Stage 2 acceptance |
| [#13](https://github.com/NarcoNations/canonkit/pull/13) | Stage 3.1 graph index and eligibility |
| [#14](https://github.com/NarcoNations/canonkit/pull/14) | Stage 3.2 list and graph commands |
| [#15](https://github.com/NarcoNations/canonkit/pull/15) | Stage 3.3 deterministic resolution rules |
| [#16](https://github.com/NarcoNations/canonkit/pull/16) | Stage 3.4 resolve command and Stage 3 acceptance |
| [#17](https://github.com/NarcoNations/canonkit/pull/17) | Stage 4.1 pack contract and budgets |

## Completed checkpoint — Stage 3.4 and Stage 3 acceptance

The dedicated `agent/stage-3-4-resolve-command` checkpoint exposes complete process resolution:

- require one explicit query and accept one optional repository path
- validate the complete collection before graph construction and resolution
- remove visibility- and scope-excluded nodes before matching
- return bounded terminal and JSON selected/rejected explanations
- fail ambiguity, lifecycle-ineligible, not-found, and validation-blocked outcomes
- preserve deterministic repetition, body exclusion, and stable exit codes

Stage 3 is complete. Context packs remain Stage 4; adapters, dashboards, hosted services, and AI inference remain outside this checkpoint.

Stage 3.4 and Stage 3 close only after:

1. Packaged-process tests prove unique, ambiguous, ineligible-only, not-found, and validation-blocked outcomes.
2. Public defaults do not expose internal matches; explicit opt-in does.
3. Repeated output is stable, bounded, and free of document bodies.
4. Run the standard quality, audit, and package gates.
5. Update durable contracts and handover documents to point to Stage 4.2.

## Completed checkpoint — Stage 4.1

The versioned safe context-pack envelope, item provenance, result failures, audience disclosure ceiling, visibility and lifecycle rules, exact scope, document budget, exact UTF-8 body-byte budget, explicit non-active opt-in, and atomic fail-closed overflow semantics are locked in [`PACK-CONTRACT.md`](./PACK-CONTRACT.md). Pack generation has deliberately not been added yet.

## Completed checkpoint — Stage 4.2

The projection library now validates the complete collection and policy graph, filters before disclosure, enforces complete-selection budgets, revalidates repository-bounded sources against their normalized entries, hashes exact bytes, and emits stable JSON or injection-safe Markdown. Every failure remains atomic.

## Exact next checkpoint — Stage 4.3

Expose the existing projection library through `canonkit pack`. Define CLI arguments for audience, exact scope, explicit non-active statuses, document and content-byte budgets, plus Markdown and JSON formats. Preserve stable failure codes and exits without duplicating projection policy. Do not add adapters, hosted services, or private project knowledge.

## Remaining route to the OSS application

1. Stage 4 — fail-closed, provenance-backed context packs.
2. Stage 5 — installable npm public alpha, threat model, CI example, and release evidence.
3. Stage 6 — external feedback, usage evidence, maintenance cadence, and Vercel OSS application pack.

Stage 4 is expected to be the most implementation-intensive remaining stage. Stage 6 requires the most elapsed real-world time because credible adoption evidence cannot be manufactured by implementation alone.

## Source map

```text
src/discovery/       repository boundary and Markdown discovery
src/metadata/        frontmatter and public-schema validation
src/model/           normalised collection and unified diagnostics
src/policy/          deterministic document and relationship policy
src/graph/           deterministic graph index and fail-closed eligibility
src/resolution/      deterministic candidate selection and explanations
src/pack/            context-pack contract, policy, and projection
schema/              versioned public metadata contract
fixtures/            synthetic contract, parser, discovery, and collection cases
test/                unit and integration coverage
docs/                public contracts and development continuity
public/              static product concept site
```

Continue to use one bounded branch and one pull request per build-plan checkpoint. Stage exact files, preserve unrelated worktree content, and make completion claims only after local and GitHub checks finish.
