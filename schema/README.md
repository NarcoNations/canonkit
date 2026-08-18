# Schema

[`canonkit-document.schema.json`](./canonkit-document.schema.json) is the public metadata contract for a CanonKit-governed Markdown document. It uses JSON Schema Draft 2020-12.

## Minimal metadata

```yaml
schema_version: "1.0"
id: guides/getting-started
title: Getting started
status: draft
authority: reference
owner: documentation
version: "0.1"
visibility: public
```

## Complete metadata

```yaml
schema_version: "1.0"
id: architecture/authentication
title: Authentication architecture
status: active
authority: canonical
owner: platform
version: "2.1"
visibility: internal
scope: architecture/authentication
supersedes:
  - architecture/authentication@1.0
  - decisions/session-storage
review_after: "2027-02-01"
tags:
  - architecture
  - security
```

## Contract

| Field | Required | Allowed value or shape |
| --- | --- | --- |
| `schema_version` | Yes | Exactly `"1.0"` |
| `id` | Yes | Stable lower-case repository-local identity |
| `title` | Yes | Non-empty human-readable title |
| `status` | Yes | `draft`, `review`, `active`, `superseded`, or `archived` |
| `authority` | Yes | `canonical`, `approved`, `reference`, `derived`, or `unverified` |
| `owner` | Yes | Non-empty accountable person, role, or team |
| `version` | Yes | Non-empty human-readable document version |
| `visibility` | Yes | `public`, `internal`, or `restricted` |
| `scope` | No | Lower-case repository-local governance area |
| `supersedes` | No | Unique identities, optionally followed by `@version` |
| `review_after` | No | ISO 8601 calendar date (`YYYY-MM-DD`) |
| `tags` | No | Unique lower-case discovery labels |

Unknown fields fail validation. This prevents misspellings or unsupported metadata from being silently ignored.

## Version compatibility

The Stage 1 contract supports exactly `schema_version: "1.0"`. A missing or different version fails closed. A future contract change must publish a new schema and document its migration and compatibility policy before the supported value changes.

The schema validates metadata shape only. Lifecycle, authority, ownership, visibility, and relationship policy belongs to later deterministic validation stages.
