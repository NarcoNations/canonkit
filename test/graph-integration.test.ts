import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import {
  buildTrustGraphIndex,
  resolveTrustGraph,
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

    const resolution = resolveTrustGraph(
      buildTrustGraphIndex(collection.documents, {
        allowedVisibilities: ['public', 'internal'],
      }),
      'products/example-service',
    );
    expect(resolution).toMatchObject({
      selected: { nodeId: 'fixtures/graph/canon-v2.md' },
      status: 'resolved',
    });
    expect(resolution.candidates).toEqual([
      expect.objectContaining({
        disposition: 'selected',
        node: expect.objectContaining({ nodeId: 'fixtures/graph/canon-v2.md' }),
      }),
      expect.objectContaining({
        disposition: 'rejected',
        node: expect.objectContaining({ nodeId: 'fixtures/graph/canon-v1.md' }),
        reasons: [expect.objectContaining({ code: 'CKG001_STATUS_NOT_ACTIVE' })],
      }),
      expect.objectContaining({
        disposition: 'rejected',
        node: expect.objectContaining({ nodeId: 'fixtures/graph/decision.md' }),
        reasons: [expect.objectContaining({ code: 'CKS102_LOWER_KIND_PRIORITY' })],
      }),
    ]);
    expect(JSON.stringify(resolution)).not.toContain('# Example service');
  });
});
