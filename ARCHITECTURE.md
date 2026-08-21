# CanonKit architecture

## Purpose

CanonKit is a local-first trust layer for repository documentation. Its core turns governed Markdown files into deterministic validation results, authority decisions, relationship graphs, and bounded context packs.

The architecture intentionally avoids a server, database, dashboard, model dependency, and network requirement.

## System boundary

```text
repository Markdown
       |
       v
file discovery -> frontmatter parser -> schema validation
       |                                  |
       +----------------+-----------------+
                        v
             normalised document model
                        |
              +---------+----------+
              |                    |
              v                    v
         policy engine        trust graph
              |                    |
              +---------+----------+
                        v
             CLI reports and safe packs
```

## Decisions

### ADR-001 — One package before a monorepo

Use a single TypeScript package until a second independently releasable package exists.

Why:

- keeps installation, testing, and publishing simple
- avoids workspace and release orchestration before it is needed
- allows later extraction of adapters without destabilising the core

Expected layout:

```text
src/
  cli/
  discovery/
  metadata/
  policy/
  graph/
  output/
schema/
fixtures/
test/
```

### ADR-002 — Node.js and TypeScript

Use supported Node.js LTS releases and strict TypeScript. Prefer standard library APIs for argument parsing, filesystem access, paths, and process control.

Why:

- matches the intended npm distribution
- works in local development and CI without a service runtime
- keeps the implementation accessible to the target developer audience

### ADR-003 — Markdown with YAML frontmatter

Govern existing Markdown rather than introducing a proprietary document format. Parse YAML with a small maintained parser rather than a handwritten implementation.

The public metadata contract will be expressed as JSON Schema and versioned independently from the CLI package.

Initial conceptual fields:

| Field | Purpose |
| --- | --- |
| `schema_version` | Metadata contract version |
| `id` | Stable document identity |
| `title` | Human-readable title |
| `status` | Draft, review, active, superseded, or archived lifecycle |
| `authority` | Canonical, approved, reference, derived, or unverified role |
| `owner` | Accountable maintainer or team |
| `version` | Human-readable document version |
| `visibility` | Public, internal, or restricted access class |
| `scope` | Area in which the document may govern |
| `supersedes` | Stable identities or versions replaced by this document |
| `review_after` | Optional review deadline |
| `tags` | Optional discovery labels |

The exact names and allowed values are defined by the versioned schemas in [`schema/`](./schema/). Policy semantics remain outside the schema and are proven through deterministic tests.

### ADR-004 — Deterministic policy before optional AI

Core decisions must be reproducible from metadata and explicit policy. Document bodies are untrusted data and never become instructions to CanonKit.

The core will not call a model. Any future AI adapter must consume bounded core output and remain an optional package outside the decision path.

### ADR-005 — Read-only by default

Discovery, validation, resolution, graph, and pack commands do not edit repository files.

Any future fix command must:

- be separately invoked
- show the proposed change first
- stay inside the resolved repository boundary
- avoid overwriting content without an explicit flag
- preserve a reviewable Git diff

### ADR-006 — Fail-closed visibility

Unknown visibility is not treated as public. Context packs exclude internal, restricted, archived, superseded, or unverified material unless the caller explicitly requests a supported opt-in and policy permits it.

### ADR-007 — Explain every authority decision

Resolution output must identify:

- the selected document
- the rules that made it eligible
- the ranking factors that selected it
- the candidates rejected and why
- the provenance used

Modification time and filename alone never establish authority.

### ADR-008 — Separate documents from governed subjects

Schema `1.1` separates a Markdown document's stable `id` from the stable `subjects` it governs or affects.

- `kind` identifies the document role: canon, decision, policy, or reference
- `subjects` identify governed things independently of filenames and document versions
- `aliases` preserve historical and alternative human-readable discovery names
- typed `relations` express explicit subject or governance lineage
- `supersedes` remains document-version replacement only

Canon and decision documents require at least one explicit subject. CanonKit continues to accept schema `1.0` but does not infer any 1.1 fields for legacy documents.

Why:

- product or service evolution is not the same event as replacing a document
- decisions can affect a subject without becoming its competing canon
- aliases aid retrieval without becoming identities or authority signals
- explicit typed relations create a bounded input for later graph validation

