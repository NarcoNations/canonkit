import { describe, expect, it } from 'vitest';

import {
  buildTrustGraphIndex,
  TrustGraphInputError,
  type NormalizedDocument,
} from '../src/index.js';

function document(overrides: Partial<NormalizedDocument> = {}): NormalizedDocument {
  return {
    aliases: [],
    authority: 'canonical',
    body: '',
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
    version: '2.0',
    visibility: 'public',
    ...overrides,
  };
}

describe('buildTrustGraphIndex', () => {
  it('builds stable identity, version, subject, supersession, and relation indexes', () => {
    const older = document({
      source: { bytes: 100, path: 'docs/v1.md' },
      status: 'superseded',
      version: '1.0',
    });
    const current = document({
      aliases: ['Example product'],
      relations: [{ target: 'ecosystems/example', type: 'part_of' }],
      source: { bytes: 100, path: 'docs/v2.md' },
      supersedes: ['canon/example@1.0'],
    });

    const expected = buildTrustGraphIndex([older, current]);
    expect(buildTrustGraphIndex([current, older])).toEqual(expected);
    expect(expected).toMatchObject({
      formatVersion: '1.0',
      identityIndex: [{ id: 'canon/example', nodes: ['docs/v1.md', 'docs/v2.md'] }],
      relations: [
        {
          declaredBy: 'docs/v2.md',
          sources: ['products/example'],
          target: 'ecosystems/example',
          type: 'part_of',
        },
      ],
      subjectIndex: [
        { nodes: ['docs/v1.md', 'docs/v2.md'], subject: 'products/example' },
      ],
      supersessionEdges: [
        {
          from: 'docs/v2.md',
          reference: 'canon/example@1.0',
          to: 'docs/v1.md',
          type: 'supersedes',
        },
      ],
      versionIndex: [
        { id: 'canon/example', node: 'docs/v1.md', version: '1.0' },
        { id: 'canon/example', node: 'docs/v2.md', version: '2.0' },
      ],
    });
  });

  it('fails closed to active governing public documents by default', () => {
    const activePublic = document({ source: { bytes: 100, path: 'docs/public.md' } });
    const internal = document({
      id: 'canon/internal',
      source: { bytes: 100, path: 'docs/internal.md' },
      visibility: 'internal',
    });
    const draftReference = document({
      authority: 'reference',
      id: 'guides/draft',
      kind: 'reference',
      source: { bytes: 100, path: 'docs/reference.md' },
      status: 'draft',
      subjects: [],
    });
    const graph = buildTrustGraphIndex([draftReference, internal, activePublic]);
    const byPath = new Map(graph.nodes.map((node) => [node.nodeId, node]));

    expect(graph.eligibilityPolicy).toEqual({
      allowedVisibilities: ['public'],
      governingAuthorities: ['canonical', 'approved'],
      requiredStatus: 'active',
      scope: null,
    });
    expect(byPath.get('docs/public.md')?.eligibility).toEqual({
      eligible: true,
      exclusions: [],
    });
    expect(byPath.get('docs/internal.md')?.eligibility.exclusions.map(({ code }) => code)).toEqual([
      'CKG003_VISIBILITY_NOT_ALLOWED',
    ]);
    expect(byPath.get('docs/reference.md')?.eligibility.exclusions.map(({ code }) => code)).toEqual([
      'CKG001_STATUS_NOT_ACTIVE',
      'CKG002_AUTHORITY_NOT_GOVERNING',
    ]);
  });

  it('requires explicit visibility opt-in and an exact requested scope', () => {
    const graph = buildTrustGraphIndex(
      [
        document({ visibility: 'internal' }),
        document({
          id: 'canon/other',
          scope: null,
          source: { bytes: 100, path: 'docs/other.md' },
          visibility: 'internal',
        }),
      ],
      { allowedVisibilities: ['internal', 'public', 'internal'], scope: 'products/example' },
    );

    expect(graph.eligibilityPolicy.allowedVisibilities).toEqual(['internal', 'public']);
    expect(graph.nodes[0]?.eligibility.eligible).toBe(true);
    expect(graph.nodes[1]?.eligibility).toMatchObject({
      eligible: false,
      exclusions: [{ code: 'CKG004_SCOPE_NOT_ALLOWED' }],
    });
  });

  it('retains explicit relations without inventing a missing source subject', () => {
    const graph = buildTrustGraphIndex([
      document({
        id: 'policies/example',
        kind: 'policy',
        relations: [{ target: 'subjects/external', type: 'related_to' }],
        subjects: [],
      }),
    ]);

    expect(graph.relations).toEqual([
      {
        declaredBy: 'docs/example.md',
        sources: [],
        target: 'subjects/external',
        type: 'related_to',
      },
    ]);
    expect(graph.subjectIndex).toEqual([]);
  });

  it('rejects ambiguous or unresolved graph input', () => {
    expect(() =>
      buildTrustGraphIndex([
        document(),
        document({ source: { bytes: 100, path: 'docs/copy.md' } }),
      ]),
    ).toThrow(TrustGraphInputError);
    expect(() =>
      buildTrustGraphIndex([document({ supersedes: ['canon/missing@1.0'] })]),
    ).toThrow('Cannot index unresolved supersession target');
    expect(() =>
      buildTrustGraphIndex([
        document(),
        document({ id: 'canon/other', source: { bytes: 100, path: 'docs/example.md' } }),
      ]),
    ).toThrow('Duplicate graph node path');
  });

  it('rejects invalid runtime eligibility options', () => {
    expect(() =>
      buildTrustGraphIndex([], { allowedVisibilities: ['secret' as never] }),
    ).toThrow(TypeError);
    expect(() => buildTrustGraphIndex([], { scope: '' })).toThrow(TypeError);
    expect(() => buildTrustGraphIndex([], { scope: '../escape' })).toThrow(TypeError);
  });
});
