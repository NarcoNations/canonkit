import { describe, expect, it } from 'vitest';

import { CANONKIT_PACKAGE_NAME } from '../src/index.js';

describe('CanonKit package foundation', () => {
  it('exposes the stable package identifier', () => {
    expect(CANONKIT_PACKAGE_NAME).toBe('canonkit');
  });
});
