import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';

const root = fileURLToPath(new URL('..', import.meta.url));

describe('non-publishing release rehearsal', () => {
  it('keeps the GitHub workflow manual, read-only, secret-free, and non-publishing', async () => {
    const source = await readFile(`${root}/.github/workflows/release-rehearsal.yml`, 'utf8');
    const workflow = parse(source) as {
      jobs: {
        rehearse: {
          strategy: { matrix: { node: string[]; os: string[] } };
        };
      };
      on: Record<string, unknown>;
      permissions: Record<string, string>;
    };

    expect(workflow.permissions).toEqual({ contents: 'read' });
    expect(Object.keys(workflow.on)).toEqual(['workflow_dispatch']);
    expect(workflow.jobs.rehearse.strategy.matrix).toEqual({
      node: ['22.x', '24.x'],
      os: ['ubuntu-latest', 'macos-latest'],
    });

    const actionReferences = [...source.matchAll(/uses: ([^\s]+)/g)].map(
      (match) => match[1] ?? '',
    );
    expect(actionReferences).toHaveLength(2);
    expect(actionReferences.every((reference) => /@[a-f0-9]{40}$/.test(reference))).toBe(true);

    expect(source).toContain('persist-credentials: false');
    expect(source).toContain('npm run release:rehearse');
    expect(source).not.toMatch(/\bnpm\s+(?:publish|stage)\b/);
    expect(source).not.toContain('id-token');
    expect(source).not.toContain('secrets.');
    expect(source).not.toContain('NODE_AUTH_TOKEN');
    expect(source).not.toContain('NPM_TOKEN');
    expect(source).not.toContain('upload-artifact');
  });

  it('keeps the local rehearsal script free of publication and credential paths', async () => {
    const source = await readFile(`${root}/scripts/release-rehearsal.mjs`, 'utf8');

    expect(source).toContain("const expectedPackageName = '@vibelabz/canonkit'");
    expect(source).toContain("packageJson.private === true");
    expect(source).not.toMatch(/['"]publish['"]/);
    expect(source).not.toContain('NODE_AUTH_TOKEN');
    expect(source).not.toContain('NPM_TOKEN');
    expect(source).not.toContain('id-token');
  });

  it('locks the private candidate identity and unpacked content manifest', async () => {
    const candidate = JSON.parse(
      await readFile(`${root}/release/alpha-candidate.json`, 'utf8'),
    ) as Record<string, unknown>;

    expect(candidate).toEqual({
      entryCount: 78,
      manifestSha256: '762707170938ba80dbc4a56c8ded04f5427b6e5fcd4a90221493b16682685207',
      name: '@vibelabz/canonkit',
      version: '0.1.0-alpha.0',
    });
  });
});
