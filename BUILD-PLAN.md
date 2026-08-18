# CanonKit build plan

This file translates the roadmap into an ordered implementation sequence. It is the default starting point for future development sessions.

## Working method

For every bounded change:

1. Read `STATUS.md`, this file, and the relevant architecture decision.
2. Confirm the working tree and current branch.
3. Implement the smallest incomplete task whose prerequisites are complete.
4. Add or update tests before declaring the task complete.
5. Run focused tests, typecheck, lint, and package checks as applicable.
6. Update `STATUS.md` and `CHANGELOG.md` when a milestone changes.
7. Keep unrelated work out of the change.

## Stage 1 tasks — Schema and scanner

### 1.1 Project foundation

**Status:** Complete

- [x] Add `package.json` with ESM output and supported Node engines.
- [x] Add strict TypeScript configuration.
- [x] Add focused test, typecheck, lint, and build scripts.
- [x] Add `src/`, `schema/`, `fixtures/`, and `test/` directories.
- [x] Add CI for supported Node LTS releases.

Acceptance:

- An empty library build passes locally and in CI.
- The package contains no runtime server or framework dependency.

### 1.2 Metadata contract

**Status:** Complete

- [x] Write `schema/canonkit-document.schema.json`.
- [x] Add valid minimal and complete metadata fixtures.
- [x] Add one invalid fixture for each required field and enum.
- [x] Add a schema version compatibility rule.
- [x] Document the contract with copy-paste examples.

Acceptance:

- Schema tests accept every valid fixture and reject every invalid fixture for the intended reason.
- No private or organisation-specific vocabulary appears in fixtures.

### 1.3 Frontmatter parser

**Status:** Complete

- [x] Parse Markdown frontmatter and body separately.
- [x] Preserve source path and diagnostic line information where practical.
- [x] Reject malformed YAML, multiple frontmatter blocks, and unsupported schema versions.
- [x] Enforce configurable file-size limits.

Acceptance:

- Parser tests cover missing, malformed, minimal, and complete frontmatter.
- Document bodies cannot alter parser or policy behaviour.

### 1.4 Repository discovery

**Status:** Complete

- [x] Resolve an explicit start path to a bounded repository root.
- [x] Discover Markdown files in stable order.
- [x] Add default exclusions and optional configuration.
- [x] Prevent path traversal and symlink escape.
- [x] Enforce configurable document-count limits.

Acceptance:

- Discovery remains inside the fixture repository.
- Excluded and escaped files never enter the document collection.

### 1.5 Normalised model

**Status:** Complete

- [x] Define the internal document and diagnostic types.
- [x] Convert validated metadata into the normalised model.
- [x] Retain raw metadata only for reporting, not authority inference.
- [x] Return a collection plus diagnostics rather than throwing for ordinary invalid documents.

Acceptance:

- A fixture scan returns stable, serialisable results.
- Invalid documents do not hide diagnostics from other files.

## Stage 2 tasks — Validate command

### 2.1 CLI shell

**Status:** Next

- Add the `canonkit` executable.
- Use native argument parsing unless a concrete limitation is proven.
- Support `--help`, `--version`, `--format`, and an optional path.
- Return documented exit codes.

### 2.2 Document rules

- Required metadata and enum validation
- Stable identity uniqueness
- Owner requirement for active governing documents
- Review deadline warnings
- Visibility consistency
- Competing active authority detection within scope

### 2.3 Relationship rules

- Missing supersession targets
- Self-supersession
- Cycles
- Invalid active/superseded combinations
- Multiple current versions

### 2.4 Reports

- Concise terminal summary
- Detailed diagnostics with remediation
- Stable JSON contract
- Quiet mode for CI

Stage 2 is complete only when `canonkit validate fixtures/valid` succeeds and every intentionally broken repository fails predictably.

## Later stages

Stage 3 and beyond are intentionally kept at roadmap granularity until validation proves the document model. Do not implement resolution, context packs, adapters, or a dashboard while Stage 1 or Stage 2 acceptance gates remain open.

## Exact next task

After the Stage 1.5 checkpoint is merged, start **2.1 CLI shell** on a dedicated branch. Expose the existing collection through a minimal `canonkit` executable with help, version, format, path, and stable exit-code handling; do not begin document policy rules in the same change.
