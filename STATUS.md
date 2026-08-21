# CanonKit status

- **Updated:** 2026-08-21
- **Current stage:** Stage 2 in progress — Validate command
- **Stage state:** Stage 2.2 document model and rules complete; Stage 2.3 is next
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

## Next checkpoint

- Stage 2.3 — validate supersession targets, self-references, cycles, lifecycle combinations, and multiple current versions.

## Not started

- Relationship policy validation
- Resolution and trust graph
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

- Relationship targets and cycles are represented but are not yet validated.
- Schema `1.0` documents remain valid but cannot participate in subject-based canon checks until explicitly migrated to `1.1`.
- There is no external usage evidence yet.
- The Vercel OSS application is not ready until the project demonstrates active development and a functioning tool.

## Resume here

1. Confirm the Stage 2.2 checkpoint is merged and `main` is clean.
2. Read `docs/DEVELOPMENT-HANDOVER.md`, `docs/DOCUMENT-POLICY-CONTRACT.md`, `ARCHITECTURE.md`, `ROADMAP.md`, and `BUILD-PLAN.md`.
3. Create a branch for **BUILD-PLAN task 2.3 — relationship rules**.
4. Reuse the explicit `supersedes` and typed `relations` inputs; do not infer graph edges from aliases or Markdown bodies.
5. Implement relationship validation only; leave resolution and context packs for later stages.
