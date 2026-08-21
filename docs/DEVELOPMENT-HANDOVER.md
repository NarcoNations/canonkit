# CanonKit development handover

This is the durable restart guide for implementation work. It records the completed foundation, the boundaries that must remain true, and the exact next checkpoint.

## Snapshot

- **Snapshot date:** 2026-08-21
- **Baseline commit:** `8c440bb` — Stage 5.3 non-publishing rehearsal merged to `main`
- **Completed:** Stages 0–4, Stage 5.1 threat model/release boundary, Stage 5.2 installation/CI usage, the Stage 5.3 package-identity checkpoint, and the safe non-publishing rehearsal
- **Completed after baseline:** Ubuntu/macOS and Node.js 22/24 evidence recorded from protected-main run 32510120043; account-independent community and publication preparation
- **Next:** Pause until Ashley is ready to establish the npm organisation, recovery boundary, and protected trusted publishing
- **Repository:** <https://github.com/NarcoNations/canonkit>
- **Production concept site:** <https://canonkit.vercel.app>
- **Latest release:** None; the package remains private until the public-alpha gate

`STATUS.md` owns the live checkpoint. If this handover and `STATUS.md` ever disagree, inspect current source and Git history before changing code.

## What exists now

The complete validation, graph, resolution, and safe context-pack flow is implemented and tested:

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
    -> disclosure-safe source selection + integrity verification
    -> bounded provenance-backed Markdown or JSON context pack
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

The package exposes read-only `canonkit validate`, `canonkit list`, `canonkit graph`, `canonkit resolve`, and `canonkit pack` commands. Their formats and stable exit behaviour are defined in [`CLI-CONTRACT.md`](./CLI-CONTRACT.md), [`GRAPH-CLI-CONTRACT.md`](./GRAPH-CLI-CONTRACT.md), [`RESOLVE-CLI-CONTRACT.md`](./RESOLVE-CLI-CONTRACT.md), and [`PACK-CLI-CONTRACT.md`](./PACK-CLI-CONTRACT.md). Document and supersession rules are defined in [`DOCUMENT-POLICY-CONTRACT.md`](./DOCUMENT-POLICY-CONTRACT.md) and [`RELATIONSHIP-POLICY-CONTRACT.md`](./RELATIONSHIP-POLICY-CONTRACT.md).

The public metadata contracts are schema `1.0` and the current schema `1.1` in [`schema/`](../schema/). Version `1.1` separates document identity from explicit governed subjects, aliases, document kinds, and typed lineage. Version `1.0` remains supported without inference.

## Stage 1 guarantees

- Node.js 22 or newer, strict TypeScript, ESM, and a single package.
- No server, database, hosted control plane, telemetry, model call, or network dependency in the core.
- Read-only operation; discovery and scanning never edit repository content.
- Only `.md` and `.markdown` files inside the resolved Git boundary are eligible.
- Default dependency/generated directories, nested repositories, and traversal symlinks are excluded.
- Per-file, document-count, and default 32 MiB aggregate repository-byte limits fail closed; callers cannot exceed the 256 MiB hard aggregate ceiling.
- YAML merge keys, duplicate keys, aliases, malformed metadata, and unsupported schema versions fail validation.
- Markdown bodies remain untrusted content and cannot promote their own authority.
- Raw metadata is retained under `reporting.rawMetadata` only; later policy must use explicit normalised fields.
- Invalid files do not hide valid neighbouring documents or other diagnostics.
- Fixtures are synthetic and contain no private or organisation-specific content.

## Validation baseline

The Stage 4.4 acceptance checkpoint passed locally while preserving every earlier acceptance baseline:

