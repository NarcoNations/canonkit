# Relationship policy contract

Stage 2.3 exposes `validateRelationshipPolicies(documents)` and runs it automatically in `canonkit validate` after collection and document policy.

The policy validates the explicit document supersession graph. It is deterministic, read-only, body-blind, and network-disabled.

## Reference semantics

`supersedes` accepts either a document identity or an exact `identity@version` reference.

- an exact reference must match that version
- an identity-only reference must match at least one collected document with that identity
- a document replacing an earlier version of itself must use the exact earlier `identity@version`
- an identity-only reference matching the source document is rejected as ambiguous self-supersession

The scanned collection is the validation boundary. References outside it are missing rather than silently assumed to exist.

## Rules

| Code | Severity | Rule |
| --- | --- | --- |
| `CKR001_SUPERSESSION_TARGET_MISSING` | Error | Every supersession target must exist in the collection |
| `CKR002_SELF_SUPERSESSION` | Error | A document cannot supersede itself or use its own unversioned identity |
| `CKR003_SUPERSESSION_CYCLE` | Error | The supersession graph must be acyclic |
| `CKR004_SUPERSEDED_TARGET_ACTIVE` | Error | A document targeted by `supersedes` cannot remain active |
| `CKR005_SUPERSEDED_DOCUMENT_UNREFERENCED` | Error | A document marked superseded must have an incoming supersession edge |
| `CKR006_MULTIPLE_CURRENT_VERSIONS` | Error | One document identity may have only one active version |

Diagnostics identify the primary path, related paths, stable code, severity, message, and remediation. Ordering is deterministic by path, code, and message.

## Typed subject relations

Schema 1.1 `relations` remain explicit graph input, but Stage 2.3 does not treat them as document supersession. A relation target may describe historical or external subject identity that has no document in the scanned collection. CanonKit therefore does not infer missing-document failures, lifecycle changes, or supersession edges from typed subject relations.

## Safety boundary

- no repository content is edited
- no graph edge is inferred from filenames, aliases, modification dates, or Markdown bodies
- unresolved supersession fails closed
- diagnostics explain every rejected relationship state
- private or organisation-specific graph rules are not embedded in the engine
