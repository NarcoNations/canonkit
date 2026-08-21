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
    expect(help.stdout).toContain('canonkit resolve <query> [path]');
    expect(help.stdout).toContain('canonkit pack [path]');
    expect(version.status).toBe(0);
    expect(version.stdout).toBe('0.1.0-alpha.0\n');
  });

  it('emits a public-only Markdown context pack by default', () => {
    const first = run(['pack', 'fixtures/graph']);
    const second = run(['pack', 'fixtures/graph']);

    expect(first.status).toBe(0);
    expect(second.stdout).toBe(first.stdout);
    expect(first.stdout).toContain('# CanonKit context pack');
    expect(first.stdout).toContain('fixtures/graph/canon-v2.md');
    expect(first.stdout).toContain('# Example service v2');
    expect(first.stdout).not.toContain('fixtures/graph/canon-v1.md');
    expect(first.stdout).not.toContain('fixtures/graph/decision.md');
  });

  it('emits deterministic JSON with explicit audience and lifecycle opt-ins', () => {
    const args = [
      'pack',
      'fixtures/graph',
      '--format=json',
      '--audience=internal',
      '--include-status=superseded',
      '--scope=products/example',
    ];
    const first = run(args);
    const second = run(args);
    const pack = JSON.parse(first.stdout) as {
      items: Array<{ document: { status: string }; provenance: { sourcePath: string } }>;
      policy: Record<string, unknown>;
      summary: Record<string, unknown>;
    };

    expect(first.status).toBe(0);
    expect(second.stdout).toBe(first.stdout);
    expect(pack.items.map(({ provenance }) => provenance.sourcePath)).toEqual([
      'fixtures/graph/canon-v1.md',
      'fixtures/graph/canon-v2.md',
      'fixtures/graph/decision.md',
    ]);
    expect(pack.policy).toMatchObject({
      audience: 'internal',
      allowedStatuses: ['active', 'superseded'],
      scope: 'products/example',
    });
    expect(pack.summary).toMatchObject({ documents: 3 });
    expect(first.stdout).not.toContain('rawMetadata');
    expect(first.stdout).not.toContain('repositoryRoot');
  });

  it('requires explicit lifecycle opt-in and fails pack budgets atomically', () => {
    const hidden = run(['pack', 'fixtures/resolution/ineligible', '--format=json']);
    const optedIn = run([
      'pack',
      'fixtures/resolution/ineligible',
      '--format=json',
      '--include-status=archived',
    ]);
    const documentLimit = run([
      'pack',
      'fixtures/graph',
      '--format=json',
      '--audience=internal',
      '--max-documents=1',
    ]);
    const byteLimit = run([
      'pack',
      'fixtures/graph',
      '--format=json',
      '--max-content-bytes=1',
    ]);

    expect(hidden.status).toBe(1);
    expect(JSON.parse(hidden.stdout)).toMatchObject({
      error: { code: 'CKX002_EMPTY' },
      ok: false,
    });
    expect(hidden.stdout).not.toContain('archived.md');
    expect(optedIn.status).toBe(0);
    expect(JSON.parse(optedIn.stdout)).toMatchObject({
      items: [expect.objectContaining({ document: expect.objectContaining({ status: 'archived' }) })],
    });
    expect(documentLimit.status).toBe(1);
    expect(JSON.parse(documentLimit.stdout)).toMatchObject({
      error: { code: 'CKX003_DOCUMENT_LIMIT_EXCEEDED' },
      ok: false,
    });
    expect(byteLimit.status).toBe(1);
    expect(JSON.parse(byteLimit.stdout)).toMatchObject({
      error: { code: 'CKX004_CONTENT_BYTES_EXCEEDED' },
      ok: false,
    });
  });

  it('fails invalid repositories without leaking partial pack paths', () => {
    const result = run(['pack', 'fixtures/collection', '--format=json']);

    expect(result.status).toBe(1);
    expect(JSON.parse(result.stdout)).toMatchObject({
      error: { code: 'CKX001_VALIDATION_REQUIRED' },
      ok: false,
    });
    expect(result.stdout).not.toContain('.md');
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

  it('resolves a governing source deterministically with bounded body-free output', () => {
    const args = [
      'resolve',
      'products/example-service',
      'fixtures/graph',
      '--format=json',
      '--limit=1',
    ];
    const first = run(args);
    const second = run(args);
    const report = JSON.parse(first.stdout) as {
      resolution: {
        candidates: Array<{ node: { nodeId: string } }>;
        selected: { nodeId: string };
        status: string;
        summary: Record<string, unknown>;
      };
    };

    expect(first.status).toBe(0);
    expect(second.status).toBe(0);
    expect(second.stdout).toBe(first.stdout);
    expect(report.resolution).toMatchObject({
      selected: { nodeId: 'fixtures/graph/canon-v2.md' },
      status: 'resolved',
      summary: {
        matchedCandidates: 2,
        returnedCandidates: 1,
        truncated: true,
      },
    });
    expect(report.resolution.candidates).toHaveLength(1);
    expect(first.stdout).not.toContain('fixtures/graph/decision.md');
    expect(first.stdout).not.toContain('# Example service');
    expect(first.stdout).not.toContain('rawMetadata');
  });

  it('requires explicit visibility opt-in before revealing internal matches', () => {
    const result = run([
      'resolve',
      'products/example-service',
      'fixtures/graph',
      '--format=json',
      '--allow-visibility=public',
      '--allow-visibility=internal',
    ]);
    const report = JSON.parse(result.stdout) as {
      resolution: { candidates: Array<{ node: { nodeId: string } }> };
    };

    expect(result.status).toBe(0);
    expect(report.resolution.candidates.map(({ node }) => node.nodeId)).toContain(
      'fixtures/graph/decision.md',
    );

    const wrongScope = run([
      'resolve',
      'products/example-service',
      'fixtures/graph',
      '--format=json',
      '--scope=products/other',
    ]);
    expect(wrongScope.status).toBe(1);
    expect(JSON.parse(wrongScope.stdout)).toMatchObject({
      resolution: { candidates: [], status: 'not_found' },
    });
    expect(wrongScope.stdout).not.toContain('fixtures/graph/canon-v2.md');
  });

  it('returns a failing ambiguity without choosing by path', () => {
    const result = run([
      'resolve',
      'products/example',
      'fixtures/resolution/ambiguous',
      '--format=json',
    ]);
    const report = JSON.parse(result.stdout) as {
      resolution: {
        candidates: Array<{ disposition: string }>;
        selected: unknown;
        status: string;
      };
    };

    expect(result.status).toBe(1);
    expect(report.resolution).toMatchObject({ selected: null, status: 'ambiguous' });
    expect(report.resolution.candidates.map(({ disposition }) => disposition)).toEqual([
      'contender',
      'contender',
    ]);
  });

  it('returns an explained failure when every match is lifecycle-ineligible', () => {
    const result = run([
      'resolve',
      'products/example',
      'fixtures/resolution/ineligible',
      '--format=json',
    ]);
    const report = JSON.parse(result.stdout) as {
      resolution: {
        candidates: Array<{ reasons: Array<{ code: string }> }>;
        selected: unknown;
        status: string;
      };
    };

    expect(result.status).toBe(1);
    expect(report.resolution).toMatchObject({ selected: null, status: 'unresolved' });
    expect(report.resolution.candidates[0]?.reasons).toEqual([
      expect.objectContaining({ code: 'CKG001_STATUS_NOT_ACTIVE' }),
    ]);
  });

  it('returns failing not-found and generic validation-blocked outcomes', () => {
    const missing = run([
      'resolve',
      'products/missing',
      'fixtures/graph',
      '--format=json',
    ]);
    const invalid = run([
      'resolve',
      'products/example',
      'fixtures/collection',
      '--format=json',
    ]);

    expect(missing.status).toBe(1);
    expect(JSON.parse(missing.stdout)).toMatchObject({
      ok: false,
      resolution: { candidates: [], selected: null, status: 'not_found' },
    });
    expect(invalid.status).toBe(1);
    expect(JSON.parse(invalid.stdout)).toMatchObject({
      command: 'resolve',
      error: { code: 'CKC001_VALIDATION_REQUIRED' },
      ok: false,
    });
    expect(invalid.stdout).not.toContain('.md');
  });

  it('renders a concise terminal resolution', () => {
    const result = run([
      'resolve',
      'products/example-service',
      'fixtures/graph',
    ]);

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('CanonKit resolve — RESOLVED');
    expect(result.stdout).toContain('Selected: canon/example-service@2.0');
    expect(result.stdout).not.toContain('# Example service');
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
