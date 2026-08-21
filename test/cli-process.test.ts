import { execFileSync, spawnSync } from 'node:child_process';
import { chmodSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { beforeAll, describe, expect, it } from 'vitest';

const root = fileURLToPath(new URL('..', import.meta.url));
const executable = join(root, 'dist/cli.js');

beforeAll(() => {
  execFileSync(
    process.execPath,
    [join(root, 'node_modules/typescript/bin/tsc'), '-p', 'tsconfig.build.json'],
    { cwd: root, stdio: 'pipe' },
  );
  chmodSync(executable, 0o755);
});

function run(args: string[]) {
  return spawnSync(executable, args, {
    cwd: root,
    encoding: 'utf8',
  });
}

describe('packaged CLI process boundary', () => {
  it('builds the package bin target with an executable shebang', () => {
    const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as {
      bin?: Record<string, string>;
    };

    expect(packageJson.bin).toEqual({ canonkit: './dist/cli.js' });
    expect(existsSync(executable)).toBe(true);
    expect(readFileSync(executable, 'utf8').startsWith('#!/usr/bin/env node')).toBe(true);
  });

  it('supports help and version without scanning', () => {
    const help = run(['--help']);
    const version = run(['--version']);

    expect(help.status).toBe(0);
    expect(help.stdout).toContain('canonkit validate [path]');
    expect(help.stdout).toContain('canonkit list [path]');
    expect(help.stdout).toContain('canonkit graph [path]');
    expect(version.status).toBe(0);
    expect(version.stdout).toBe('0.0.0\n');
  });

  it('lists only eligible public documents by default', () => {
    const result = run(['list', 'fixtures/graph', '--format=json']);
    const report = JSON.parse(result.stdout) as {
      items: Array<{ id: string; nodeId: string; version: string }>;
      summary: Record<string, unknown>;
    };

    expect(result.status).toBe(0);
    expect(report.items).toEqual([
      expect.objectContaining({
        id: 'canon/example-service',
        nodeId: 'fixtures/graph/canon-v2.md',
        version: '2.0',
      }),
    ]);
    expect(report.summary).toMatchObject({
      returnedNodes: 1,
      totalEligibleNodes: 1,
      truncated: false,
    });
    expect(result.stdout).not.toContain('fixtures/graph/decision.md');
    expect(result.stdout).not.toContain('# Example service');
  });

  it('returns a bounded public graph and requires explicit internal opt-in', () => {
    const publicResult = run(['graph', 'fixtures/graph', '--format=json']);
    const publicReport = JSON.parse(publicResult.stdout) as {
      nodes: Array<{ nodeId: string }>;
      supersessionEdges: unknown[];
    };
    const expandedResult = run([
      'graph',
      'fixtures/graph',
      '--format=json',
      '--allow-visibility=public',
      '--allow-visibility=internal',
    ]);
    const expandedReport = JSON.parse(expandedResult.stdout) as {
      nodes: Array<{ nodeId: string }>;
    };

    expect(publicResult.status).toBe(0);
    expect(publicReport.nodes.map(({ nodeId }) => nodeId)).toEqual([
      'fixtures/graph/canon-v1.md',
      'fixtures/graph/canon-v2.md',
    ]);
    expect(publicReport.supersessionEdges).toHaveLength(1);
    expect(publicResult.stdout).not.toContain('fixtures/graph/decision.md');
    expect(expandedResult.status).toBe(0);
    expect(expandedReport.nodes.map(({ nodeId }) => nodeId)).toContain(
      'fixtures/graph/decision.md',
    );
  });

  it('applies exact scope and deterministic node limits', () => {
    const scoped = run([
      'graph',
      'fixtures/graph',
      '--format=json',
      '--scope=products/example',
      '--limit=1',
    ]);
    const report = JSON.parse(scoped.stdout) as {
      nodes: unknown[];
      summary: Record<string, unknown>;
    };

    expect(scoped.status).toBe(0);
    expect(report.nodes).toHaveLength(1);
    expect(report.summary).toMatchObject({
      returnedNodes: 1,
      totalVisibleNodes: 2,
      truncated: true,
    });
  });

  it('fails closed without leaking document paths when validation is invalid', () => {
    const result = run(['list', 'fixtures/collection', '--format=json']);
    const report = JSON.parse(result.stdout) as Record<string, unknown>;

    expect(result.status).toBe(1);
    expect(report).toMatchObject({
      command: 'list',
      error: { code: 'CKC001_VALIDATION_REQUIRED' },
      ok: false,
    });
    expect(result.stdout).not.toContain('.md');
  });

  it('returns success for valid documents and failure for invalid neighbours', () => {
    const valid = run(['validate', 'fixtures/relationships/valid', '--format=json']);
    const invalid = run(['validate', 'fixtures/collection', '--format=json']);

    expect(valid.status).toBe(0);
    expect(JSON.parse(valid.stdout)).toMatchObject({ ok: true });
    expect(invalid.status).toBe(1);
    expect(JSON.parse(invalid.stdout)).toMatchObject({
      ok: false,
      summary: { errors: 3, invalidDocuments: 3, validDocuments: 2 },
    });
  });

  it('returns the usage exit for invalid commands', () => {
    const result = run(['unknown']);

    expect(result.status).toBe(2);
    expect(result.stderr).toContain('usage error');
  });

  it('reports document policy failures and non-failing review warnings', () => {
    const competing = run(['validate', 'fixtures/policy/competing', '--format=json']);
    const overdue = run(['validate', 'fixtures/policy/overdue', '--format=json']);

    expect(competing.status).toBe(1);
    expect(JSON.parse(competing.stdout)).toMatchObject({
      ok: false,
      summary: { errors: 4, warnings: 0 },
    });
    expect(overdue.status).toBe(0);
    expect(JSON.parse(overdue.stdout)).toMatchObject({
      ok: true,
      summary: { errors: 0, warnings: 1 },
    });
  });

  it('reports relationship policy failures', () => {
    const missing = run(['validate', 'fixtures/relationships/missing', '--format=json']);

    expect(missing.status).toBe(1);
    expect(JSON.parse(missing.stdout)).toMatchObject({
      ok: false,
      diagnostics: [
        {
          code: 'CKR001_SUPERSESSION_TARGET_MISSING',
          path: 'fixtures/relationships/missing/current.md',
          phase: 'relationship-policy',
        },
      ],
      summary: { errors: 1, warnings: 0 },
    });
  });

  it.each([
    ['fixtures/relationships/self', 'CKR002_SELF_SUPERSESSION'],
    ['fixtures/relationships/cycle', 'CKR003_SUPERSESSION_CYCLE'],
    ['fixtures/relationships/active-target', 'CKR004_SUPERSEDED_TARGET_ACTIVE'],
    ['fixtures/relationships/orphan', 'CKR005_SUPERSEDED_DOCUMENT_UNREFERENCED'],
    ['fixtures/relationships/multiple-current', 'CKR006_MULTIPLE_CURRENT_VERSIONS'],
  ])('fails %s for %s', (path, expectedCode) => {
    const result = run(['validate', path, '--format=json']);
    const report = JSON.parse(result.stdout) as {
      diagnostics: Array<{ code: string }>;
    };

    expect(result.status).toBe(1);
    expect(report.diagnostics.map(({ code }) => code)).toContain(expectedCode);
  });

  it('keeps clean quiet runs silent and preserves warning output', () => {
    const clean = run(['validate', 'fixtures/relationships/valid', '--quiet']);
    const warning = run(['validate', 'fixtures/policy/overdue', '--quiet']);

    expect(clean.status).toBe(0);
    expect(clean.stdout).toBe('');
    expect(warning.status).toBe(0);
    expect(warning.stdout).toContain('CKV003_REVIEW_OVERDUE');
  });
});
