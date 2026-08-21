# Pack CLI contract

Stage 4.3 exposes the safe projection library without duplicating its policy:

```text
canonkit pack [path]
  [--format markdown|json]
  [--audience public|internal|restricted]
  [--include-status draft|review|superseded|archived]
  [--scope <scope>]
  [--max-documents <n>]
  [--max-content-bytes <n>]
```

## Defaults

- path: current directory
- format: Markdown
- audience: public
- lifecycle: active only
- authority: canonical or approved only; no CLI option can widen it
- document budget: 25, hard maximum 100
- Markdown-body budget: 262,144 UTF-8 bytes, hard maximum 1,048,576
- rendered process output: hard maximum 8,388,608 UTF-8 bytes

`--include-status` is repeatable and additive. It cannot name `active`, because active is already the only implicit lifecycle. `--scope` is an exact stable lower-case identity and does not infer a hierarchy.

Pack uses `--audience`, not the graph commands' repeatable `--allow-visibility`. It uses explicit pack budgets, not `--limit`. Unsupported or cross-command options are usage errors.

## Success output

Markdown success writes the injection-safe projection from `renderContextPackMarkdown()`. JSON success writes the versioned `ContextPack` envelope directly. Both end with one newline and contain the same selected items, policy, budgets, and provenance.

The command writes to standard output only. It does not edit source documents or create an output file.

## Failure output

Pack construction failures exit `1` and return no partial pack. JSON failures use a small versioned report:

```json
{
  "cliReportFormatVersion": "1.0",
  "command": "pack",
  "error": {
    "code": "CKX002_EMPTY",
    "message": "No documents are permitted by the requested pack policy.",
    "remediation": "Adjust the audience, exact scope, or explicit lifecycle opt-ins without widening authority."
  },
  "ok": false,
  "summary": {
    "consideredContentBytes": 0,
    "consideredDocuments": 0
  }
}
```

Markdown failures provide the same code, message, remediation, and permitted-selection counts in a concise readable form.

| Code | Meaning |
| --- | --- |
| `CKX001_VALIDATION_REQUIRED` | Complete validation did not pass; no document paths are exposed |
| `CKX002_EMPTY` | No document is permitted by the requested policy |
| `CKX003_DOCUMENT_LIMIT_EXCEEDED` | Complete permitted selection exceeds the document budget |
| `CKX004_CONTENT_BYTES_EXCEEDED` | Complete permitted selection exceeds the body budget |
| `CKX005_SOURCE_INTEGRITY_ERROR` | A permitted source is stale, missing, changed, or outside the repository boundary |
| `CKX006_OUTPUT_BYTES_EXCEEDED` | The rendered result exceeds the fixed process-output ceiling |

Usage errors exit `2` on standard error. Unexpected internal failures exit `3` on standard error. Successful packs exit `0`.

## Disclosure and determinism

- Visibility and exact scope are applied before any path or count is emitted.
- Non-governing authority remains excluded even with every supported opt-in.
- Validation and output failures never emit selected bodies or partial items.
- Repeated commands over unchanged source and identical options produce identical standard output.
- JSON contains no absolute repository root, raw reporting metadata, timestamp, or random identifier.
- Markdown keeps every repository body inside a body-specific untrusted-content fence.
