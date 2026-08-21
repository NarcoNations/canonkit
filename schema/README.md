# Schema

CanonKit supports two versioned JSON Schema Draft 2020-12 metadata contracts:

- [`canonkit-document.schema.json`](./canonkit-document.schema.json) — compatibility contract `1.0`
- [`canonkit-document-v1.1.schema.json`](./canonkit-document-v1.1.schema.json) — current contract `1.1`

## Recommended 1.1 metadata

```yaml
schema_version: "1.1"
id: canon/service-boundary
kind: canon
title: Service boundary
status: active
authority: canonical
owner: platform
version: "2.0"
visibility: internal
scope: architecture/services
subjects:
  - services/primary
aliases:
  - Primary service
relations:
  - type: evolved_from
    target: services/legacy
supersedes:
  - canon/service-boundary@1.0
review_after: "2027-02-01"
tags:
  - architecture
```

## 1.1 contract

| Field | Required | Allowed value or shape |
| --- | --- | --- |
| `schema_version` | Yes | Exactly `"1.1"` |
| `id` | Yes | Stable lower-case document identity |
| `kind` | Yes | `canon`, `decision`, `policy`, or `reference` |
| `title` | Yes | Non-empty human-readable title |
| `status` | Yes | `draft`, `review`, `active`, `superseded`, or `archived` |
| `authority` | Yes | `canonical`, `approved`, `reference`, `derived`, or `unverified` |
| `owner` | Yes | Accountable person, role, or team |
| `version` | Yes | Non-empty human-readable document version |
| `visibility` | Yes | `public`, `internal`, or `restricted` |
| `scope` | No | Lower-case repository-local governance area |
| `subjects` | For `canon` and `decision` | Stable identities for governed or affected things |
| `aliases` | No | Unique historical or alternative human-readable names |
| `relations` | No | Typed identity relations: `part_of`, `governed_by`, `decided_by`, `evolved_from`, `replaces`, or `related_to` |
| `supersedes` | No | Document identities, optionally followed by `@version`, replaced by this version |
| `review_after` | No | ISO 8601 calendar date (`YYYY-MM-DD`) |
| `tags` | No | Unique lower-case discovery labels |

Unknown fields fail validation. Relationship target existence and graph validity belong to Stage 2.3 rather than schema-shape validation.

## Model boundary

`id` identifies the document. `subjects` identify what the document governs or affects. `supersedes` replaces an earlier document or document version. `relations` describe explicit subject or governance lineage and do not imply document supersession.

This separation prevents a renamed product, service, policy area, or other governed subject from being confused with the Markdown file that records its canon.

## Compatibility and migration

CanonKit continues to accept `schema_version: "1.0"` unchanged. It does not infer a kind, subject, alias, or relation for a 1.0 document.

To migrate a 1.0 document:

1. change `schema_version` to `"1.1"`
2. add an explicit `kind`
3. add one or more stable `subjects` when `kind` is `canon` or `decision`
4. add aliases and typed relations only when explicitly known
5. retain `supersedes` only for document-version replacement

The schema validates metadata shape only. Deterministic document policy is defined in [`docs/DOCUMENT-POLICY-CONTRACT.md`](../docs/DOCUMENT-POLICY-CONTRACT.md).
