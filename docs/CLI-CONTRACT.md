# CLI shell contract

## Purpose

The Stage 2.1 CLI exposes the existing repository collection through a minimal, deterministic, read-only process boundary. It adds no document-policy, relationship, authority-resolution, or mutation behaviour.

## Commands

```text
canonkit validate [path] [--format terminal|json]
canonkit --help
canonkit --version
```

`path` defaults to the current directory. Discovery still resolves and enforces the nearest Git repository boundary according to the discovery contract.

## Formats

`terminal` is the default. It reports the resolved repository, document counts, result, and collection diagnostics.

`json` emits a stable Stage 2.1 report envelope containing:

- CLI and collection format versions
- command and result
- repository and scan roots
- summary counts
- bounded document identity summaries
- collection diagnostics

JSON output deliberately excludes Markdown bodies and reporting-only raw metadata. Context export belongs to a later stage with explicit visibility policy.

## Exit codes

| Code | Meaning |
| --- | --- |
| `0` | Scan completed without document errors |
| `1` | Scan completed with document, read, parse, or discovery errors |
| `2` | Command usage error |
| `3` | Unexpected internal error |

Diagnostics go to standard output for completed validation reports. Usage and unexpected errors go to standard error.

## Safety boundary

- no files are modified
- no network requests or telemetry occur
- no document body can influence command behaviour
- reports expose bounded governance metadata but omit document bodies and reporting-only raw metadata
- no authority, lifecycle, relationship, or promotion decision is inferred beyond the Stage 1 collection contract

Stage 2.2 owns the first document policy rules. Stage 2.3 owns relationship rules.
