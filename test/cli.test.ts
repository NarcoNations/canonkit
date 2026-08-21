import { describe, expect, it } from 'vitest';

import { parseCliArguments } from '../src/cli/arguments.js';
import { CLI_EXIT_CODES, runCli } from '../src/cli/run.js';
import type { DocumentCollection, PackBuildResult, PackPolicyOptions } from '../src/index.js';

function collection(ok: boolean): DocumentCollection {
  return {
    collectionFormatVersion: '1.0',
    diagnostics: ok
      ? []
      : [
          {
            code: 'CKP002_FRONTMATTER_MISSING',
            location: { column: 1, line: 1 },
            message: 'Document must begin with YAML frontmatter.',
            path: 'docs/broken.md',
            phase: 'parse',
            severity: 'error',
          },
        ],
    documents: [
      {
        aliases: [],
        authority: 'canonical',
        body: 'Private document body must not appear in CLI reports.',
        id: 'guides/example',
        kind: null,
        owner: 'documentation',
        relations: [],
        reporting: { rawMetadata: {} as never },
        reviewAfter: null,
        schemaVersion: '1.0',
        scope: 'guides',
        source: { bytes: 100, path: 'docs/example.md' },
        status: 'active',
        subjects: [],
        supersedes: [],
        tags: [],
        title: 'Example',
        version: '1.0',
        visibility: 'internal',
      },
    ],
    ok,
    repositoryRoot: '/repository',
    scanRoots: ['docs'],
    summary: {
      discoveredFiles: ok ? 1 : 2,
      errors: ok ? 0 : 1,
      invalidDocuments: ok ? 0 : 1,
      validDocuments: 1,
    },
  };
}

function capture() {
  const output = { stderr: '', stdout: '' };
  return {
    io: {
      stderr: (value: string) => {
        output.stderr += value;
      },
      stdout: (value: string) => {
        output.stdout += value;
      },
    },
    output,
  };
}

describe('CLI arguments', () => {
  it('parses validate defaults and explicit JSON output', () => {
    expect(parseCliArguments(['validate'])).toEqual({
      format: 'terminal',
      kind: 'validate',
      path: '.',
      quiet: false,
    });
    expect(parseCliArguments(['validate', 'docs', '--format', 'json'])).toEqual({
      format: 'json',
      kind: 'validate',
      path: 'docs',
      quiet: false,
    });
    expect(parseCliArguments(['validate', '--quiet'])).toEqual({
      format: 'terminal',
      kind: 'validate',
      path: '.',
      quiet: true,
    });
  });

  it('parses bounded list and graph projections', () => {
    expect(parseCliArguments(['list'])).toEqual({
      allowedVisibilities: ['public'],
      format: 'terminal',
      kind: 'list',
      limit: 100,
      path: '.',
    });
    expect(
      parseCliArguments([
        'graph',
        'docs',
        '--format=json',
        '--allow-visibility=internal',
        '--allow-visibility=public',
        '--scope=guides',
        '--limit=12',
      ]),
    ).toEqual({
      allowedVisibilities: ['internal', 'public'],
      format: 'json',
      kind: 'graph',
      limit: 12,
      path: 'docs',
      scope: 'guides',
    });
  });

  it('parses a resolve query, optional path, and projection controls', () => {
    expect(parseCliArguments(['resolve', 'products/example'])).toEqual({
      allowedVisibilities: ['public'],
      format: 'terminal',
      kind: 'resolve',
      limit: 100,
      path: '.',
      query: 'products/example',
    });
    expect(
      parseCliArguments([
        'resolve',
        'Example Product',
        'docs',
        '--format=json',
        '--allow-visibility=internal',
        '--scope=products/example',
        '--limit=8',
      ]),
    ).toEqual({
      allowedVisibilities: ['internal'],
      format: 'json',
      kind: 'resolve',
      limit: 8,
      path: 'docs',
      query: 'Example Product',
      scope: 'products/example',
    });
  });

  it('parses pack-safe defaults and explicit projection controls', () => {
    expect(parseCliArguments(['pack'])).toEqual({
      audience: 'public',
      format: 'markdown',
      includeNonActiveStatuses: [],
      kind: 'pack',
      maxContentBytes: 262_144,
      maxDocuments: 25,
      path: '.',
    });
    expect(
      parseCliArguments([
        'pack',
        'docs',
        '--format=json',
        '--audience=internal',
        '--include-status=superseded',
        '--include-status=draft',
        '--scope=products/example',
        '--max-documents=12',
        '--max-content-bytes=4096',
      ]),
    ).toEqual({
      audience: 'internal',
      format: 'json',
      includeNonActiveStatuses: ['draft', 'superseded'],
      kind: 'pack',
      maxContentBytes: 4096,
      maxDocuments: 12,
      path: 'docs',
      scope: 'products/example',
    });
  });

  it('recognises help and version without scanning', () => {
    expect(parseCliArguments(['--help'])).toEqual({ kind: 'help' });
    expect(parseCliArguments(['-v'])).toEqual({ kind: 'version' });
  });

  const invalidArguments: string[][] = [
    [],
    ['unknown'],
    ['validate', 'one', 'two'],
    ['validate', '--format', 'xml'],
    ['validate', '--limit', '1'],
    ['list', '--quiet'],
    ['list', '--allow-visibility', 'secret'],
    ['graph', '--limit', '0'],
    ['graph', '--limit', '1001'],
    ['graph', '--limit', 'many'],
    ['graph', '--scope', 'Products/Example'],
    ['resolve'],
    ['resolve', 'query', 'one', 'two'],
    ['resolve', '   '],
    ['resolve', 'x'.repeat(161)],
    ['resolve', 'query', '--quiet'],
    ['pack', 'one', 'two'],
    ['pack', '--format=terminal'],
    ['pack', '--audience=agent'],
    ['pack', '--include-status=active'],
    ['pack', '--max-documents=0'],
    ['pack', '--max-documents=101'],
    ['pack', '--max-content-bytes=1048577'],
    ['pack', '--allow-visibility=internal'],
    ['validate', '--audience=public'],
  ];

  it.each(invalidArguments.map((args) => [args] as const))('rejects invalid usage: %j', (args) => {
    expect(() => parseCliArguments(args)).toThrow();
  });
});