### ADR-009 — Supersession is a closed document graph

Stage 2.3 validates `supersedes` only against documents present in the scanned collection. Exact `id@version` references resolve one version; unversioned identities resolve the collected document identity. A document replacing an earlier version of itself must name that earlier version explicitly.

The graph must be acyclic, every superseded document must have an incoming replacement edge, a replaced target cannot remain active, and one document identity cannot have multiple active versions.

Typed schema 1.1 subject relations do not become document-supersession edges. Their targets may be historical or external subject identities, so CanonKit does not invent documents or lifecycle changes from them.

Why:

- closed resolution makes validation repeatable and fail-closed
- exact same-identity version references avoid ambiguous self-supersession
- lifecycle consistency preserves an auditable replacement chain
- subject evolution remains independent of file replacement

### ADR-010 — One normalized validation report

Stage 2.4 combines collection, document-policy, and relationship-policy results into a versioned CLI report `2.0` envelope. Every diagnostic carries a phase, stable code, severity, path, optional location, related paths, message, and remediation.

Terminal output is a concise projection of that same report. JSON is the full machine contract. Quiet mode suppresses output only when there are no errors or warnings; diagnostic-bearing success and all failures remain visible.

Why:

- one aggregate summary prevents consumers from miscounting separate layers
- one diagnostic shape keeps CI and integrations simple
- versioned output makes future breaking changes explicit
- warning-preserving quiet mode avoids hiding maintenance signals

### ADR-011 — Graph indexing is deterministic and eligibility is fail-closed

Stage 3.1 builds one JSON-safe graph over normalized documents only after collection and both policy layers pass. Repository-relative source paths are unambiguous graph node IDs; stable document identity, version, and subject remain separate indexes.

The graph preserves explicit supersession and typed relation metadata but never reads Markdown bodies or invents relation sources. Every node stays visible for audit, while eligibility excludes anything that is not active, canonical or approved, explicitly visible to the caller, and—when requested—in the exact scope.

Public visibility is the default. Internal and restricted material require explicit caller opt-in. Authority eligibility cannot be widened beyond canonical and approved.

Why:

- source paths avoid ambiguous composite keys when document versions are human-readable
- retained excluded nodes preserve audit evidence without promoting them
- explicit visibility opt-in prevents accidental disclosure
- exact scope matching avoids unsupported hierarchy inference
- separating eligibility from ranking keeps Stage 3 decisions reviewable

### ADR-012 — CLI graph projections preserve visibility before audit detail

Stage 3.2 exposes the validated graph through two bounded projections. `list` contains eligible nodes only. `graph` retains lifecycle- and authority-excluded nodes for audit, but removes every visibility- or scope-excluded node before applying node and edge limits.

Public is the only implicit visibility. Any internal or restricted projection requires an explicit repeatable option naming every included class. Invalid collections emit a generic validation-required result without document paths or partial graph data. Successful outputs remain body-free, deterministically ordered, versioned, and read-only.

Why:

- visibility and scope are disclosure boundaries, not merely ranking signals
- retaining safe excluded history explains lifecycle without promoting it
- complete validation prevents a broken repository from yielding misleading partial truth
- hard limits keep CLI and integration output predictable
- list and graph inspection remain separate from future candidate resolution

### ADR-013 — Resolution uses lexicographic policy and never arbitrary tie-breakers

Stage 3.3 resolves an explicit query against graph subjects, document identities, and normalized exact aliases. Candidates are compared by match type, then document role, then governing authority. Only graph-eligible nodes may be selected.

Subject matches outrank document-identity matches, which outrank aliases. Canon outranks policy, decision, reference, and legacy roles; canonical outranks approved within an otherwise equal rank. An equal complete top rank is an ambiguity, not permission to choose by path, filename, version text, modification time, body content, or input order.

Every matching node remains in the result with its disposition and reasons. Ineligible nodes preserve upstream graph exclusions; eligible lower-ranked nodes identify the first decisive policy dimension.

Why:

