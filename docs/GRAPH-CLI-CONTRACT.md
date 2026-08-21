# List and graph CLI contract

## Purpose

`canonkit list` and `canonkit graph` expose bounded, deterministic projections of the validated trust graph. They are read-only inspection commands, not authority resolution.

## Commands

```text
canonkit list [path] [--format terminal|json] [--allow-visibility <value>] [--scope <scope>] [--limit <n>]
canonkit graph [path] [--format terminal|json] [--allow-visibility <value>] [--scope <scope>] [--limit <n>]
```

- `path` defaults to the current directory.
- `--allow-visibility` is repeatable and accepts `public`, `internal`, or `restricted`. Omission means public only; passing one value replaces that default, so callers must name every class they intend to expose.
- `--scope` requires an exact lower-case scope identity. It does not infer hierarchy.
- `--limit` bounds returned nodes from 1 to 1000 and defaults to 100.
- Both commands validate the complete collection before building the graph.

## Projection rules

`list` returns only eligible nodes: active, canonical or approved, explicitly allowed by visibility, and exactly in the requested scope when one is supplied.

`graph` returns every visibility- and scope-allowed node, including superseded or non-governing nodes needed for lifecycle audit. It never returns a node excluded by visibility or scope. Supersession edges require both endpoint nodes in the returned projection. Explicit relations require their declaring node in the projection.

Nodes, indexes, and edges retain the stable order defined by the graph contract. Node limits are applied to that order. Graph output also caps combined edges at 1000, preserving supersession edges before explicit relations. `summary.truncated` records any omitted nodes or edges.

## JSON 1.0 contract

Successful reports use `commandReportFormatVersion: "1.0"` and carry the underlying `graphFormatVersion` and `eligibilityPolicy`.

- `list` includes `items`, allowed warning diagnostics, and returned/total eligible-node counts.
- `graph` includes nodes, filtered identity/subject/version indexes, supersession edges, explicit relations, allowed warning diagnostics, and returned/total node and edge counts.

If repository validation has errors, either command exits `1` and emits a generic `CKC001_VALIDATION_REQUIRED` report. That report includes counts and remediation but no document paths or partial graph data. The caller must run `canonkit validate` to inspect the failures.

Breaking changes require a new command report format version.

## Safety boundary

- public-only output is the default
- internal and restricted metadata require explicit opt-in
- invalid collections fail closed without partial graph disclosure
- Markdown bodies and reporting-only raw metadata are never emitted
- output limits are mandatory and deterministic
- no filename, timestamp, body content, or model judgement establishes authority
- the commands do not modify files, call a network, rank candidates, or resolve a governing source

The underlying graph and eligibility semantics are defined in [`GRAPH-CONTRACT.md`](./GRAPH-CONTRACT.md).
