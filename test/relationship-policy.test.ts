import { describe, expect, it } from 'vitest';

import {
  validateRelationshipPolicies,
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
    visibility: 'internal',
    ...overrides,
  };
}

describe('validateRelationshipPolicies', () => {
  it('accepts a complete acyclic supersession chain', () => {
    const older = document({
      source: { bytes: 100, path: 'docs/v1.md' },
      status: 'superseded',
      version: '1.0',
    });
    const current = document({
      source: { bytes: 100, path: 'docs/v2.md' },
      supersedes: ['canon/example@1.0'],
    });

    expect(validateRelationshipPolicies([current, older])).toEqual({
      diagnostics: [],
      ok: true,
      policyFormatVersion: '1.0',
      summary: { errors: 0, warnings: 0 },
    });
  });

  it('resolves an identity-only reference to collected versions of another document', () => {
    const legacyV1 = document({
      id: 'canon/legacy',
      source: { bytes: 100, path: 'docs/legacy-v1.md' },
      status: 'superseded',
      version: '1.0',
    });
    const legacyV2 = document({
      id: 'canon/legacy',
      source: { bytes: 100, path: 'docs/legacy-v2.md' },
      status: 'superseded',
    });
    const replacement = document({
      id: 'canon/replacement',
      source: { bytes: 100, path: 'docs/replacement.md' },
      supersedes: ['canon/legacy'],
    });

    expect(validateRelationshipPolicies([replacement, legacyV2, legacyV1]).ok).toBe(true);
  });

  it('rejects missing exact and identity-only targets', () => {
    const result = validateRelationshipPolicies([
      document({ supersedes: ['canon/missing@1.0', 'canon/also-missing'] }),
    ]);

    expect(result.diagnostics.map(({ code, message }) => ({ code, message }))).toEqual([
      {
        code: 'CKR001_SUPERSESSION_TARGET_MISSING',
        message: 'Supersession target canon/also-missing is not present in the scanned collection.',
      },
      {
        code: 'CKR001_SUPERSESSION_TARGET_MISSING',
        message: 'Supersession target canon/missing@1.0 is not present in the scanned collection.',
      },
    ]);
  });

  it('rejects exact and ambiguous identity self-supersession', () => {
    const result = validateRelationshipPolicies([
      document({ supersedes: ['canon/example', 'canon/example@2.0'] }),
    ]);

    expect(result.diagnostics.map(({ code }) => code)).toEqual([
      'CKR002_SELF_SUPERSESSION',
      'CKR002_SELF_SUPERSESSION',
    ]);
  });

  it('detects a deterministic supersession cycle', () => {
    const first = document({
      id: 'canon/first',
      source: { bytes: 100, path: 'docs/first.md' },
      status: 'superseded',
      supersedes: ['canon/second@1.0'],
      version: '1.0',
    });
    const second = document({
      id: 'canon/second',
      source: { bytes: 100, path: 'docs/second.md' },
      status: 'superseded',
      supersedes: ['canon/first@1.0'],
      version: '1.0',
    });
    const result = validateRelationshipPolicies([second, first]);

    expect(result.diagnostics.map(({ code, path }) => `${path}:${code}`)).toEqual([
      'docs/first.md:CKR003_SUPERSESSION_CYCLE',
      'docs/second.md:CKR003_SUPERSESSION_CYCLE',
    ]);
    expect(result.diagnostics[0]?.relatedPaths).toEqual(['docs/second.md']);
  });

  it('rejects active superseded targets and unreferenced superseded documents', () => {
    const activeTarget = document({
      id: 'canon/active-target',
      source: { bytes: 100, path: 'docs/active.md' },
      version: '1.0',
    });
    const replacement = document({
      id: 'canon/replacement',
      source: { bytes: 100, path: 'docs/replacement.md' },
      supersedes: ['canon/active-target@1.0'],
    });
    const orphan = document({
      id: 'canon/orphan',
      source: { bytes: 100, path: 'docs/orphan.md' },
      status: 'superseded',
      version: '1.0',
    });
    const result = validateRelationshipPolicies([orphan, replacement, activeTarget]);

    expect(result.diagnostics.map(({ code, path }) => `${path}:${code}`)).toEqual([
      'docs/active.md:CKR004_SUPERSEDED_TARGET_ACTIVE',
      'docs/orphan.md:CKR005_SUPERSEDED_DOCUMENT_UNREFERENCED',
    ]);
  });

  it('rejects multiple active versions of one document identity', () => {
    const result = validateRelationshipPolicies([
      document({ source: { bytes: 100, path: 'docs/v2.md' } }),
      document({ source: { bytes: 100, path: 'docs/v3.md' }, version: '3.0' }),
    ]);

    expect(result.diagnostics.map(({ code, path }) => `${path}:${code}`)).toEqual([
      'docs/v2.md:CKR006_MULTIPLE_CURRENT_VERSIONS',
      'docs/v3.md:CKR006_MULTIPLE_CURRENT_VERSIONS',
    ]);
  });

  it('does not infer supersession from typed subject relations', () => {
    const result = validateRelationshipPolicies([
      document({ relations: [{ target: 'subjects/external-history', type: 'evolved_from' }] }),
    ]);

    expect(result.ok).toBe(true);
  });
});
