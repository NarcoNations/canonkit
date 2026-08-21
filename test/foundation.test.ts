import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { CANONKIT_PACKAGE_NAME, CANONKIT_VERSION } from '../src/index.js';

const root = fileURLToPath(new URL('..', import.meta.url));

describe('CanonKit package foundation', () => {
  it('exposes the stable package identifier', () => {
    expect(CANONKIT_PACKAGE_NAME).toBe('canonkit');
  });

  it('keeps the exported CLI version aligned with package metadata', () => {
    const packageJson = JSON.parse(readFileSync(`${root}/package.json`, 'utf8')) as {
      version: string;
    };

    expect(CANONKIT_VERSION).toBe(packageJson.version);
  });
});
