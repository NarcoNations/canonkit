# Resolution rules contract

## Purpose

Stage 3.3 exposes `resolveTrustGraph(graph, query)` from the package root. It selects a governing source from an already validated trust graph using explicit, deterministic rules. It does not read document bodies, traverse inferred relationships, or expose a process-level command.

```ts
import { buildTrustGraphIndex, resolveTrustGraph } from 'canonkit';

const graph = buildTrustGraphIndex(collection.documents);
const result = resolveTrustGraph(graph, 'products/example');
```

## Query matching

Queries are trimmed, repeated whitespace is collapsed, and text is lower-cased. Empty queries, queries longer than 160 characters, unsupported graph versions, duplicate graph nodes, and graphs over 1000 nodes fail with `ResolutionInputError`.

A candidate must match at least one explicit field. Match priority, highest first, is:

1. exact `subject`
2. exact document `id`
3. normalized exact `alias`

No fuzzy, substring, filename, body, tag, relation-target, or model-based match is performed. When one node matches in more than one way, its strongest match owns that ranking dimension.

## Candidate ranking

Only nodes already marked eligible by the graph may be selected. Eligible candidates are compared lexicographically through three declared dimensions:

1. match priority: subject, document identity, alias
2. document role: canon, policy, decision, reference, legacy schema without an explicit kind
3. governing authority: canonical, approved

Path, filename, version text, modification time, array order, and body content are never tie-breakers. If two or more eligible candidates have the same complete top rank, the result is `ambiguous` and `selected` is `null`.

## Result contract

Results use `formatVersion: "1.0"` and one of four statuses:

| Status | Explanation code | Meaning |
| --- | --- | --- |
| `resolved` | `CKS001_SELECTED` | Exactly one eligible candidate owns the highest rank |
| `ambiguous` | `CKS002_AMBIGUOUS` | Multiple eligible candidates share the highest rank |
| `unresolved` | `CKS003_NO_ELIGIBLE_CANDIDATE` | Matches exist, but every match is ineligible |
| `not_found` | `CKS004_NO_MATCH` | No explicit field matches the query |

The result records:

- original and normalized query
- the exact priority policy
- selected node or `null`
- every matching candidate in stable order
- each candidate's matches, numeric rank, disposition, and reasons
- matched, eligible, rejected, and top-ranked counts

Selected candidates use disposition `selected`; tied leaders use `contender`; every ineligible or lower-ranked candidate uses `rejected`. Ineligible candidates preserve their graph `CKG` exclusion reasons. Eligible lower-ranked candidates receive the first decisive ranking reason:

| Code | Meaning |
| --- | --- |
| `CKS101_LOWER_MATCH_PRIORITY` | A stronger explicit query match exists |
| `CKS102_LOWER_KIND_PRIORITY` | A stronger document role exists |
| `CKS103_LOWER_AUTHORITY_PRIORITY` | A stronger governing authority exists |

## Safety boundary

- callers must validate collection and policy before graph construction
- graph eligibility remains the sole visibility, scope, lifecycle, and governing-authority gate
- resolution cannot widen visibility or scope
- Markdown bodies and reporting-only raw metadata are absent
- no candidate is selected from an equal top-rank tie
- no relationship traversal or subject inference occurs
- the function is read-only and network-disabled

The upstream graph shape and eligibility rules are defined in [`GRAPH-CONTRACT.md`](./GRAPH-CONTRACT.md).
