import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import {
  buildTrustGraphIndex,
  scanRepository,
  validateDocumentPolicies,
  validateRelationshipPolicies,
} from '../src/index.js';

const root = fileURLToPath(new URL('..', import.meta.url));

describe('trust graph integration', () => {
  it('indexes an already validated neutral repository without reading document bodies', async () => {
    const collection = await scanRepository(`${root}/fixtures/graph`);
    const documentPolicy = validateDocumentPolicies(collection.documents, { today: '2026-08-21' });
    const relationshipPolicy = validateRelationshipPolicies(collection.documents);

    expect(collection.ok).toBe(true);
    expect(documentPolicy.ok).toBe(true);
    expect(relationshipPolicy.ok).toBe(true);

    const graph = buildTrustGraphIndex(collection.documents);
    expect(graph.nodes.filter(({ eligibility }) => eligibility.eligible).map(({ id }) => id)).toEqual([
      'canon/example-service',
    ]);
    expect(graph.supersessionEdges).toEqual([
      {
        from: 'fixtures/graph/canon-v2.md',
        reference: 'canon/example-service@1.0',
        to: 'fixtures/graph/canon-v1.md',
        type: 'supersedes',
      },
    ]);
    expect(graph.relations).toHaveLength(2);
    expect(JSON.stringify(graph)).not.toContain('# Example service');
  });
});
