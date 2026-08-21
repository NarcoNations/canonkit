# Validate CLI contract

## Purpose

The CLI exposes repository collection and deterministic Stage 2.2 document policy through a minimal, read-only process boundary. It does not yet perform relationship graph validation, authority resolution, or mutation.

## Commands

```text
canonkit validate [path] [--format terminal|json]
canonkit --help
canonkit --version
```

`path` defaults to the current directory. Discovery still resolves and enforces the nearest Git repository boundary according to the discovery contract.

## Formats

`terminal` is the default. It reports the resolved repository, document counts, result, collection diagnostics, and document-policy diagnostics with remediation.

`json` emits a stable report envelope with `cliFormatVersion: "1.1"` containing:

- CLI and collection format versions
- command and result
- repository and scan roots
- summary counts
- bounded document identity summaries
- collection diagnostics
- document-policy format version, summary, and diagnostics

JSON output deliberately excludes Markdown bodies and reporting-only raw metadata. Context export belongs to a later stage with explicit visibility policy.

## Exit codes

| Code | Meaning |
| --- | --- |
| `0` | Scan and document policy completed without errors; warnings may exist |
| `1` | Validation found collection or document-policy errors |
| `2` | Command usage error |
| `3` | Unexpected internal error |

Diagnostics go to standard output for completed validation reports. Usage and unexpected errors go to standard error.

## Safety boundary

- no files are modified
- no network requests or telemetry occur
- no document body can influence command behaviour
- reports expose bounded governance metadata but omit document bodies and reporting-only raw metadata
- policy consumes explicit normalised fields only; no subject or authority is inferred
- relationship target and graph checks remain out of scope until Stage 2.3

The document rules are defined in [`DOCUMENT-POLICY-CONTRACT.md`](./DOCUMENT-POLICY-CONTRACT.md). Stage 2.3 owns relationship rules.
