# CanonKit status

- **Updated:** 2026-08-21
- **Current stage:** Stage 5 in progress — Public alpha
- **Stage state:** Stage 5.3 in progress — non-publishing rehearsal implemented; cross-platform run is next
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
- Public-alpha release boundary preserves package ownership, aggregate input safety, safe CI usage, protected publishing, and cross-platform evidence.
- Stage 5.1 implementation and acceptance gate completed.
- Transitional scoped alpha metadata was applied atomically in Stage 5.2 while `private: true` continued to block publication.
- Scanner enforces a default 32 MiB and hard 256 MiB aggregate Markdown budget through bounded reads and atomic diagnostics.
- Neutral end-to-end source, tarball-install, validation, and resolution flows are documented and verified.
- Public-only GitHub Actions example uses read-only permissions, no persisted checkout credentials, exact package version, disabled install scripts, and no secrets.
- Git-as-authority, sensitive-output, and untrusted AI-consumer boundaries are documented in the quick start.
- Release blockers RB-002, RB-003, and RB-004 are closed; Stage 5.2 implementation and acceptance gate completed.
- Public-registry evidence confirms that unscoped `canonkit` is active unrelated third-party software and cannot be this project's package.
- `@canonkit/canonkit` and `@vibelabz/canonkit` have no caller-visible public package, while organisation ownership remains intentionally unproven without authentication.
- `@vibelabz/canonkit@0.1.0-alpha.0` is selected as the single-package public candidate and applied to private metadata without publishing.
- `@narconations/canonkit` is recorded as transitional build history, not the public identity.
- The package identity, alternatives, security implications, recovery requirements, and exact ownership gate are recorded in `docs/PACKAGE-IDENTITY-REVIEW.md` and ADR-019.
- A dependency-free rehearsal locks the private candidate to 78 permitted files and one unpacked-content manifest.
- The exact tarball installs into a clean synthetic consumer and passes library import plus packaged `validate`, `resolve`, and `pack` flows.
- A manual read-only GitHub workflow covers Ubuntu/macOS and Node.js 22/24 without npm credentials, OIDC, publication, tags, releases, or uploaded package artifacts.
- Draft alpha release notes and the evidence contract are recorded without granting publication approval.

## Next checkpoint

- Stage 5.3 — run the non-publishing matrix from protected `main`, record the evidence, and close only RB-006 if all four jobs pass.

## Not started

- Authenticated npm `vibelabz` organisation ownership and recovery verification
- Protected trusted-publishing and provenance workflow
- Cross-platform execution of the implemented non-publishing rehearsal
- npm publication
- OSS application

## Key decisions

- CanonKit is an independent clean-room project.
- CanonKit is an independently branded open-source VibeLabz product, technically independent of FABRIC.
- The selected public-package candidate is the single package `@vibelabz/canonkit`; the CLI remains `canonkit`.
- No `@canonkit/core` or speculative multi-package architecture is planned.
- The core is local-first, deterministic, read-only by default, and network-disabled.
- v0.1 is a single TypeScript package, not a monorepo.
- Markdown with YAML frontmatter is the input format.
- JSON Schema owns the public metadata contract.
- The first useful command is `canonkit validate`.
- No dashboard, database, AI inference, IDE integration, or MCP adapter belongs in the first alpha.

## Current risks

- Three alpha release blockers remain open; publication is explicitly prohibited until all close.
- The unscoped `canonkit` npm name belongs to a similarly positioned unrelated project and must never be used in installation guidance.
- Public absence of `@vibelabz/canonkit` does not prove that the `vibelabz` organisation scope is claimable; authenticated ownership is still the first release blocker.
- Protected trusted publishing has not started; the cross-platform rehearsal is implemented but not yet executed on GitHub.
- Schema `1.0` documents remain valid but cannot participate in subject-based canon checks until explicitly migrated to `1.1`.
- There is no external usage evidence yet.
- The Vercel OSS application is not ready until the project demonstrates active development and a functioning tool.

## Resume here

1. Confirm the non-publishing rehearsal checkpoint is merged and `main` is clean apart from known unrelated duplicate files.
2. Manually run `.github/workflows/release-rehearsal.yml` from `main`.
3. Record the run URL and all four Ubuntu/macOS and Node.js 22/24 results in `docs/STAGE-5-3-REHEARSAL.md`.
4. Close only RB-006 if every job reproduces the locked candidate and passes.
5. Leave RB-001 and RB-005 deferred. Keep `private: true`; do not authenticate npm, publish, stage, upload the tarball, tag, or create a release.
