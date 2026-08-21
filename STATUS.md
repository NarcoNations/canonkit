# CanonKit status

- **Updated:** 2026-08-21
- **Current stage:** Stage 2 in progress — Validate command
- **Stage state:** Stage 2.1 CLI shell complete; Stage 2.2 is next
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

## Next checkpoint

- Stage 2.2 — run the versioned document-model checkpoint, then add deterministic document policy rules.

## Not started

- Document and relationship policy validation
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

- The CLI currently reports collection failures only; it does not yet detect competing authority, overdue review, or relationship failures.
- The document-centered `1.0` contract needs a bounded model checkpoint before subject, decision, alias, and typed-lineage rules are locked.
- There is no external usage evidence yet.
- The Vercel OSS application is not ready until the project demonstrates active development and a functioning tool.

## Resume here

1. Confirm the Stage 2.1 CLI-shell checkpoint is merged and `main` is clean.
2. Read `docs/DEVELOPMENT-HANDOVER.md`, `docs/CLI-CONTRACT.md`, `ARCHITECTURE.md`, `ROADMAP.md`, and `BUILD-PLAN.md`.
3. Create a branch for **BUILD-PLAN task 2.2 — document model and policy rules**.
4. Test the generic document contract against subject, decision, alias, and typed-lineage requirements before changing the public schema.
5. Implement only the accepted document rules and fixtures; leave relationship graph rules for Stage 2.3.
