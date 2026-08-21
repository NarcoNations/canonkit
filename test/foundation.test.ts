import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { CANONKIT_PACKAGE_NAME, CANONKIT_VERSION } from '../src/index.js';

const root = fileURLToPath(new URL('..', import.meta.url));

describe('CanonKit package foundation', () => {
  it('exposes the stable package identifier', () => {
    expect(CANONKIT_PACKAGE_NAME).toBe('@vibelabz/canonkit');
  });

  it('keeps the exported CLI version aligned with package metadata', () => {
    const packageJson = JSON.parse(readFileSync(`${root}/package.json`, 'utf8')) as {
      version: string;
    };

    expect(CANONKIT_VERSION).toBe(packageJson.version);
  });

  it('locks the scoped alpha identity while publication remains disabled', () => {
    const packageJson = JSON.parse(readFileSync(`${root}/package.json`, 'utf8')) as {
      license: string;
      name: string;
      private: boolean;
      publishConfig: { access: string };
      repository: { url: string };
      version: string;
    };

    expect(packageJson).toMatchObject({
      license: 'MIT',
      name: '@vibelabz/canonkit',
      private: true,
      publishConfig: { access: 'public' },
      repository: { url: 'git+https://github.com/NarcoNations/canonkit.git' },
      version: '0.1.0-alpha.0',
    });
  });
});
