# CanonKit roadmap

This roadmap keeps CanonKit small, useful, and resumable. Each stage ends with a tested, documented checkpoint before the next stage begins.

## Delivery rules

- Finish stages in order unless a documented dependency changes.
- Keep the core local-first, deterministic, and read-only by default.
- Use synthetic fixtures only.
- Update `STATUS.md` and `CHANGELOG.md` at every completed stage.
- Tag public releases only after their acceptance gate passes.
- Do not add hosted services, AI inference, or private integrations to the core.

## Stage 0 — Public foundation

**Status:** Complete

**Outcome:** The public concept, boundaries, delivery plan, and contribution rules are durable.

Deliverables:

- [x] Public GitHub repository
- [x] Vercel deployment connected to `main`
- [x] Product concept and responsive explainer
- [x] MIT licence
- [x] Clean-room extraction boundary
- [x] Security and contribution policies
- [x] Architecture, roadmap, build plan, status, and changelog
- [x] Code of Conduct
- [x] Merge the Stage 0 documentation checkpoint

Acceptance gate:

- A new contributor can explain the product, constraints, stages, current status, and next implementation task using repository documentation only.

## Stage 1 — Schema and repository scanner

**Status:** Complete

**Outcome:** CanonKit can find governed Markdown documents and validate their metadata shape.

Deliverables:

- [x] TypeScript single-package foundation
- [x] Baseline unit test and Node LTS CI matrix
- [x] Public JSON Schema for document metadata
- [x] Markdown frontmatter parser
- [x] Repository-bounded file discovery
- [x] Normalised in-memory document model
- [x] Synthetic valid and invalid metadata fixtures

Acceptance gate:

- The scanner finds only eligible Markdown files inside the repository boundary.
- Valid fixtures produce a normalised document collection.
- Invalid metadata produces stable, actionable diagnostics.
- Tests pass on supported Node versions.

## Stage 2 — `canonkit validate`

**Status:** Complete

**Outcome:** A user can run one command and detect meaningful governance failures.

Deliverables:

- [x] `canonkit validate [path]`
- [x] Versioned document-model checkpoint before entity and decision lineage rules are locked
- [x] Required-field and allowed-value checks
- [x] Duplicate identity and competing-active-authority checks
- [x] Missing owner and overdue review checks
- [x] Broken relationship and supersession-cycle checks
- [x] Human-readable and JSON output with normalized diagnostics
- [x] Stable exit codes
- [x] Quiet CI mode that preserves warnings and failures

Acceptance gate:

- Valid fixtures exit successfully.
- Every broken fixture fails for the intended reason.
- Diagnostics identify the file, rule, severity, and remediation.
- No validation command mutates repository content.

## Stage 3 — Resolution and trust graph

**Status:** In progress — graph index, eligibility, list, and graph commands complete

**Outcome:** CanonKit can identify the governing source and explain the decision.

Deliverables:

- [x] `canonkit list`
- [x] `canonkit graph`
- `canonkit resolve <query>`
- [x] Deterministic fail-closed eligibility rules
- [x] Supersession and explicit-relation graph index
- Candidate ranking rules
- Graph conflict reporting
- Explain output showing selected and rejected candidates

Acceptance gate:

- Resolution is deterministic across repeated runs.
- Ineligible visibility and lifecycle states fail closed.
- The winning source and rejected alternatives are explainable.
- Authority cannot be inferred from filenames or modification dates alone.

## Stage 4 — Safe context packs

**Status:** Not started

**Outcome:** People and tools can consume a bounded, provenance-backed context pack.

Deliverables:

- `canonkit pack`
- Markdown and JSON formats
- Audience and visibility filtering
- Provenance on every included document
- Size and document-count limits
- Explicit opt-in for non-active material

Acceptance gate:

- Private or restricted content is excluded by default.
- Every included item carries identity, authority, lifecycle, and provenance.
- Pack limits are enforced deterministically.
- Document bodies are treated as untrusted data.

## Stage 5 — Public alpha

**Status:** Not started

**Outcome:** CanonKit is installable, documented, and usable outside its own repository.

Deliverables:

- npm alpha package
- Installation and quick-start documentation
- GitHub Actions integration example
- Threat model
- Cross-platform and supported-Node test matrix
- Tagged alpha release and changelog
- Feedback issue templates

Acceptance gate:

- A new user can install CanonKit and validate the synthetic example without repository-specific knowledge.
- Package contents contain no private material or local paths.
- Release provenance and checks are visible.

## Stage 6 — Adoption evidence and OSS application

**Status:** Not started

**Outcome:** The project has credible evidence of active maintenance and growth potential.

Deliverables:

- Documented external feedback
- Public usage examples
- Prioritised post-alpha issues
- Maintainer cadence and support expectations
- Vercel OSS application evidence pack

Acceptance gate:

- The repository shows active development, a functioning tool, a Code of Conduct, clear community standards, and measurable early interest or a credible adoption path.
