# CanonKit development handover

This is the durable restart guide for implementation work. It records the completed foundation, the boundaries that must remain true, and the exact next checkpoint.

## Snapshot

- **Snapshot date:** 2026-08-21
- **Baseline commit:** `67843d0` — Stage 2.2 document model and policy merged to `main`
- **Completed:** Stage 0 public foundation and Stage 1 schema/repository scanner
- **Completed after baseline:** Build-plan task 2.3 — relationship rules
- **Next:** Build-plan task 2.4 — reports
- **Repository:** <https://github.com/NarcoNations/canonkit>
- **Production concept site:** <https://canonkit.vercel.app>
- **Latest release:** None; the package remains private until the public-alpha gate

`STATUS.md` owns the live checkpoint. If this handover and `STATUS.md` ever disagree, inspect current source and Git history before changing code.

## What exists now

The Stage 1 flow is implemented and tested:

```text
explicit path
    -> Git repository boundary
    -> stable Markdown discovery
    -> bounded UTF-8 reads
    -> strict YAML frontmatter parsing
    -> public JSON Schema validation
    -> normalised documents + unified diagnostics
```

Public package APIs:

| API | Purpose | Contract |
| --- | --- | --- |
| `parseMarkdownFrontmatter()` | Parse and validate one bounded Markdown string | [`PARSER-CONTRACT.md`](./PARSER-CONTRACT.md) |
| `discoverMarkdownFiles()` | Find eligible Markdown inside one Git boundary | [`DISCOVERY-CONTRACT.md`](./DISCOVERY-CONTRACT.md) |
| `scanRepository()` | Compose discovery, reading, parsing, and normalisation | [`COLLECTION-CONTRACT.md`](./COLLECTION-CONTRACT.md) |

The package also exposes the read-only `canonkit validate [path]` executable. Its formats and stable exit behaviour are defined in [`CLI-CONTRACT.md`](./CLI-CONTRACT.md). Document and supersession rules are defined in [`DOCUMENT-POLICY-CONTRACT.md`](./DOCUMENT-POLICY-CONTRACT.md) and [`RELATIONSHIP-POLICY-CONTRACT.md`](./RELATIONSHIP-POLICY-CONTRACT.md).

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

The Stage 2.3 implementation checkpoint passed locally:

- lint and strict typechecking
- 95 tests across nine test files at the Stage 2.3 implementation checkpoint
- declaration and source-map build
- Node.js 22 and 24 GitHub CI
- Vercel deployment check
- dependency audit with zero reported vulnerabilities
- package preview with 50 intended distributable files
- production-only collection scan with development dependencies removed
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

## Completed checkpoint — Stage 2.3

The dedicated `agent/stage-2-3-relationship-rules` checkpoint adds the supersession graph rules described in `BUILD-PLAN.md`:

- resolve exact and identity-only supersession targets inside the scanned collection
- reject missing targets and exact or ambiguous self-supersession
- detect supersession cycles deterministically
- enforce active/superseded lifecycle consistency and one active version per identity
- keep typed subject relations separate from document supersession
- add stable relationship diagnostics to terminal and JSON output

Final report compatibility and quiet CI mode remain Stage 2.4. Resolution, context packs, dashboards, hosted services, and AI inference remain outside this checkpoint.

Stage 2.3 closes only after:

1. Unit tests prove every relationship rule, deterministic order, and typed-relation non-inference boundary.
2. One valid chain and each intentionally broken repository fixture behave predictably through the real CLI.
3. CLI process tests prove relationship errors produce exit code `1` and bounded JSON diagnostics.
4. Run the standard quality, audit, and package gates.
5. Update durable contracts and handover documents to point to Stage 2.4.

## Exact next checkpoint — Stage 2.4

Lock the combined collection, document-policy, and relationship-policy report envelope. Keep terminal output concise while retaining actionable remediation, then add quiet CI mode and compatibility tests. Do not add new policy, resolution, context packs, adapters, or private project knowledge.

## Remaining route to the OSS application

1. Stage 2 — working `canonkit validate` with document/relationship rules and reports.
2. Stage 3 — deterministic authority resolution and trust graph.
3. Stage 4 — fail-closed, provenance-backed context packs.
4. Stage 5 — installable npm public alpha, threat model, CI example, and release evidence.
5. Stage 6 — external feedback, usage evidence, maintenance cadence, and Vercel OSS application pack.

Stage 3 is expected to be the most implementation-intensive remaining stage. Stage 6 requires the most elapsed real-world time because credible adoption evidence cannot be manufactured by implementation alone.

## Source map

```text
src/discovery/       repository boundary and Markdown discovery
src/metadata/        frontmatter and public-schema validation
src/model/           normalised collection and unified diagnostics
src/policy/          deterministic document and relationship policy
schema/              versioned public metadata contract
fixtures/            synthetic contract, parser, discovery, and collection cases
test/                unit and integration coverage
docs/                public contracts and development continuity
public/              static product concept site
```

Continue to use one bounded branch and one pull request per build-plan checkpoint. Stage exact files, preserve unrelated worktree content, and make completion claims only after local and GitHub checks finish.