- lint and strict typechecking
- 188 tests across seventeen test files
- declaration and source-map build
- Node.js 22 and 24 GitHub CI
- Vercel deployment check
- dependency audit with zero reported vulnerabilities
- package preview with 78 intended distributable files
- historical clean local installation and execution of the transitional `@narconations/canonkit@0.1.0-alpha.0` Stage 5.2 tarball
- clean local installation and execution of the selected private `@vibelabz/canonkit@0.1.0-alpha.0` candidate tarball
- locked 78-file unpacked-content manifest reproduced by the non-publishing rehearsal
- production-only packaged `canonkit resolve` run with development dependencies absent
- production-only packaged pack-projection API import with development dependencies absent
- production-only packaged `canonkit pack` Markdown and JSON runs with development dependencies absent
- JSON round-trip, documentation-link, and clean-room vocabulary checks
- consolidated Stage 4 acceptance evidence in [`STAGE-4-ACCEPTANCE.md`](./STAGE-4-ACCEPTANCE.md)

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
| [#18](https://github.com/NarcoNations/canonkit/pull/18) | Stage 4.2 pack projection library |
| [#19](https://github.com/NarcoNations/canonkit/pull/19) | Stage 4.3 pack command |
| [#20](https://github.com/NarcoNations/canonkit/pull/20) | Stage 4.4 acceptance and Stage 4 completion |
| [#21](https://github.com/NarcoNations/canonkit/pull/21) | Stage 5.1 threat model and public-alpha release boundary |
| [#22](https://github.com/NarcoNations/canonkit/pull/22) | Stage 5.2 installation, aggregate input budget, and safe CI usage |
| [#23](https://github.com/NarcoNations/canonkit/pull/23) | Stage 5.3 package identity decision and private candidate migration |
| [#24](https://github.com/NarcoNations/canonkit/pull/24) | Stage 5.3 locked non-publishing release rehearsal |

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

## Completed checkpoint — Stage 4.3

The packaged command now maps explicit CLI controls into the existing projection policy, defaults to public Markdown, emits the JSON envelope directly, caps rendered output, and returns versioned atomic failures. Real-process tests cover disclosure, lifecycle, determinism, invalid repositories, and both budgets.

## Completed checkpoint — Stage 4.4 and Stage 4 acceptance

The complete security, disclosure, identity, provenance, determinism, untrusted-body, package, Node-support, documentation, clean-room, and resumability evidence is recorded in [`STAGE-4-ACCEPTANCE.md`](./STAGE-4-ACCEPTANCE.md). Stage 4 is complete without adapters, hosted services, or private content.

## Completed checkpoint — Stage 5.1

[`../canonkit-threat-model.md`](../canonkit-threat-model.md) maps assets, actors, trust boundaries, entry points, eight abuse paths, eight prioritised threats, existing controls, gaps, mitigations, detection ideas, residual risks, and security-review focus paths. [`ALPHA-RELEASE-BOUNDARY.md`](./ALPHA-RELEASE-BOUNDARY.md) locks the intended alpha version, artifact allowlist, protected publishing authority, CI disclosure rules, and remaining blockers without publishing the current private package. The package choice is superseded by the Stage 5.3 identity decision below.

## Completed checkpoint — Stage 5.2

RB-002, RB-003, and RB-004 are closed. Stage 5.2 used transitional private scoped metadata while adding the aggregate byte ceiling, neutral example, local tarball route, public-only pull-request workflow, Git-authority model, sensitive-output rules, and AI-consumer boundary.

## Completed checkpoint — Stage 5.3 package identity

The current public registry evidence, alternatives, security implications, and lineage are recorded in [`PACKAGE-IDENTITY-REVIEW.md`](./PACKAGE-IDENTITY-REVIEW.md) and ADR-019. Unscoped `canonkit` is occupied by related-looking third-party software. An independent `@canonkit` organisation is not justified for the single package. `@vibelabz/canonkit` is selected and applied to private metadata; `@narconations/canonkit` is transitional history only. Nothing was published or tagged.

## Completed checkpoint — Stage 5.3 non-publishing rehearsal

[`STAGE-5-3-REHEARSAL.md`](./STAGE-5-3-REHEARSAL.md) records the locked private candidate and the passing manual, read-only workflow across Ubuntu/macOS and Node.js 22/24. Every job reproduced the same 78-file unpacked-content manifest, audited dependencies, verified licences and package boundaries, installed its exact tarball with scripts disabled, imported the public API, and exercised `validate`, `resolve`, and `pack`. The workflow has no credential, OIDC, package upload, publish, tag, or release path. RB-006 is closed by [run 32510120043](https://github.com/NarcoNations/canonkit/actions/runs/32510120043).

## Exact next checkpoint — deferred ownership and provenance gate

RB-001 and RB-005 remain deferred until Ashley is ready to establish the npm organisation and recovery boundary. On resumption, verify authenticated `vibelabz` ownership, owner recovery, and MFA before implementing protected trusted publishing and recording real provenance. Publication and tagging remain separate actions requiring explicit maintainer approval.

The account-independent preparation is already complete: structured issue and pull-request intake, private security routing, support expectations, a solo-maintainer model, a gated publication runbook, and a truthful OSS application evidence register. Do not recreate these during release; update them only from real ownership, registry, or adoption evidence.

## Remaining route to the OSS application

1. Stage 5 — installable npm public alpha, threat model, CI example, and release evidence.
2. Stage 6 — external feedback, usage evidence, maintenance cadence, and Vercel OSS application pack.

Stage 6 requires the most elapsed real-world time because credible adoption evidence cannot be manufactured by implementation alone.

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
