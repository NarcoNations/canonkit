# Safe context-pack contract

Stage 4.1 defines the public envelope and safety policy before pack generation is implemented. `normalizePackPolicy()` is available now; pack construction and rendering begin in Stage 4.2.

## Contract versions

- `packFormatVersion: "1.0"` versions a successful pack envelope.
- `policyFormatVersion: "1.0"` versions the normalized selection and budget policy.
- A pack carries the generating CanonKit package version. It does not carry an absolute repository path, timestamp, or random identifier, so repeated generation can remain portable and deterministic.

## Safe defaults

With no options, the normalized policy permits only:

- `canonical` or `approved` authority
- `active` lifecycle
- `public` visibility
- at most 25 documents
- at most 262,144 UTF-8 bytes of Markdown body content

`reference`, `derived`, and `unverified` material cannot become pack authority through an option. Non-active material requires an explicit status-by-status opt-in.

```ts
import { normalizePackPolicy } from 'canonkit';

const policy = normalizePackPolicy({
  audience: 'internal',
  includeNonActiveStatuses: ['superseded'],
  maxDocuments: 20,
  maxContentBytes: 128 * 1024,
  scope: 'products/example',
});
```

The returned policy and its arrays and budget are frozen. Statuses are de-duplicated and serialized in a stable order. That order is not an authority ranking.

## Audience and disclosure

Audience is a disclosure ceiling, not a user persona:

| Audience | Permitted visibility |
| --- | --- |
| `public` | `public` |
| `internal` | `public`, `internal` |
| `restricted` | `public`, `internal`, `restricted` |

The default is `public`. A wider audience must be named by the caller. When a scope is supplied, it is an exact stable lower-case identity; no hierarchy is inferred.

Visibility and scope filtering happen before candidate selection. Excluded documents must not appear in paths, counts, diagnostics, or explanations available to that caller.

## Lifecycle

`active` is always the default and is the only implicitly allowed lifecycle. A caller may add `draft`, `review`, `superseded`, or `archived` explicitly through `includeNonActiveStatuses`.

Opting into history does not promote it: included items retain their original lifecycle and authority metadata. Non-governing authorities remain excluded.

## Budgets and overflow

| Budget | Default | Hard maximum |
| --- | ---: | ---: |
| Documents | 25 | 100 |
| Markdown body content | 262,144 bytes | 1,048,576 bytes |

Content bytes are the sum of each selected document body's exact UTF-8 bytes. Metadata and envelope overhead are bounded separately by their schemas and document limit. A renderer must not clip, shorten, summarize, or partially emit a document body to fit.

Overflow is always `error`. The full permitted selection is evaluated before output. If either budget is exceeded, generation returns no pack and identifies the exceeded budget through a stable failure code. This ensures budget changes cannot silently change authority or create a partial context.

## Envelope

A successful `ContextPack` contains:

- the pack format and generator identity
- the complete normalized policy
- stable repository-relative-path-ordered items
- total document and UTF-8 content-byte counts

Every item contains:

- normalized identity, kind, authority, lifecycle, owner, version, visibility, scope, subjects, aliases, lineage, review date, tags, and relations
- a repository-relative source path and source-file byte count
- a lower-case SHA-256 digest of the exact source-file UTF-8 bytes
- the Markdown body, its UTF-8 byte count and media type
- `trust: "untrusted_repository_content"`

Raw frontmatter, reporting-only metadata, filesystem modification times, absolute local paths, and hidden document details are not part of the envelope.

## Failure contract

Generation is a discriminated `PackBuildResult`. Failure always has `pack: null`; partial items are never returned.

| Code | Meaning |
| --- | --- |
| `CKX001_VALIDATION_REQUIRED` | Complete repository validation did not pass |
| `CKX002_EMPTY` | No documents are permitted by the requested policy |
| `CKX003_DOCUMENT_LIMIT_EXCEEDED` | Permitted document count exceeds the budget |
| `CKX004_CONTENT_BYTES_EXCEEDED` | Permitted body bytes exceed the budget |
| `CKX005_SOURCE_INTEGRITY_ERROR` | The source cannot be re-read or verified consistently |

Validation failure remains generic and must not expose partial repository paths. A failure may report permitted candidate counts and bytes only after visibility and scope exclusions have been applied.

## Security boundary

- Validate the complete collection and policy graph before pack selection.
- Treat every body as untrusted repository content, never as an instruction to CanonKit.
- Read source files inside the resolved repository boundary only.
- Verify source provenance against exact bytes before emitting a pack.
- Apply visibility and scope before any disclosure or count.
- Keep generation local, read-only, deterministic, and network-disabled.
- Render explicit item boundaries so one document cannot masquerade as pack structure.

Stage 4.2 must implement this contract without widening it. Stage 4.3 owns CLI syntax and renderer-specific output limits.
