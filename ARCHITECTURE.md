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