- explicit governed subjects are stronger evidence than discovery labels
- document role prevents an incidental decision from displacing available canon
- ambiguity is a governance condition that requires a human-authored distinction
- excluding operational metadata prevents accidental authority inference
- candidate-level explanations make selection auditable and testable

### ADR-014 — Process resolution removes disclosure-excluded nodes before matching

Stage 3.4 exposes resolution through `canonkit resolve <query> [path]`. The command validates the complete repository and constructs the requested eligibility graph, then removes visibility- and scope-excluded nodes before passing the graph to the Stage 3.3 resolver.

Lifecycle- and authority-ineligible nodes remain available for safe explanations. Visibility- and scope-ineligible nodes do not participate in matching and cannot reveal their identity or existence through a default public or mismatched-scope query. A command succeeds only for one uniquely selected candidate; ambiguity, ineligible-only matches, no match, and invalid repositories fail closed.

Candidate limits apply after complete permitted resolution. The selected node remains explicit, while summary counts and truncation state describe the complete permitted result.

Why:

- visibility and scope are disclosure boundaries, not rejection details
- lifecycle history is useful audit evidence when the caller may see it
- full evaluation before truncation keeps authority decisions stable
- non-zero ambiguity and no-result exits make automation fail safely
- one shared resolver prevents terminal and JSON policy drift

### ADR-015 — Context packs are deterministic, provenance-backed, and atomic

Stage 4.1 fixes a versioned pack envelope and normalized policy before generation. Packs default to public, active, canonical or approved documents. Audience acts as a cumulative disclosure ceiling, exact scope never implies hierarchy, and each non-active lifecycle requires explicit opt-in. Non-governing authorities cannot be opted into pack authority.

Every item retains normalized governance metadata, a repository-relative source path, exact source-file byte count and SHA-256 digest, and an explicit untrusted-content marker. Absolute paths, timestamps, raw reporting metadata, and hidden document details are excluded.

Document and exact UTF-8 Markdown-body budgets have conservative defaults and fixed hard maxima. Selection is completed before limits are applied. Overflow, invalid repositories, empty permitted selections, or source-integrity failures return no pack; bodies are never clipped and partial packs are never emitted.

Why:

- disclosure boundaries must apply before paths, counts, or explanations are exposed
- exact source digests make provenance independently verifiable
- atomic failure prevents a size limit from silently changing the apparent canon
- conservative hard caps bound downstream tool context and memory use
- stable, timestamp-free envelopes permit reproducible outputs

## Core modules

### Discovery

- resolve the nearest Git repository root from an explicit start path
- include configured repository-relative Markdown paths
- ignore `.git`, dependencies, generated output, nested repositories, symlinks, and configured exclusions
- reject configured paths that escape the canonical repository root
- return stable repository-relative path ordering

### Metadata

- parse YAML frontmatter
- validate against the declared schema version
- normalise values without inventing missing authority
- retain source file and diagnostic locations

### Normalised collection

- compose discovery and parsing without hiding neighbouring file failures
- copy validated governance fields into a stable serialisable model
- represent missing optional values explicitly with `null` or empty arrays
- retain raw metadata under a reporting-only boundary
- keep document bodies untrusted and separate from governance decisions
- combine discovery, read, and parse failures into stable diagnostics

### Policy

- evaluate lifecycle, authority, ownership, review, and visibility rules
- emit stable diagnostic codes and severities
- avoid project-specific terms in the core

### Trust graph

- index documents by stable identity and version
- model supersession edges
- detect missing targets and cycles
- expose competing active authorities

### Output

- terminal output for people
- JSON output for CI and integrations
- Markdown and JSON context packs
- stable exit codes for automation

## Security properties

- no network access in the core
- no telemetry
- no dynamic code execution
- no following paths outside the repository boundary
- bounded file size, document count, and pack size
- fail-closed visibility
- read-only default commands
- synthetic tests only in the public repository

`SECURITY.md` owns vulnerability reporting. A detailed threat model is a Stage 5 release requirement.

## Explicit non-goals for v0.1

- hosted control plane
- browser dashboard
- database persistence
- user accounts or SSO
- model-based document scoring
- automatic promotion to canonical status
- organisation-specific policy language
- IDE or MCP integrations

These may be evaluated only after the public alpha proves the core contract.
