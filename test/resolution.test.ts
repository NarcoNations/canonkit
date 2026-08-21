import { describe, expect, it } from 'vitest';

import {
  buildTrustGraphIndex,
  MAX_RESOLUTION_NODES,
  RESOLUTION_AUTHORITY_PRIORITY,
  RESOLUTION_KIND_PRIORITY,
  RESOLUTION_MATCH_PRIORITY,
  ResolutionInputError,
  resolveTrustGraph,
  type NormalizedDocument,
  type TrustGraphIndex,
} from '../src/index.js';

function document(overrides: Partial<NormalizedDocument> = {}): NormalizedDocument {
  return {
    aliases: [],
    authority: 'canonical',
    body: 'Untrusted body must never enter resolution.',
    id: 'canon/example',
    kind: 'canon',
    owner: 'product',
    relations: [],
    reporting: { rawMetadata: {} as never },
    reviewAfter: null,
    schemaVersion: '1.1',
    scope: 'products/example',
    source: { bytes: 100, path: 'docs/example.md' },
    status: 'active',
    subjects: ['products/example'],
    supersedes: [],
    tags: [],
    title: 'Example',
    version: '1.0',
    visibility: 'public',
    ...overrides,
  };
}

describe('resolveTrustGraph', () => {
  it('publishes immutable ranking policy', () => {
    expect(Object.isFrozen(RESOLUTION_MATCH_PRIORITY)).toBe(true);
    expect(Object.isFrozen(RESOLUTION_KIND_PRIORITY)).toBe(true);
    expect(Object.isFrozen(RESOLUTION_AUTHORITY_PRIORITY)).toBe(true);
  });

  it('selects one eligible canonical canon for an explicit subject', () => {
    const graph = buildTrustGraphIndex([
      document(),
      document({
        authority: 'approved',
        id: 'canon/approved-example',
        source: { bytes: 100, path: 'docs/approved.md' },
      }),
      document({
        authority: 'canonical',
        id: 'decisions/example',
        kind: 'decision',
        source: { bytes: 100, path: 'docs/decision.md' },
      }),
    ]);

    const result = resolveTrustGraph(graph, 'products/example');

    expect(result).toMatchObject({
      explanation: { code: 'CKS001_SELECTED' },
      formatVersion: '1.0',
      selected: { nodeId: 'docs/example.md' },
      status: 'resolved',
      summary: {
        eligibleCandidates: 3,
        matchedCandidates: 3,
        rejectedCandidates: 2,
        topRankedCandidates: 1,
      },
    });
    expect(result.candidates.map(({ disposition, node, reasons }) => ({
      disposition,
      nodeId: node.nodeId,
      reason: reasons[0]?.code,
    }))).toEqual([
      { disposition: 'selected', nodeId: 'docs/example.md', reason: undefined },
      {
        disposition: 'rejected',
        nodeId: 'docs/approved.md',
        reason: 'CKS103_LOWER_AUTHORITY_PRIORITY',
      },
      {
        disposition: 'rejected',
        nodeId: 'docs/decision.md',
        reason: 'CKS102_LOWER_KIND_PRIORITY',
      },
    ]);
    expect(JSON.stringify(result)).not.toContain('Untrusted body');
    expect(JSON.stringify(result)).not.toContain('rawMetadata');
  });

  it('uses subject, document identity, and alias match priority in that order', () => {
    const subject = document({
      authority: 'approved',
      id: 'decisions/subject-match',
      kind: 'decision',
      source: { bytes: 100, path: 'docs/subject.md' },
      subjects: ['products/lookup'],
    });
    const identity = document({
      id: 'products/lookup',
      source: { bytes: 100, path: 'docs/identity.md' },
      subjects: ['products/other'],
    });
    const alias = document({
      aliases: ['Products/Lookup'],
      id: 'canon/alias',
      source: { bytes: 100, path: 'docs/alias.md' },
      subjects: ['products/another'],
    });

    const result = resolveTrustGraph(buildTrustGraphIndex([alias, identity, subject]), ' PRODUCTS/LOOKUP ');

    expect(result.selected?.nodeId).toBe('docs/subject.md');
    expect(result.candidates.map(({ matches, node }) => [node.nodeId, matches])).toEqual([
      ['docs/subject.md', ['subject']],
      ['docs/identity.md', ['document_id']],
      ['docs/alias.md', ['alias']],
    ]);
  });

  it('resolves an identity to its eligible current version and explains older history', () => {
    const graph = buildTrustGraphIndex([
      document({
        source: { bytes: 100, path: 'docs/v1.md' },
        status: 'superseded',
        version: '1.0',
      }),
      document({
        source: { bytes: 100, path: 'docs/v2.md' },
        supersedes: ['canon/example@1.0'],
        version: '2.0',
      }),
    ]);

    const result = resolveTrustGraph(graph, 'canon/example');

    expect(result.selected?.nodeId).toBe('docs/v2.md');
    expect(result.candidates).toEqual([
      expect.objectContaining({ disposition: 'selected', node: expect.objectContaining({ nodeId: 'docs/v2.md' }) }),
      expect.objectContaining({
        disposition: 'rejected',
        node: expect.objectContaining({ nodeId: 'docs/v1.md' }),
        reasons: [expect.objectContaining({ code: 'CKG001_STATUS_NOT_ACTIVE' })],
      }),
    ]);
  });

  it('refuses to break an equal top-rank tie with path or version metadata', () => {
    const graph = buildTrustGraphIndex([
      document({
        authority: 'approved',
        id: 'canon/one',
        source: { bytes: 100, path: 'docs/a.md' },
      }),
      document({
        authority: 'approved',
        id: 'canon/two',
        source: { bytes: 100, path: 'docs/z.md' },
        version: '99.0',
      }),
    ]);

    const result = resolveTrustGraph(graph, 'products/example');

    expect(result).toMatchObject({
      explanation: { code: 'CKS002_AMBIGUOUS' },
      selected: null,
      status: 'ambiguous',
      summary: { topRankedCandidates: 2 },
    });
    expect(result.candidates.map(({ disposition }) => disposition)).toEqual([
      'contender',
      'contender',
    ]);
  });

  it('distinguishes all-ineligible matches from no match', () => {
    const graph = buildTrustGraphIndex([
      document({ status: 'archived', visibility: 'internal' }),
    ]);
    const unresolved = resolveTrustGraph(graph, 'products/example');
    const missing = resolveTrustGraph(graph, 'products/missing');

    expect(unresolved).toMatchObject({
      explanation: { code: 'CKS003_NO_ELIGIBLE_CANDIDATE' },
      selected: null,
      status: 'unresolved',
    });
    expect(unresolved.candidates[0]?.reasons.map(({ code }) => code)).toEqual([
      'CKG001_STATUS_NOT_ACTIVE',
      'CKG003_VISIBILITY_NOT_ALLOWED',
    ]);
    expect(missing).toMatchObject({
      candidates: [],
      explanation: { code: 'CKS004_NO_MATCH' },
      selected: null,
      status: 'not_found',
    });
  });

  it('is stable when graph node input order changes', () => {
    const graph = buildTrustGraphIndex([
      document(),
      document({
        authority: 'approved',
        id: 'policies/example',
        kind: 'policy',
        source: { bytes: 100, path: 'docs/policy.md' },
      }),
    ]);
    const reversed = { ...graph, nodes: [...graph.nodes].reverse() };

    expect(resolveTrustGraph(reversed, 'products/example')).toEqual(
      resolveTrustGraph(graph, 'products/example'),
    );
  });

  it('fails closed for invalid queries and graph boundaries', () => {
    const graph = buildTrustGraphIndex([document()]);
    expect(() => resolveTrustGraph(graph, '')).toThrow(ResolutionInputError);
    expect(() => resolveTrustGraph(graph, 'x'.repeat(161))).toThrow(ResolutionInputError);
    expect(() =>
      resolveTrustGraph({ ...graph, formatVersion: '2.0' as never }, 'products/example'),
    ).toThrow('supported trust graph format');
    expect(() =>
      resolveTrustGraph({ ...graph, nodes: [...graph.nodes, ...graph.nodes] }, 'products/example'),
    ).toThrow('duplicate node');

    const nodes = Array.from({ length: MAX_RESOLUTION_NODES + 1 }, (_, index) => ({
      ...graph.nodes[0]!,
      nodeId: `docs/${index}.md`,
    }));
    expect(() =>
      resolveTrustGraph({ ...graph, nodes } as TrustGraphIndex, 'products/example'),
    ).toThrow('safety limit');
  });
});
