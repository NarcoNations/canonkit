# Frontmatter parser contract

Stage 1.3 exposes `parseMarkdownFrontmatter(markdown, options)` from the package root. It parses one in-memory Markdown string; filesystem discovery belongs to Stage 1.4.

```ts
import { parseMarkdownFrontmatter } from '@narconations/canonkit';

const result = parseMarkdownFrontmatter(markdown, {
  path: 'docs/architecture.md',
  maxFileBytes: 1_048_576,
});

if (result.ok) {
  console.log(result.document.metadata);
  console.log(result.document.body);
} else {
  console.error(result.diagnostics);
}
```

## Behaviour

- Input is measured as UTF-8 bytes before parsing. The default maximum is 1 MiB.
- A leading UTF-8 byte-order mark is accepted.
- One leading YAML frontmatter envelope is required.
- Metadata must satisfy its declared public `1.0` or `1.1` JSON Schema.
- The Markdown body is returned unchanged and never interpreted as metadata or instructions.
- Ordinary document failures return diagnostics; they do not throw.
- Invalid parser configuration, such as a non-positive byte limit, throws `RangeError`.
- The parser performs no filesystem writes, network requests, model calls, or policy decisions.

YAML merge keys are disabled, aliases are rejected during conversion, and duplicate keys fail parsing. These constraints keep expansion bounded and prevent ambiguous metadata.

## Diagnostic codes

| Code | Meaning |
| --- | --- |
| `CKP001_FILE_TOO_LARGE` | UTF-8 input exceeds the configured byte limit |
| `CKP002_FRONTMATTER_MISSING` | No leading YAML frontmatter envelope |
| `CKP003_FRONTMATTER_UNCLOSED` | Missing closing delimiter |
| `CKP004_FRONTMATTER_MULTIPLE` | A second leading metadata envelope was found |
| `CKP005_YAML_INVALID` | YAML is malformed, ambiguous, or uses rejected aliases |
| `CKP006_METADATA_NOT_OBJECT` | Parsed frontmatter is not an object |
| `CKP007_SCHEMA_VERSION_UNSUPPORTED` | `schema_version` is present but is not `1.0` or `1.1` |
| `CKP008_METADATA_INVALID` | Metadata fails the public JSON Schema |

Every diagnostic includes the supplied path and a one-based Markdown line and column. When a missing field has no exact source token, its location falls back to the start of the frontmatter content.
