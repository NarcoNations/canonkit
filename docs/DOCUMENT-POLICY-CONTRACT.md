# Document policy contract

Stage 2.2 exposes `validateDocumentPolicies(documents, options)` and runs it automatically after a successful repository scan in `canonkit validate`.

The policy layer is deterministic, read-only, body-blind, and network-disabled. It consumes only explicit normalised metadata. It does not infer subjects for 1.0 documents or evaluate relationship targets and cycles; the separate relationship policy owns those rules.

## Rules

| Code | Severity | Rule |
| --- | --- | --- |
| `CKV001_DUPLICATE_DOCUMENT_VERSION` | Error | An `id@version` pair may appear only once |
| `CKV002_ACTIVE_OWNER_MISSING` | Error | Active canonical or approved documents require a non-blank owner |
| `CKV003_REVIEW_OVERDUE` | Warning | `review_after` is earlier than the validation date |
| `CKV004_ACTIVE_SCOPE_MISSING` | Error | Active canonical or approved documents require an explicit scope |
| `CKV005_COMPETING_ACTIVE_AUTHORITY` | Error | A 1.1 subject may not have multiple active canonical `canon` documents |
| `CKV006_VISIBILITY_CONFLICT` | Error | Active canonical or approved `canon` documents for one subject must share visibility |

Diagnostics include the primary path, related paths, a stable code, severity, message, and remediation. Ordering is deterministic by path and code.

Warnings appear in reports but do not make validation fail. Any policy error makes the CLI exit with code `1`.

## Date boundary

Production validation compares `review_after` with the current UTC calendar date. Tests and library callers may inject an ISO date through `options.today` for deterministic results.

## Safety boundary

- no repository content is edited
- Markdown bodies cannot influence policy
- no authority, subject, or relationship is invented
- document supersession remains distinct from subject lineage
- private or organisation-specific policy language is not embedded in the engine
