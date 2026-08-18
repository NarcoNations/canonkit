# CanonKit status

- **Updated:** 2026-08-18
- **Current stage:** Stage 1 — Schema and repository scanner
- **Stage state:** Stage 1.4 complete; Stage 1.5 is next
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

## Next checkpoint

- Stage 1.5 — create the normalised document collection and diagnostic model.

## Not started

- Normalised document scanner
- Validation CLI
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

- Parser and discovery outputs are not yet combined into a serialisable collection.
- The project has a concept and plan but no working CLI yet.
- There is no external usage evidence yet.
- The Vercel OSS application is not ready until the project demonstrates active development and a functioning tool.

## Resume here

1. Confirm the Stage 1.4 repository-discovery checkpoint is merged and `main` is clean.
2. Read `ARCHITECTURE.md`, `ROADMAP.md`, and `BUILD-PLAN.md`.
3. Create a branch for **BUILD-PLAN task 1.5 — Normalised model**.
4. Combine discovery and parsing into a stable collection plus diagnostics without beginning CLI work.
5. Validate locally and update this file before closing the task.