describe('runCli', () => {
  it('returns success for help and version', async () => {
    const help = capture();
    const version = capture();

    expect(await runCli(['--help'], help.io)).toBe(CLI_EXIT_CODES.success);
    expect(help.output.stdout).toContain('canonkit validate [path]');
    expect(await runCli(['--version'], version.io)).toBe(CLI_EXIT_CODES.success);
    expect(version.output.stdout).toBe('0.0.0\n');
  });

  it('returns stable success and document-failure exits', async () => {
    const valid = capture();
    const invalid = capture();

    expect(
      await runCli(['validate'], valid.io, { scanRepository: async () => collection(true) }),
    ).toBe(CLI_EXIT_CODES.success);
    expect(valid.output.stdout).toContain('CanonKit validate — VALID');

    expect(
      await runCli(['validate'], invalid.io, { scanRepository: async () => collection(false) }),
    ).toBe(CLI_EXIT_CODES.documentFailure);
    expect(invalid.output.stdout).toContain('CKP002_FRONTMATTER_MISSING');
  });

  it('passes pack controls to the projection library and emits the selected format', async () => {
    const captured = capture();
    let received: PackPolicyOptions | undefined;
    const result = successfulPack();

    const exitCode = await runCli(
      [
        'pack',
        '--format=json',
        '--audience=internal',
        '--include-status=superseded',
        '--scope=products/example',
        '--max-documents=8',
        '--max-content-bytes=2048',
      ],
      captured.io,
      {
        buildContextPack: async (_collection, options) => {
          received = options;
          return result;
        },
        scanRepository: async () => collection(true),
      },
    );

    expect(exitCode).toBe(CLI_EXIT_CODES.success);
    expect(received).toEqual({
      audience: 'internal',
      includeNonActiveStatuses: ['superseded'],
      maxContentBytes: 2048,
      maxDocuments: 8,
      scope: 'products/example',
    });
    expect(JSON.parse(captured.output.stdout)).toEqual(result.pack);
  });

  it('emits a versioned pack failure without partial content', async () => {
    const captured = capture();
    const failed: PackBuildResult = {
      failure: {
        code: 'CKX003_DOCUMENT_LIMIT_EXCEEDED',
        message: 'Too many permitted documents.',
        remediation: 'Narrow the exact scope.',
      },
      ok: false,
      pack: null,
      summary: { consideredContentBytes: 100, consideredDocuments: 2 },
    };

    const exitCode = await runCli(['pack', '--format=json'], captured.io, {
      buildContextPack: async () => failed,
      scanRepository: async () => collection(true),
    });

    expect(exitCode).toBe(CLI_EXIT_CODES.packFailure);
    expect(JSON.parse(captured.output.stdout)).toEqual({
      cliReportFormatVersion: '1.0',
      command: 'pack',
      error: failed.failure,
      ok: false,
      summary: failed.summary,
    });
    expect(captured.output.stdout).not.toContain('Private document body');
  });

  it('emits bounded JSON without document bodies or raw metadata', async () => {
    const captured = capture();
    const exitCode = await runCli(['validate', '--format=json'], captured.io, {
      scanRepository: async () => collection(true),
    });
    const report = JSON.parse(captured.output.stdout) as Record<string, unknown>;

    expect(exitCode).toBe(CLI_EXIT_CODES.success);
    expect(Object.keys(report)).toEqual([
      'cliReportFormatVersion',
      'command',
      'contracts',
      'diagnostics',
      'documents',
      'ok',
      'repositoryRoot',
      'scanRoots',
      'summary',
    ]);
    expect(report['cliReportFormatVersion']).toBe('2.0');
    expect(report['contracts']).toEqual({
      collection: '1.0',
      documentPolicy: '1.0',
      relationshipPolicy: '1.0',
    });
    expect(report['diagnostics']).toEqual([]);
    expect(report['summary']).toEqual({
      discoveredFiles: 1,
      errors: 0,
      invalidDocuments: 0,
      validDocuments: 1,
      warnings: 0,
    });
    expect(captured.output.stdout).not.toContain('Private document body');
    expect(captured.output.stdout).not.toContain('rawMetadata');
  });

  it('defaults list and graph to public and permits explicit visibility opt-in', async () => {
    const hidden = capture();
    const explicit = capture();

    expect(
      await runCli(['list', '--format=json'], hidden.io, {
        scanRepository: async () => collection(true),
      }),
    ).toBe(CLI_EXIT_CODES.success);
    expect(JSON.parse(hidden.output.stdout)).toMatchObject({
      command: 'list',
      items: [],
      ok: true,
      summary: { returnedNodes: 0, totalEligibleNodes: 0 },
    });
    expect(hidden.output.stdout).not.toContain('docs/example.md');

    expect(
      await runCli(
        ['graph', '--format=json', '--allow-visibility=internal'],
        explicit.io,
        { scanRepository: async () => collection(true) },
      ),
    ).toBe(CLI_EXIT_CODES.success);
    expect(JSON.parse(explicit.output.stdout)).toMatchObject({
      command: 'graph',
      nodes: [{ nodeId: 'docs/example.md', visibility: 'internal' }],
      ok: true,
    });
    expect(explicit.output.stdout).not.toContain('Private document body');
    expect(explicit.output.stdout).not.toContain('rawMetadata');
  });

  it('fails hidden resolution closed and resolves only after explicit visibility opt-in', async () => {
    const hidden = capture();
    const explicit = capture();

    expect(
      await runCli(['resolve', 'guides/example', '--format=json'], hidden.io, {
        scanRepository: async () => collection(true),
      }),
    ).toBe(CLI_EXIT_CODES.resolutionFailure);
    expect(JSON.parse(hidden.output.stdout)).toMatchObject({
      command: 'resolve',
      ok: false,
      resolution: {
        candidates: [],
        selected: null,
        status: 'not_found',
      },
    });
    expect(hidden.output.stdout).not.toContain('docs/example.md');

    expect(
      await runCli(
        ['resolve', 'guides/example', '--format=json', '--allow-visibility=internal'],
        explicit.io,
        { scanRepository: async () => collection(true) },
      ),
    ).toBe(CLI_EXIT_CODES.success);
    expect(JSON.parse(explicit.output.stdout)).toMatchObject({
      command: 'resolve',
      ok: true,
      resolution: {
        candidates: [{ disposition: 'selected' }],
        selected: { nodeId: 'docs/example.md' },
        status: 'resolved',
      },
    });
    expect(explicit.output.stdout).not.toContain('Private document body');
    expect(explicit.output.stdout).not.toContain('rawMetadata');
  });

  it('blocks graph output with a generic report when validation fails', async () => {
    const captured = capture();
    expect(
      await runCli(['graph', '--format=json'], captured.io, {
        scanRepository: async () => collection(false),
      }),
    ).toBe(CLI_EXIT_CODES.documentFailure);
    expect(JSON.parse(captured.output.stdout)).toMatchObject({
      command: 'graph',
      error: { code: 'CKC001_VALIDATION_REQUIRED' },
      ok: false,
      summary: { errors: 1, warnings: 0 },
    });
    expect(captured.output.stdout).not.toContain('docs/broken.md');
    expect(captured.output.stdout).not.toContain('docs/example.md');
  });

  it('blocks resolution with a generic report when validation fails', async () => {
    const captured = capture();
    expect(
      await runCli(['resolve', 'guides/example', '--format=json'], captured.io, {
        scanRepository: async () => collection(false),
      }),
    ).toBe(CLI_EXIT_CODES.documentFailure);
    expect(JSON.parse(captured.output.stdout)).toMatchObject({
      command: 'resolve',
      error: { code: 'CKC001_VALIDATION_REQUIRED' },
      ok: false,
    });
    expect(captured.output.stdout).not.toContain('docs/broken.md');
    expect(captured.output.stdout).not.toContain('docs/example.md');
  });

  it('suppresses only completely clean reports in quiet mode', async () => {
    const clean = capture();
    const invalid = capture();

    expect(
      await runCli(['validate', '--quiet', '--format=json'], clean.io, {
        scanRepository: async () => collection(true),
      }),
    ).toBe(CLI_EXIT_CODES.success);
    expect(clean.output.stdout).toBe('');

    expect(
      await runCli(['validate', '--quiet'], invalid.io, {
        scanRepository: async () => collection(false),
      }),
    ).toBe(CLI_EXIT_CODES.documentFailure);
    expect(invalid.output.stdout).toContain('CKP002_FRONTMATTER_MISSING');
  });

  it('normalises collection failures into actionable JSON diagnostics', async () => {
    const captured = capture();
    await runCli(['validate', '--format=json'], captured.io, {
      scanRepository: async () => collection(false),
    });
    const report = JSON.parse(captured.output.stdout) as {
      diagnostics: Array<Record<string, unknown>>;
    };

    expect(report.diagnostics).toEqual([
      {
        code: 'CKP002_FRONTMATTER_MISSING',
        location: { column: 1, line: 1 },
        message: 'Document must begin with YAML frontmatter.',
        path: 'docs/broken.md',
        phase: 'parse',
        relatedPaths: [],
        remediation: 'Correct the Markdown frontmatter or metadata contract error and rerun validation.',
        severity: 'error',
      },
    ]);
  });

  it('separates usage and unexpected failures', async () => {
    const usage = capture();
    const unexpected = capture();

    expect(await runCli(['unknown'], usage.io)).toBe(CLI_EXIT_CODES.usageError);
    expect(usage.output.stderr).toContain('usage error');

    expect(
      await runCli(['validate'], unexpected.io, {
        scanRepository: async () => {
          throw new Error('boom');
        },
      }),
    ).toBe(CLI_EXIT_CODES.unexpectedError);
    expect(unexpected.output.stderr).toContain('unexpected error: boom');
  });
});

function successfulPack(): Extract<PackBuildResult, { ok: true }> {
  return {
    failure: null,
    ok: true,
    pack: {
      generator: { name: 'canonkit', version: '0.0.0' },
      items: [],
      packFormatVersion: '1.0',
      policy: {
        allowedAuthorities: ['canonical', 'approved'],
        allowedStatuses: ['active'],
        allowedVisibilities: ['public'],
        audience: 'public',
        budget: { maxContentBytes: 262_144, maxDocuments: 25, overflow: 'error' },
        policyFormatVersion: '1.0',
        scope: null,
      },
      summary: { contentBytes: 0, documents: 0 },
    },
  };
}
