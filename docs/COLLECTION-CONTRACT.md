# Normalised collection contract

Stage 1.5 exposes `scanRepository(startPath, options)` from the package root. It composes bounded repository discovery, UTF-8 file reading, frontmatter parsing, schema validation, and normalisation into one deterministic result.

```ts
import { scanRepository } from '@narconations/canonkit';

const collection = await scanRepository('./docs', {
  excludePaths: ['docs/archive'],
  maxDocuments: 10_000,
  maxFileBytes: 1_048_576,
  maxTotalBytes: 33_554_432,
});

console.log(collection.documents);
console.log(collection.diagnostics);
console.log(collection.summary);
```

## Result shape

Every result contains:

- `collectionFormatVersion: "1.0"`
- `ok`, which is true only when there are no error diagnostics
- the canonical `repositoryRoot`, or `null` when discovery could not establish one
- stable repository-relative `scanRoots`
- validated `documents` in stable path order
- stable `diagnostics` from discovery, reading, and parsing
- counts for discovered, valid, invalid, and error results

The complete result contains only JSON-safe values. Ordinary repository, file, YAML, and schema failures become diagnostics and do not prevent valid neighbouring documents from appearing. Invalid caller configuration still throws before scanning.

Repository Markdown has a 32 MiB default aggregate byte budget and a fixed 256 MiB hard maximum. Files are read only up to the smaller remaining per-file or aggregate budget, so a single oversized file is not loaded without bound. Aggregate overflow returns `CKS003_TOTAL_BYTES_EXCEEDED` with no documents or partial diagnostics. Library callers may lower the budget or raise it only within the hard maximum.

## Normalised documents

Each document copies the validated governance fields into a fixed model:

- identity: `id`, `title`, `version`, and nullable document `kind`
- governance: `status`, `authority`, `owner`, `visibility`, and nullable `scope`
- governed identity: `subjects`, human-readable `aliases`, and typed `relations`
- document relationships and review: `supersedes`, nullable `reviewAfter`, and `tags`
- contract provenance: `schemaVersion`
- provenance: repository-relative source `path` and UTF-8 file `bytes`
- untrusted Markdown `body`

Missing optional arrays become empty arrays and missing optional scalar fields become `null`, so callers never need to infer meaning from `undefined`.

Version `1.0` remains supported without inference: its normalised `kind` is `null`, while `subjects`, `aliases`, and `relations` are empty arrays. Version `1.1` carries only the identities and relationships explicitly declared in metadata.

The validated source metadata is copied to `reporting.rawMetadata`. It exists for transparent reporting only. Later authority and policy code must consume the explicit normalised fields and must not infer additional authority from unknown or raw metadata.

## Unified diagnostics

Every diagnostic has a stable code, `error` severity, phase, repository-relative path where available, message, and a one-based source location or `null`.

Discovery and parser codes retain their existing meanings. The collection layer adds:

| Code | Meaning |
| --- | --- |
| `CKS001_FILE_READ_ERROR` | A discovered document could not be read |
| `CKS002_INVALID_UTF8` | A document is not valid UTF-8 |
| `CKS003_TOTAL_BYTES_EXCEEDED` | Repository Markdown exceeded the aggregate byte budget; the collection is empty |

The collection layer performs no writes, network requests, authority ranking, relationship evaluation, or CLI behaviour.
