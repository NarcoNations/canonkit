# Stage 4 acceptance evidence

- **Date:** 2026-08-21
- **Baseline:** `495ba44` (`main` after Stage 4.3)
- **Scope:** Stage 4 safe context packs only
- **Verdict:** Pass

This checkpoint consolidates the evidence for Stage 4 without adding adapters, hosted services, private content, or a new product capability. In this document, “private” means material outside the public disclosure ceiling; CanonKit represents those explicit ceilings as `internal` and `restricted`.

## Roadmap acceptance

| Criterion | Evidence | Result |
| --- | --- | --- |
| Non-public content is excluded by default | `test/pack-projection.test.ts` proves public, internal, and restricted documents remain behind cumulative audience ceilings. Real-process tests prove `canonkit pack` defaults to public output. Filtering occurs before hidden paths, counts, or failures are returned. | Pass |
| Every item carries identity, authority, lifecycle, and provenance | Pack projection tests assert document identity, authority, status, visibility, source path, exact source byte count, SHA-256 digest, and an explicit untrusted-content marker. The versioned `1.0` envelope is locked by contract tests. | Pass |
| Pack limits are deterministic | Contract, projection, process, and output tests cover normalized hard limits, document overflow, exact UTF-8 body-byte overflow, the independent 8 MiB rendered-output ceiling, stable ordering, repeated output, and atomic failures with no partial pack. | Pass |
| Bodies are untrusted data | Every item is marked `untrusted_repository_content`. Markdown uses a body-specific fence that cannot be closed by the included body. JSON serialization keeps content as escaped data. Repository bodies never control policy, authority, paths, or ranking. | Pass |

## Security gate

The review found no Critical or High severity issue inside the Stage 4 boundary.

- The CLI imports no network, process-execution, telemetry, server, database, or model client capability.
- Discovery and pack construction remain repository-bounded and read-only.
- Selected sources are resolved again, read as strict UTF-8, reparsed, compared with the normalized collection, and hashed before output.
- A changed file or a selected path replaced by an escaping symlink fails atomically.
- Visibility and exact-scope filtering precede disclosure-sensitive paths, counts, and errors.
- YAML aliases, merge keys, duplicate keys, malformed frontmatter, unsupported schemas, file limits, and repository traversal are covered by earlier gates and remain in the complete suite.
- The static concept site has no third-party scripts, user input, storage, messaging, navigation, or dynamic HTML insertion. Its small inline script operates only on fixed local DOM elements.
- Dependency audit result: zero reported vulnerabilities at the configured High threshold.
- Package preview contains 78 intended files and no fixtures, tests, private documents, environment files, or local absolute paths.

A formal threat model and deployment-header review remain explicit Stage 5 deliverables. Local same-user filesystem races cannot be made transactional by this read-only CLI; the existing re-resolution, reparse, normalized comparison, and digest checks are the current defense, and the residual risk must be assessed in that threat model.

## Verification record

The checkpoint passed:

- lint and strict TypeScript checking
- 179 tests across 15 test files
- declaration and source-map build
- `npm audit --audit-level=high` with zero reported vulnerabilities
- package preview with 78 intended files
- production-only tarball installation with development dependencies absent
- production-only `validate` and Markdown/JSON `pack` CLI runs
- deterministic repeated packaged JSON output and JSON round-trip
- production-only public API import
- local documentation-link validation
- source audit for network, dynamic-code, process-execution, browser injection, and private-vocabulary patterns
- tracked source and synthetic fixture immutability checks
- supported Node.js 22 and 24 GitHub Actions matrix before merge

## Resumability gate

Stage 4 is complete. The exact next checkpoint is **Build-plan task 5.1 — threat model and public-alpha release boundary**. It should define assets, actors, trust boundaries, abuse cases, residual risks, the package publication boundary, and release-blocking controls before installation docs or publication work begins.
