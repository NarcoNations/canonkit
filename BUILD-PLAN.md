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

**Status:** Complete

- [x] Add deterministic eligible-only `canonkit list` output.
- [x] Add bounded `canonkit graph` terminal and JSON output.
- [x] Default to public-only output with explicit visibility and exact-scope filters.
- [x] Fail closed on invalid collections without leaking partial graph paths.
- [x] Preserve the read-only, body-free, and stable-order boundaries.

### 3.3 Resolution rules

**Status:** Complete

- [x] Match only explicit subject, document identity, or normalized alias fields.
- [x] Rank candidates by match type, document role, and governing authority.
- [x] Reject ambiguous top-ranked authority rather than guessing.
- [x] Explain selected, tied, ineligible, and lower-ranked candidates.
- [x] Exclude paths, versions, timestamps, bodies, and input order from authority ranking.

### 3.4 Resolve command

**Status:** Complete

- [x] Add `canonkit resolve <query> [path]` terminal and JSON output.
- [x] Preserve public-only defaults, exact scope, and explicit wider-visibility opt-in.
- [x] Remove visibility- and scope-excluded nodes before query matching.
- [x] Return failing ambiguity, ineligible-only, not-found, and validation-blocked outcomes.
- [x] Prove stable repeated results, candidate limits, and body-free output.
- [x] Complete the Stage 3 acceptance gate.

## Stage 4 tasks — Safe context packs

### 4.1 Pack contract and budgets

**Status:** Complete

- [x] Define the versioned pack envelope and provenance fields.
- [x] Define audience, visibility, lifecycle, document-count, and byte budgets.
- [x] Require explicit opt-in for non-active material.
- [x] Define fail-closed truncation and validation behaviour before implementation.

### 4.2 Pack projection library

**Status:** Complete

- [x] Build deterministic Markdown and JSON pack projections over fully validated collections.
- [x] Preserve exact provenance and the normalized selection policy for every included document.
- [x] Remove visibility- and scope-excluded material before paths, counts, or failures are exposed.
- [x] Reject stale, escaped, or changed sources without returning a partial pack.

### 4.3 Pack command

**Status:** Complete

- [x] Add bounded `canonkit pack` Markdown and JSON process output.
- [x] Add explicit audience, exact-scope, lifecycle, document, and byte options.
- [x] Prove public-only defaults and explicit non-active opt-in.
- [x] Preserve stable failure exits and atomic no-partial-output behavior.
- [x] Enforce a fixed rendered-process-output ceiling.

### 4.4 Stage 4 acceptance

**Status:** Complete

- [x] Complete the security review without widening the Stage 4 capability boundary.
- [x] Prove default disclosure and every explicit audience ceiling.
- [x] Re-run determinism, atomic budget, provenance, and untrusted-body gates.
- [x] Verify the production-only package, CLI, public API, and package contents.
- [x] Verify documentation, clean-room vocabulary, Node support, and resumability.
- [x] Record the evidence in [`docs/STAGE-4-ACCEPTANCE.md`](./docs/STAGE-4-ACCEPTANCE.md).

Do not begin adapters, a dashboard, hosted services, or private content migration during Stage 4.

## Stage 5 tasks — Public alpha

### 5.1 Threat model and release boundary

**Status:** Complete

- [x] Define protected assets, actors, attacker capabilities, and trust boundaries.
- [x] Enumerate filesystem, metadata, disclosure, output-consumer, package, and supply-chain threats.
- [x] Record existing controls, residual risks, and release-blocking mitigations.
- [x] Lock the intended public package name, versioning, contents, and publication authority.
- [x] Record the repository-grounded model in [`canonkit-threat-model.md`](./canonkit-threat-model.md).
- [x] Record the release contract and blockers in [`docs/ALPHA-RELEASE-BOUNDARY.md`](./docs/ALPHA-RELEASE-BOUNDARY.md).

Acceptance:

- The threat model is repository-grounded and covers the complete local CLI flow.
- Every High or Critical risk is resolved or explicitly blocks the alpha.
- Publication remains a separate, explicitly approved action.

### 5.2 Installation and CI usage

**Status:** Complete

- [x] Add a default and hard aggregate repository-byte budget with stable diagnostics and adversarial tests.
- [x] Apply transitional scoped alpha metadata atomically while retaining `private: true`; the public namespace remains subject to Stage 5.3 identity review.
- [x] Write installation and quick-start documentation.
- [x] Add a neutral end-to-end example repository.
- [x] Add a public-only, read-only GitHub Actions validation example for untrusted pull requests.
- [x] Document sensitive-output handling, Git-as-authority assumptions, and untrusted AI-consumer boundaries.

### 5.3 Release rehearsal

**Status:** In progress — non-publishing rehearsal implemented; cross-platform run is next

- [x] Verify the current public-registry status of `canonkit`, `@canonkit/canonkit`, and `@vibelabz/canonkit`.
- [x] Select `@vibelabz/canonkit` without renaming CanonKit or creating a multi-package architecture.
- [x] Apply the selected candidate atomically while retaining `private: true`.
- [ ] Verify authenticated `vibelabz` organisation ownership, owner access, recovery, and enforced MFA.
- [ ] Add the protected least-privilege trusted-publishing workflow with automatic provenance.
- [x] Add a manual, read-only, secret-free, non-publishing rehearsal workflow.
- [ ] Run the locked candidate on Ubuntu and macOS with Node.js 22 and 24.
- [x] Install and exercise the exact locked candidate tarball outside this repository.
- [x] Confirm package contents, runtime licences, and draft release notes.
- [ ] Confirm real trusted-publishing provenance after authenticated package ownership exists.

### 5.4 Public alpha release

**Status:** Not started

- Publish only after explicit maintainer approval.
- Create the alpha tag and release notes.
- Add feedback issue templates and support expectations.

## Exact next task

Merge the non-publishing rehearsal checkpoint, then manually run [`.github/workflows/release-rehearsal.yml`](./.github/workflows/release-rehearsal.yml) from protected `main`. Record all four Ubuntu/macOS and Node 22/24 results in [`docs/STAGE-5-3-REHEARSAL.md`](./docs/STAGE-5-3-REHEARSAL.md) and close only RB-006 if they pass. RB-001 and RB-005 remain deferred until Ashley is ready to establish the npm organisation and recovery boundary. Keep `private: true`; do not publish, stage, upload the tarball, create a tag, or silently fall back to NarcoNations.
