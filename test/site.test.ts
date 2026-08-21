import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const root = fileURLToPath(new URL('..', import.meta.url));

describe('public landing page', () => {
  it('presents the current alpha candidate without claiming npm availability', async () => {
    const source = await readFile(`${root}/public/index.html`, 'utf8');

    expect(source).toContain('<title>CanonKit — Govern what becomes authoritative</title>');
    expect(source).toContain('Open-source alpha candidate · from VibeLabz');
    expect(source).toContain('Candidate proven · npm publication pending');
    expect(source).toContain('https://github.com/NarcoNations/canonkit');
    expect(source).toContain('docs/QUICKSTART.md');
    expect(source).not.toContain('Build v0.1');
    expect(source).not.toContain('96/100');
    expect(source).not.toContain('canonkit lint');
    expect(source).not.toContain('<code>init</code>');
  });

  it('shows real implemented commands and bounded evidence', async () => {
    const source = await readFile(`${root}/public/index.html`, 'utf8');

    for (const command of ['validate', 'list', 'graph', 'resolve', 'pack']) {
      expect(source).toContain(`canonkit ${command}`);
    }
    for (const evidence of ['195', '4/4', '78', 'Reported vulnerabilities']) {
      expect(source).toContain(evidence);
    }
    expect(source.match(/<h1>/g)).toHaveLength(1);
  });

  it('provides keyboard-addressable mobile navigation without external scripts', async () => {
    const source = await readFile(`${root}/public/index.html`, 'utf8');

    expect(source).toContain('aria-controls="mobile-nav"');
    expect(source).toContain('aria-expanded="false"');
    expect(source).toContain("event.key === 'Escape'");
    expect(source).not.toMatch(/<script[^>]+src=/);
    expect(source).not.toContain('<form');
  });
});
