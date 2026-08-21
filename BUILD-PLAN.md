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

**Status:** Complete

- [x] Add the `canonkit` executable.
- [x] Use native argument parsing unless a concrete limitation is proven.
- [x] Support `--help`, `--version`, `--format`, and an optional path.
- [x] Return documented exit codes.

### 2.2 Document rules

**Status:** Complete

- [x] Separate document identity from governed subjects in schema `1.1`.
- [x] Add typed document kinds, aliases, subject identities, and lineage relations.
- [x] Preserve schema `1.0` compatibility without inferred metadata.
- [x] Validate required metadata and enums through the declared schema version.
- [x] Detect duplicate stable document identity and version pairs.
- [x] Require owner and scope for active governing documents.
- [x] Warn when review deadlines are overdue.
- [x] Detect visibility conflicts and competing active canon by subject.
- [x] Emit deterministic diagnostics with remediation in terminal and JSON reports.

### 2.3 Relationship rules

**Status:** Complete

- [x] Reject missing exact and identity-only supersession targets.
- [x] Reject exact and ambiguous unversioned self-supersession.
- [x] Detect deterministic supersession cycles.
- [x] Reject active superseded targets and unreferenced superseded documents.
- [x] Detect multiple active versions of one document identity.
- [x] Keep typed subject relations distinct from document supersession.
- [x] Emit stable terminal and JSON relationship diagnostics with remediation.

### 2.4 Reports

**Status:** Complete

- [x] Emit one concise terminal summary across all validation layers.
- [x] Normalise every diagnostic with phase, severity, location, related paths, and remediation.
- [x] Lock the versioned JSON report `2.0` envelope and compatibility tests.
- [x] Add quiet CI mode that suppresses clean output but preserves warnings and failures.

Stage 2 is complete only when `canonkit validate fixtures/relationships/valid` succeeds and every intentionally broken repository fails predictably.

## Stage 3 tasks — Resolution and trust graph

### 3.1 Graph index and eligibility

**Status:** Complete

- [x] Index validated documents by identity, version, subject, and explicit relationship.
- [x] Reuse normalized supersession metadata without reparsing document bodies.
- [x] Define fail-closed lifecycle, authority, visibility, and scope eligibility.
- [x] Return deterministic graph data plus explainable exclusions.
- [x] Preserve explicit typed relations without inventing source subjects.
- [x] Reject ambiguous duplicate or unresolved graph input.

### 3.2 List and graph commands

**Status:** Next

- Add deterministic `canonkit list` output.
- Add bounded `canonkit graph` terminal and JSON output.
- Preserve the read-only and visibility boundaries.

### 3.3 Resolution rules

- Define explicit candidate selection and ranking.
- Reject ambiguous current authority rather than guessing.
- Explain selected and rejected candidates.

### 3.4 Resolve command

- Add `canonkit resolve <query>`.
- Prove stable repeated results and bounded output.
- Complete the Stage 3 acceptance gate.

Stage 4 and beyond remain at roadmap granularity until resolution proves the trust graph. Do not begin context packs, adapters, or a dashboard during Stage 3.

## Exact next task

After the Stage 3.1 checkpoint is merged, start **3.2 list and graph commands** on a dedicated branch. Project the existing graph through bounded deterministic terminal and JSON output without adding candidate ranking or resolution. Do not begin context packs, adapters, or private content migration in the same change.
