# CanonKit development handover

This is the durable restart guide for implementation work. It records the completed foundation, the boundaries that must remain true, and the exact next checkpoint.

## Snapshot

- **Snapshot date:** 2026-08-18
- **Baseline commit:** `d603b16` — Stage 1 normalised collection merged to `main`
- **Completed:** Stage 0 public foundation and Stage 1 schema/repository scanner
- **Next:** Build-plan task 2.1 — minimal CLI shell
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

The public metadata contract is [`schema/canonkit-document.schema.json`](../schema/canonkit-document.schema.json). Its supported `schema_version` is exactly `1.0`.

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

The Stage 1 checkpoint passed:

- lint and strict typechecking
- 50 tests across five test files
- declaration and source-map build
- Node.js 22 and 24 GitHub CI
- Vercel deployment check
- dependency audit with zero reported vulnerabilities
- clean-checkout package preview with 21 intended files
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

## Exact next checkpoint — Stage 2.1

Create a dedicated `agent/stage-2-1-cli-shell` branch from current `main` and implement only the minimal executable boundary described in `BUILD-PLAN.md`:

- add the `canonkit` executable and package `bin` entry
- use Node's native argument parsing unless a tested limitation appears
- support `--help`, `--version`, `--format`, and an optional path
- expose the existing collection without duplicating discovery or parsing logic
- define and test stable usage, document-failure, and unexpected-error exit behaviour
- preserve terminal output and machine output as deterministic, separately tested paths

Do not add Stage 2.2 document-policy rules, relationship rules, resolution, context packs, a dashboard, hosted services, or AI inference in this checkpoint.

Before closing Stage 2.1:

1. Add CLI unit and process-level tests.
2. Test help, version, valid path, invalid path, format selection, and bad arguments.
3. Run the standard quality and package gates.
4. Confirm the installed package exposes an executable.
5. Update `STATUS.md`, `BUILD-PLAN.md`, and `CHANGELOG.md` to point to Stage 2.2.

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
schema/              versioned public metadata contract
fixtures/            synthetic contract, parser, discovery, and collection cases
test/                unit and integration coverage
docs/                public contracts and development continuity
public/              static product concept site
```

Continue to use one bounded branch and one pull request per build-plan checkpoint. Stage exact files, preserve unrelated worktree content, and make completion claims only after local and GitHub checks finish.
