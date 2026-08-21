import { describe, expect, it } from 'vitest';

import {
  validateDocumentPolicies,
  type NormalizedDocument,
} from '../src/index.js';

function document(
  overrides: Partial<NormalizedDocument> = {},
): NormalizedDocument {
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
    version: '1.0',
    visibility: 'internal',
    ...overrides,
  };
}

describe('validateDocumentPolicies', () => {
  it('accepts one bounded active canonical document', () => {
    expect(validateDocumentPolicies([document()], { today: '2026-08-21' })).toEqual({
      diagnostics: [],
      ok: true,
      policyFormatVersion: '1.0',
      summary: { errors: 0, warnings: 0 },
    });
  });

  it('rejects duplicate stable identity and version pairs', () => {
    const result = validateDocumentPolicies(
      [document(), document({ source: { bytes: 100, path: 'docs/copy.md' } })],
      { today: '2026-08-21' },
    );

    expect(result.ok).toBe(false);
    expect(result.diagnostics.map(({ code, path }) => ({ code, path }))).toEqual([
      { code: 'CKV001_DUPLICATE_DOCUMENT_VERSION', path: 'docs/copy.md' },
      { code: 'CKV001_DUPLICATE_DOCUMENT_VERSION', path: 'docs/example.md' },
    ]);
  });

  it('requires active governing ownership and scope', () => {
    const result = validateDocumentPolicies(
      [document({ owner: ' ', scope: null })],
      { today: '2026-08-21' },
    );

    expect(result.diagnostics.map(({ code }) => code)).toEqual([
      'CKV002_ACTIVE_OWNER_MISSING',
      'CKV004_ACTIVE_SCOPE_MISSING',
    ]);
  });

  it('warns for overdue review without failing validation', () => {
    const result = validateDocumentPolicies(
      [document({ reviewAfter: '2026-08-20' })],
      { today: '2026-08-21' },
    );

    expect(result.ok).toBe(true);
    expect(result.summary).toEqual({ errors: 0, warnings: 1 });
    expect(result.diagnostics[0]).toMatchObject({
      code: 'CKV003_REVIEW_OVERDUE',
      severity: 'warning',
    });
  });

  it('detects competing canonical authority and visibility for one subject', () => {
    const first = document({ id: 'canon/first', source: { bytes: 100, path: 'docs/first.md' } });
    const second = document({
      id: 'canon/second',
      source: { bytes: 100, path: 'docs/second.md' },
      visibility: 'public',
    });
    const result = validateDocumentPolicies([second, first], { today: '2026-08-21' });

    expect(result.ok).toBe(false);
    expect(result.summary).toEqual({ errors: 4, warnings: 0 });
    expect(result.diagnostics.map(({ code, path }) => `${path}:${code}`)).toEqual([
      'docs/first.md:CKV005_COMPETING_ACTIVE_AUTHORITY',
      'docs/first.md:CKV006_VISIBILITY_CONFLICT',
      'docs/second.md:CKV005_COMPETING_ACTIVE_AUTHORITY',
      'docs/second.md:CKV006_VISIBILITY_CONFLICT',
    ]);
    expect(result.diagnostics[0]?.relatedPaths).toEqual(['docs/second.md']);
  });

  it('does not infer subjects for 1.0 documents', () => {
    const first = document({
      id: 'legacy/first',
      kind: null,
      schemaVersion: '1.0',
      subjects: [],
    });
    const second = document({
      id: 'legacy/second',
      kind: null,
      schemaVersion: '1.0',
      source: { bytes: 100, path: 'docs/second.md' },
      subjects: [],
    });

    expect(validateDocumentPolicies([first, second], { today: '2026-08-21' }).ok).toBe(true);
  });

  it('does not treat separate decisions as competing subject canon', () => {
    const first = document({
      authority: 'approved',
      id: 'decisions/first',
      kind: 'decision',
      source: { bytes: 100, path: 'docs/first.md' },
    });
    const second = document({
      authority: 'approved',
      id: 'decisions/second',
      kind: 'decision',
      source: { bytes: 100, path: 'docs/second.md' },
      visibility: 'public',
    });

    expect(validateDocumentPolicies([first, second], { today: '2026-08-21' }).ok).toBe(true);
  });

  it('rejects invalid injected policy dates', () => {
    expect(() => validateDocumentPolicies([], { today: 'not-a-date' })).toThrow(TypeError);
    expect(() => validateDocumentPolicies([], { today: '2026-02-30' })).toThrow(TypeError);
  });
});
