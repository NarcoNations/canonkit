# Changelog

All notable changes to CanonKit will be documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and releases will use semantic versioning after the first package release.

## [Unreleased]

### Added

- Staged product and implementation roadmap.
- Architecture boundaries and initial decision records.
- Ordered build plan with acceptance criteria and an exact next task.
- Resumable project status document.
- Project Code of Conduct.
- Strict TypeScript ESM package foundation with zero runtime dependencies.
- Lint, typecheck, unit-test, build, and package-content gates.
- Declaration and source-map build output.
- GitHub CI matrix for supported Node.js 22 and 24 LTS releases.
- Placeholder directories for the next schema and fixture checkpoint.
- Versioned JSON Schema Draft 2020-12 contract for CanonKit document metadata.
- Neutral minimal, complete, and intentionally invalid metadata fixtures.
- Contract tests that prove valid fixtures pass and invalid fixtures fail for their intended reason.
- Bounded Markdown frontmatter parser with strict YAML and public-schema validation.
- Stable parser diagnostics with source paths and one-based Markdown locations.
- Configurable UTF-8 byte limits and synthetic frontmatter fixtures.
- Repository-bounded Markdown discovery with stable portable path ordering.
- Default and configurable exclusions with fail-closed traversal and document-count limits.
- Synthetic repository fixtures covering generated output, dependencies, symlinks, and nested repositories.
- Stable JSON-safe document collections that preserve valid documents and neighbouring diagnostics.
- Explicit normalised governance fields with reporting-only raw metadata.
- UTF-8 validation, source byte provenance, scan summaries, and synthetic mixed-validity fixtures.
- Durable Stage 1 development handover with the exact Stage 2.1 restart boundary.
- Minimal read-only `canonkit validate [path]` executable and npm `bin` entry.
- Native help, version, terminal/JSON format, and optional-path argument handling.
- Stable CLI exits for clean scans, document failures, usage errors, and unexpected failures.
- Bounded JSON reports that omit document bodies and reporting-only raw metadata.
- CLI unit and real-process coverage for valid, invalid, help, version, format, and usage paths.
- Backward-compatible metadata schema `1.1` separating document identity from governed subjects.
- Typed document kinds, aliases, subject identities, and explicit lineage relations with neutral migration fixtures.
- Deterministic document-policy engine for duplicate versions, active ownership and scope, overdue reviews, competing subject canon, and visibility conflicts.
- Stable terminal and JSON policy diagnostics with severities, related paths, remediation, and warning-aware exit behaviour.
- Deterministic supersession graph validation for missing targets, self-reference, cycles, lifecycle consistency, and multiple active versions.
- Stable relationship-policy diagnostics and neutral valid/broken repository fixtures.
- Explicit boundary keeping typed subject relations separate from document supersession.
- Versioned CLI JSON report `2.0` with one aggregate summary and normalized diagnostics.
- Concise terminal reporting projected from the same validation result.
- Quiet CI mode that suppresses completely clean runs while retaining warnings and failures.
- Deterministic trust graph indexes for document identity, version, subjects, supersession, and explicit relations.
- Fail-closed node eligibility with explainable lifecycle, authority, visibility, and scope exclusions.
- Neutral graph fixtures and integration coverage proving bodies and inferred relationships remain outside graph output.

## [0.0.0] — 2026-08-18

### Added

- Public CanonKit concept site.
- Extraction audit, security model, v0.1 scope, roadmap, and maintenance model.
- Clean-room extraction boundary.
- README, MIT licence, security policy, and contribution guidance.
- GitHub repository and automatic Vercel deployment.
