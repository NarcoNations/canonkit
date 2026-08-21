# CanonKit status

- **Updated:** 2026-08-21
- **Current stage:** Stage 3 complete — Resolution and trust graph
- **Stage state:** Stage 3 acceptance passed; Stage 4.1 pack contract and budgets is next
- **Latest completed release:** None
- **Production site:** <https://canonkit.vercel.app>
- **Repository:** <https://github.com/NarcoNations/canonkit>

## Completed

- Public repository created on GitHub.
- Static concept site deployed to Vercel.
- GitHub-to-Vercel deployments connected.
- Responsive product explainer and extraction audit completed.
- Clean-room boundary documented.
- MIT licence, security policy, and contribution guidance added.
- Staged roadmap, architecture decisions, and build sequence written.
- Code of Conduct added.
- Stage 0 documentation checkpoint merged to `main`.
- Strict TypeScript ESM package foundation added.
- Lint, typecheck, test, build, and package-content gates added.
- GitHub CI added for Node.js 22 and 24 LTS.
- Versioned public JSON Schema added for the `1.0` metadata contract.
- Neutral minimal, complete, and intentionally invalid metadata fixtures added.
- Contract tests verify every invalid fixture fails for its intended reason.
- Bounded Markdown frontmatter parser added with schema validation and stable diagnostics.
- Parser fixtures cover minimal, complete, missing, malformed, repeated, and unsupported metadata.
- UTF-8 byte limits, source locations, duplicate-key rejection, and alias rejection are tested.
- Repository-bounded Markdown discovery added with deterministic path ordering.
- Default and configured exclusions, nested repositories, symlinks, and traversal attempts are tested.
- Configurable document-count limits fail without returning partial results.
- Normalised repository scanner composes discovery, UTF-8 reading, parsing, and schema validation.
- Stable JSON-safe collections preserve valid documents and every neighbouring invalid-file diagnostic.
- Raw metadata is isolated under a reporting-only boundary; explicit normalised fields own later decisions.
- Stage 1 implementation and acceptance gate completed.
- Minimal `canonkit validate [path]` executable added without duplicating scanner logic.
- Native argument parsing supports help, version, terminal/JSON format selection, and one optional path.
- Stable exit codes distinguish clean scans, document failures, usage errors, and unexpected errors.
- CLI JSON output excludes Markdown bodies and reporting-only raw metadata.
- Unit and real-process tests cover the executable boundary and package `bin` target.
- Schema `1.1` separates document identity from governed subjects while preserving `1.0` compatibility.
- Typed document kinds, aliases, subject identities, and explicit lineage relations are normalised without inference.
- Deterministic document policy detects duplicate versions, missing ownership or scope, overdue review, competing subject canon, and visibility conflicts.
- Terminal and JSON CLI reports include stable policy codes, severity, related paths, remediation, and warning-aware exits.
- Supersession references resolve within the scanned collection by document identity or exact identity and version.
- Deterministic relationship policy detects missing targets, self-supersession, cycles, invalid lifecycle combinations, and multiple active versions.
- Typed subject relations remain distinct from document replacement and cannot silently change lifecycle state.
- CLI report `2.0` combines all validation layers into one aggregate summary and normalized diagnostic contract.
- Concise terminal and JSON formats project the same result without recomputing policy.
- Quiet CI mode suppresses only completely clean output and preserves warnings and failures.
- Stage 2 implementation and acceptance gate completed.
- Deterministic graph indexes document identity, version, subjects, supersession, and explicit typed relations.
- Repository-relative source paths provide unambiguous graph node IDs without composite-key inference.
- Fail-closed eligibility excludes non-active, non-governing, non-public, or scope-mismatched nodes with stable explanations.
- Internal and restricted visibility require explicit opt-in; excluded nodes remain visible for audit.
- Neutral integration fixtures prove the graph consumes normalized metadata and never emits Markdown bodies.
- Read-only `canonkit list` returns only eligible documents in stable order.
- Read-only `canonkit graph` exposes a bounded lifecycle audit projection without ranking candidates.
- Both commands default to public-only metadata and require explicit visibility and exact-scope filters.
- Invalid collections fail closed with a generic validation-required report and no partial paths.
- Terminal and versioned JSON formats cap nodes at 1000 and graph edges at 1000.
- Public `resolveTrustGraph()` selects from eligible graph nodes using explicit stable rules.
- Subject, document-identity, and normalized-alias matches have declared precedence.
- Canon, policy, decision, reference, and legacy roles have declared precedence before authority.
- Equal top-rank candidates return an explicit ambiguity with no selected source.
- Every match is explained as selected, tied, ineligible, or lower-ranked without body access.
- Packaged `canonkit resolve <query> [path]` emits bounded terminal and JSON explanations.
- Unique permitted authority exits successfully; ambiguity, ineligible-only, and no-match results fail closed.
- Visibility- and scope-excluded nodes are removed before matching and cannot leak through resolution.
- Candidate limits preserve complete permitted-result counts and explicit truncation state.
- Neutral real-process fixtures prove deterministic repetition, ambiguity, lifecycle exclusion, and generic validation blocking.
- Stage 3 implementation and acceptance gate completed.

## Next checkpoint

- Stage 4.1 — define the safe context-pack contract, provenance fields, and hard budgets.

## Not started

- Context-pack export
- npm publication
- OSS application

## Key decisions

- CanonKit is an independent clean-room project.
- The core is local-first, deterministic, read-only by default, and network-disabled.
- v0.1 is a single TypeScript package, not a monorepo.
- Markdown with YAML frontmatter is the input format.
- JSON Schema owns the public metadata contract.
- The first useful command is `canonkit validate`.
- No dashboard, database, AI inference, IDE integration, or MCP adapter belongs in the first alpha.

## Current risks

- Pack provenance, audience policy, and byte-budget semantics are not yet locked.
- Schema `1.0` documents remain valid but cannot participate in subject-based canon checks until explicitly migrated to `1.1`.
- There is no external usage evidence yet.
- The Vercel OSS application is not ready until the project demonstrates active development and a functioning tool.

## Resume here

1. Confirm the Stage 3.4 checkpoint is merged and `main` is clean apart from known unrelated duplicate files.
2. Read `docs/DEVELOPMENT-HANDOVER.md`, `docs/RESOLVE-CLI-CONTRACT.md`, `ROADMAP.md`, and `BUILD-PLAN.md`.
3. Create a branch for **BUILD-PLAN task 4.1 — pack contract and budgets**.
4. Lock provenance, audience, visibility, lifecycle, document-count, byte-budget, and truncation semantics before implementation.
5. Keep adapters, hosted services, and private content outside Stage 4.
