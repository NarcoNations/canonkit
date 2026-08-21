# Trust graph index contract

Stage 3.1 exposes `buildTrustGraphIndex(documents, options)` from the package root. It consumes normalized documents after collection, document policy, and relationship policy have passed.

```ts
import {
  buildTrustGraphIndex,
  scanRepository,
  validateDocumentPolicies,
  validateRelationshipPolicies,
} from 'canonkit';

const collection = await scanRepository('./docs');
const documentPolicy = validateDocumentPolicies(collection.documents);
const relationshipPolicy = validateRelationshipPolicies(collection.documents);

if (collection.ok && documentPolicy.ok && relationshipPolicy.ok) {
  const graph = buildTrustGraphIndex(collection.documents, {
    allowedVisibilities: ['public', 'internal'],
    scope: 'products/example',
  });
  console.log(graph);
}
```

## Stable graph shape

The JSON-safe graph uses `formatVersion: "1.0"` and contains:

- `nodes`, identified unambiguously by repository-relative source path
- `identityIndex`, grouping node paths by stable document identity
- `versionIndex`, mapping every identity and version to one node path
- `subjectIndex`, grouping node paths by explicit schema 1.1 subject
- `supersessionEdges`, resolved from explicit `supersedes` references
- `relations`, preserving declared type, target, declaring node, and explicit source subjects
- `eligibilityPolicy`, recording the exact rules applied
- per-node `eligibility` with ordered exclusion codes and messages

All indexes and edges use stable lexical ordering. Markdown bodies, raw metadata, modification times, and inferred relationships are excluded.

## Eligibility

Eligibility is intentionally fail-closed:

| Rule | Default |
| --- | --- |
| Lifecycle | Exactly `active` |
| Authority | Exactly `canonical` or `approved` |
| Visibility | Exactly `public` |
| Scope | Any scope unless an exact scope is requested |

Callers may explicitly add `internal` or `restricted` through `allowedVisibilities`. They cannot opt unverified, derived, or reference authority into governing eligibility. When `scope` is supplied, missing, broader, narrower, or different scopes are excluded rather than guessed.

Exclusion codes:

| Code | Meaning |
| --- | --- |
| `CKG001_STATUS_NOT_ACTIVE` | Lifecycle is not active |
| `CKG002_AUTHORITY_NOT_GOVERNING` | Authority is not canonical or approved |
| `CKG003_VISIBILITY_NOT_ALLOWED` | Visibility was not explicitly allowed |
| `CKG004_SCOPE_NOT_ALLOWED` | Scope is not the exact requested scope |

An excluded node remains in the graph for auditability; `eligible: false` prevents later resolution from treating it as a candidate.

## Preconditions and failure behaviour

The caller must run collection plus both Stage 2 policy layers before graph construction. `buildTrustGraphIndex` additionally rejects duplicate source paths, duplicate identity/version pairs, and unresolved supersession references with `TrustGraphInputError` so ambiguous input cannot silently enter the graph.

The graph does not add candidate ranking. Stage 3.2 projects it through bounded list and graph commands without changing its semantics. Typed subject relations remain explicit records; an empty subject list remains empty and no source identity is invented.

## Safety boundary

- read-only and network-disabled
- no Markdown body parsing
- no filename, modification-time, alias, or content-based authority inference
- no visibility widening without explicit caller input
- no scope hierarchy inference
- no private or organisation-specific rules
