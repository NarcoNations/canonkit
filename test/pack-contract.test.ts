import { describe, expect, it } from 'vitest';

import {
  DEFAULT_PACK_MAX_CONTENT_BYTES,
  DEFAULT_PACK_MAX_DOCUMENTS,
  HARD_PACK_MAX_CONTENT_BYTES,
  HARD_PACK_MAX_DOCUMENTS,
  normalizePackPolicy,
  PACK_AUDIENCES,
  PACK_FORMAT_VERSION,
  PACK_GOVERNING_AUTHORITIES,
  PACK_NON_ACTIVE_STATUSES,
  PACK_POLICY_FORMAT_VERSION,
  PackContractError,
} from '../src/index.js';

describe('pack contract', () => {
  it('publishes stable, frozen format and eligibility constants', () => {
    expect(PACK_FORMAT_VERSION).toBe('1.0');
    expect(PACK_POLICY_FORMAT_VERSION).toBe('1.0');
    expect(PACK_AUDIENCES).toEqual(['public', 'internal', 'restricted']);
    expect(PACK_GOVERNING_AUTHORITIES).toEqual(['canonical', 'approved']);
    expect(PACK_NON_ACTIVE_STATUSES).toEqual(['draft', 'review', 'superseded', 'archived']);
    expect(Object.isFrozen(PACK_AUDIENCES)).toBe(true);
    expect(Object.isFrozen(PACK_GOVERNING_AUTHORITIES)).toBe(true);
    expect(Object.isFrozen(PACK_NON_ACTIVE_STATUSES)).toBe(true);
  });

  it('defaults to active public governing documents and bounded budgets', () => {
    const policy = normalizePackPolicy();

    expect(policy).toEqual({
      allowedAuthorities: ['canonical', 'approved'],
      allowedStatuses: ['active'],
      allowedVisibilities: ['public'],
      audience: 'public',
      budget: {
        maxContentBytes: DEFAULT_PACK_MAX_CONTENT_BYTES,
        maxDocuments: DEFAULT_PACK_MAX_DOCUMENTS,
        overflow: 'error',
      },
      policyFormatVersion: '1.0',
      scope: null,
    });
    expect(Object.isFrozen(policy)).toBe(true);
    expect(Object.isFrozen(policy.allowedStatuses)).toBe(true);
    expect(Object.isFrozen(policy.allowedVisibilities)).toBe(true);
    expect(Object.isFrozen(policy.budget)).toBe(true);
  });

  it('maps audience to a cumulative visibility ceiling', () => {
    expect(normalizePackPolicy({ audience: 'internal' }).allowedVisibilities).toEqual([
      'public',
      'internal',
    ]);
    expect(normalizePackPolicy({ audience: 'restricted' }).allowedVisibilities).toEqual([
      'public',
      'internal',
      'restricted',
    ]);
  });

  it('requires explicit non-active status opt-in and returns stable order', () => {
    const policy = normalizePackPolicy({
      includeNonActiveStatuses: ['archived', 'draft', 'archived', 'review'],
    });

    expect(policy.allowedStatuses).toEqual(['active', 'draft', 'review', 'archived']);
  });

  it('accepts an exact scope and caller-selected budgets within hard caps', () => {
    const policy = normalizePackPolicy({
      maxContentBytes: HARD_PACK_MAX_CONTENT_BYTES,
      maxDocuments: HARD_PACK_MAX_DOCUMENTS,
      scope: 'products/example.v1',
    });

    expect(policy.scope).toBe('products/example.v1');
    expect(policy.budget).toEqual({
      maxContentBytes: HARD_PACK_MAX_CONTENT_BYTES,
      maxDocuments: HARD_PACK_MAX_DOCUMENTS,
      overflow: 'error',
    });
  });

  it.each([
    ['maxDocuments', { maxDocuments: 0 }],
    ['maxDocuments', { maxDocuments: HARD_PACK_MAX_DOCUMENTS + 1 }],
    ['maxContentBytes', { maxContentBytes: 1.5 }],
    ['maxContentBytes', { maxContentBytes: HARD_PACK_MAX_CONTENT_BYTES + 1 }],
  ])('rejects an unsafe %s budget', (_name, options) => {
    expect(() => normalizePackPolicy(options)).toThrow(PackContractError);
  });

  it('rejects invalid audience, lifecycle, and scope values at runtime', () => {
    expect(() => normalizePackPolicy({ audience: 'team' as 'public' })).toThrow(
      'audience must be public, internal, or restricted',
    );
    expect(() =>
      normalizePackPolicy({ includeNonActiveStatuses: ['active' as 'draft'] }),
    ).toThrow('includeNonActiveStatuses may contain only');
    expect(() => normalizePackPolicy({ scope: 'Products Example' })).toThrow(
      'scope must be a stable lower-case identity',
    );
  });
});
