# CanonKit status

- **Updated:** 2026-08-18
- **Current stage:** Stage 0 — Public foundation
- **Stage state:** Documentation checkpoint awaiting merge
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

## In progress

- Review and merge the Stage 0 documentation checkpoint.

## Not started

- TypeScript package foundation
- Public metadata schema
- Repository scanner
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

- Metadata terms remain provisional until Stage 1 fixture tests prove them.
- The project has a concept and plan but no working CLI yet.
- There is no external usage evidence yet.
- The Vercel OSS application is not ready until the project demonstrates active development and a functioning tool.

## Resume here

1. Confirm the Stage 0 documentation checkpoint is merged and `main` is clean.
2. Read `ARCHITECTURE.md`, `ROADMAP.md`, and `BUILD-PLAN.md`.
3. Create a branch for **BUILD-PLAN task 1.1 — Project foundation**.
4. Add the empty strict TypeScript package and CI only.
5. Validate locally and update this file before closing the task.
