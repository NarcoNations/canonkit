# Validate CLI contract

## Purpose

`canonkit validate` exposes bounded repository collection plus deterministic document and relationship policy through a read-only process boundary. It does not perform authority resolution or mutation.

## Commands

```text
canonkit validate [path] [--format terminal|json] [--quiet]
canonkit list [path] [...]
canonkit graph [path] [...]
canonkit resolve <query> [path] [...]
canonkit --help
canonkit --version
```

`path` defaults to the current directory. Discovery resolves and enforces the nearest Git repository boundary according to the discovery contract.

The list and graph command options and output envelopes are defined in [`GRAPH-CLI-CONTRACT.md`](./GRAPH-CLI-CONTRACT.md). Resolution is defined in [`RESOLVE-CLI-CONTRACT.md`](./RESOLVE-CLI-CONTRACT.md).

## Terminal format

Terminal is the default. It reports:

- one `VALID` or `INVALID` result
- resolved repository and document counts
- aggregate error and warning counts
- normalized diagnostics with phase, source location where known, related paths, and remediation

Terminal output is a human projection of the same report used for JSON; it does not recompute policy.

## JSON 2.0 contract

JSON emits one `cliReportFormatVersion: "2.0"` envelope:

| Field | Shape |
| --- | --- |
| `cliReportFormatVersion` | Exactly `"2.0"` |
| `command` | Exactly `"validate"` |
| `contracts` | Collection, document-policy, and relationship-policy format versions |
| `diagnostics` | One stable, ordered array across all validation phases |
| `documents` | Bounded document identity and governance summaries |
| `ok` | `true` when the aggregate report has no errors |
| `repositoryRoot` | Canonical repository path or `null` |
| `scanRoots` | Stable repository-relative roots |
| `summary` | Discovered, valid, invalid, error, and warning counts |

Every diagnostic contains:

- `code`, `severity`, `phase`, `path`, and `message`
- `location`, or `null` when no source token owns the failure
- stable `relatedPaths`
- actionable `remediation`

Diagnostics are ordered by path, location, code, and message. JSON deliberately excludes Markdown bodies and reporting-only raw metadata.

Breaking changes to this envelope require a new `cliReportFormatVersion`. Additive values must remain bounded and documented.

## Quiet mode

`--quiet` suppresses standard output only when validation has no errors and no warnings. Warning-bearing success and every failure still emit the selected terminal or JSON format. Exit codes never change because of quiet mode.

## Exit codes

| Code | Meaning |
| --- | --- |
| `0` | Collection and both policy layers completed without errors; warnings may exist |
| `1` | Validation found collection, document-policy, or relationship-policy errors |
| `2` | Command usage error |
| `3` | Unexpected internal error |

For `resolve`, code `0` requires one uniquely selected source. Ambiguous, ineligible-only, not-found, and validation-blocked results use code `1`.

Completed validation reports go to standard output. Usage and unexpected errors go to standard error.

## Safety boundary

- no files are modified
- no network requests or telemetry occur
- no document body can influence command behaviour
- reports expose bounded governance metadata but omit document bodies and reporting-only raw metadata
- policy consumes explicit normalized fields only; no subject or authority is inferred
- typed subject relations remain distinct from the validated document-supersession graph

The rules are defined in [`DOCUMENT-POLICY-CONTRACT.md`](./DOCUMENT-POLICY-CONTRACT.md) and [`RELATIONSHIP-POLICY-CONTRACT.md`](./RELATIONSHIP-POLICY-CONTRACT.md).
