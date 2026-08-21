# CanonKit status

- **Updated:** 2026-08-21
- **Current stage:** Stage 5 in progress — Public alpha
- **Stage state:** Stage 5.1 threat model and release boundary complete; Stage 5.2 is next
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
- Versioned safe context-pack envelope, item, provenance, result, and failure contracts added.
- Public-only, active-only, governing-authority pack defaults are normalized through a frozen public policy API.
- Audience disclosure ceilings, exact scope, explicit non-active opt-in, and stable status ordering are locked.
- Default and hard document and UTF-8 body-byte budgets reject unsafe inputs and require whole-pack failure on overflow.
- Public `buildContextPack()` validates the complete collection and policy graph before selecting any material.
- Disclosure filters run before permitted paths, counts, or failures can be exposed.
- Selected source files are repository-bounded, re-read, reparsed, compared with the validated model, and SHA-256 hashed.
- Stable JSON and injection-safe Markdown renderers preserve explicit untrusted-body boundaries.
- Empty selection, validation, budget, path, source-change, and integrity failures return no partial pack.
- Packaged `canonkit pack [path]` emits public-only Markdown by default or the versioned JSON envelope explicitly.
- Audience, exact scope, repeatable non-active lifecycle, document, and content-byte options map directly to the library policy.
- Pack failures emit stable Markdown or versioned JSON diagnostics with exit code `1` and no partial items.
- Rendered process output is capped at 8 MiB independently of the body-content budget.
- Real-process tests prove deterministic repetition, disclosure defaults, explicit opt-ins, budget failures, and generic validation blocking.
- Stage 4 acceptance proves public-only defaults across public, internal, and restricted material.
- Security, determinism, provenance, untrusted-body, package, documentation, clean-room, Node-support, and resumability gates are consolidated in `docs/STAGE-4-ACCEPTANCE.md`.
- Stage 4 implementation and acceptance gate completed.
- Repository-grounded threat model completed across runtime, filesystem, governance, disclosure, consumer, CI, package, registry, and static-site boundaries.
- Public-alpha release boundary locks the proposed `@narconations/canonkit@0.1.0-alpha.0` identity without publishing or changing the current private package.
- Six explicit release blockers preserve package ownership, aggregate input safety, safe CI usage, protected publishing, and cross-platform evidence.
- Stage 5.1 implementation and acceptance gate completed.

## Next checkpoint

- Stage 5.2 — close release blockers RB-002, RB-003, and RB-004; then add installation guidance and a public-only CI example.

## Not started

- Aggregate repository-byte limit and safe CI usage contract
- Alpha package metadata and installation documentation
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

- Six alpha release blockers remain open; publication is explicitly prohibited until all close.
- The unscoped `canonkit` npm name belongs to an unrelated project; all future installation guidance must use the proposed scoped identity.
- The scanner needs an aggregate repository-byte budget before public alpha.
- Npm scope ownership, protected trusted publishing, and cross-platform release rehearsal have not started.
- Schema `1.0` documents remain valid but cannot participate in subject-based canon checks until explicitly migrated to `1.1`.
- There is no external usage evidence yet.
- The Vercel OSS application is not ready until the project demonstrates active development and a functioning tool.

## Resume here

1. Confirm the Stage 5.1 checkpoint is merged and `main` is clean apart from known unrelated duplicate files.
2. Read `canonkit-threat-model.md`, `docs/ALPHA-RELEASE-BOUNDARY.md`, `docs/DEVELOPMENT-HANDOVER.md`, `STATUS.md`, and `BUILD-PLAN.md`.
3. Create a branch for **BUILD-PLAN task 5.2 — installation and CI usage**.
4. Close RB-002, RB-003, and RB-004 before treating installation or CI guidance as alpha-ready.
5. Keep `private: true`; do not authenticate npm, publish, tag, add hosted services, or introduce private content during 5.2.
