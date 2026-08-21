# Resolve CLI contract

## Purpose

`canonkit resolve` exposes the deterministic resolution engine through a bounded, read-only process boundary. It validates the repository, constructs the caller's permitted graph projection, resolves one explicit query, and explains the result.

## Command

```text
canonkit resolve <query> [path] [--format terminal|json] [--allow-visibility <value>] [--scope <scope>] [--limit <n>]
```

- `query` is required, must be quoted when it contains shell whitespace, and is limited to 160 normalized characters.
- `path` defaults to the current directory.
- `--allow-visibility` is repeatable and accepts `public`, `internal`, or `restricted`. Omission means public only; every wider class must be named explicitly.
- `--scope` requires an exact lower-case scope identity and does not infer hierarchy.
- `--limit` bounds returned candidates from 1 to 1000 and defaults to 100. Resolution evaluates the complete permitted graph before candidate output is truncated.
- `--format` accepts `terminal` or `json` and defaults to terminal.

## Processing boundary

The command runs the complete pipeline in order:

1. bounded repository discovery and parsing
2. document and relationship policy validation
3. trust graph construction with the caller's visibility and scope policy
4. removal of visibility- and scope-excluded nodes
5. deterministic resolution through the Stage 3.3 contract
6. bounded terminal or JSON projection

Invalid repositories stop before graph construction and emit the generic `CKC001_VALIDATION_REQUIRED` result. They do not expose partial document paths or candidates. A hidden visibility or mismatched-scope candidate is removed before query matching, so the command does not reveal that it exists.

## Results and exit codes

| Resolution status | `ok` | Exit | Meaning |
| --- | --- | --- | --- |
| `resolved` | `true` | `0` | One permitted eligible candidate owns the highest rank |
| `ambiguous` | `false` | `1` | Multiple permitted eligible candidates share the top rank |
| `unresolved` | `false` | `1` | Matches exist, but all are lifecycle- or authority-ineligible |
| `not_found` | `false` | `1` | No permitted candidate matches |

Usage errors exit `2`; unexpected internal errors exit `3`. Validation failures also exit `1` with the generic failure envelope.

## JSON 1.0 contract

JSON uses `commandReportFormatVersion: "1.0"` and contains:

- `command: "resolve"`, `ok`, and `repositoryRoot`
- the exact graph format and eligibility policy
- allowed warning diagnostics only
- `resolution`, preserving the Stage 3.3 format, query, policy, status, explanation, selected node, and candidate records
- summary counts plus `returnedCandidates`, `truncated`, and `warnings`

The selected node remains explicit even when the candidate list is truncated. `matchedCandidates` and `topRankedCandidates` continue to describe the complete permitted result.

## Terminal format

Terminal output reports the status, repository, quoted query, explanation, selected node when present, bounded candidate counts, candidate dispositions, and rejection reasons. It is a projection of the same result used by JSON and does not recompute policy.

## Safety boundary

- public-only visibility by default
- exact scope and explicit wider-visibility opt-in
- complete validation before resolution
- no disclosure of visibility- or scope-excluded matches
- no Markdown bodies or reporting-only raw metadata
- no filename, version, timestamp, or input-order authority inference
- deterministic candidate limits and stable output
- no mutation, network request, telemetry, or model call

Selection semantics are defined in [`RESOLUTION-CONTRACT.md`](./RESOLUTION-CONTRACT.md); upstream graph eligibility is defined in [`GRAPH-CONTRACT.md`](./GRAPH-CONTRACT.md).
