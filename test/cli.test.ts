import { describe, expect, it } from 'vitest';

import { parseCliArguments } from '../src/cli/arguments.js';
import { CLI_EXIT_CODES, runCli } from '../src/cli/run.js';
import type { DocumentCollection } from '../src/index.js';

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
        authority: 'canonical',
        body: 'Private document body must not appear in CLI reports.',
        id: 'guides/example',
        owner: 'documentation',
        reporting: { rawMetadata: {} as never },
        reviewAfter: null,
        scope: 'guides',
        source: { bytes: 100, path: 'docs/example.md' },
        status: 'active',
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
    });
    expect(parseCliArguments(['validate', 'docs', '--format', 'json'])).toEqual({
      format: 'json',
      kind: 'validate',
      path: 'docs',
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
    expect(valid.output.stdout).toContain('Result: valid');

    expect(
      await runCli(['validate'], invalid.io, { scanRepository: async () => collection(false) }),
    ).toBe(CLI_EXIT_CODES.documentFailure);
    expect(invalid.output.stdout).toContain('CKP002_FRONTMATTER_MISSING');
  });

  it('emits bounded JSON without document bodies or raw metadata', async () => {
    const captured = capture();
    const exitCode = await runCli(['validate', '--format=json'], captured.io, {
      scanRepository: async () => collection(true),
    });
    const report = JSON.parse(captured.output.stdout) as Record<string, unknown>;

    expect(exitCode).toBe(CLI_EXIT_CODES.success);
    expect(report['cliReportFormatVersion']).toBe('1.0');
    expect(captured.output.stdout).not.toContain('Private document body');
    expect(captured.output.stdout).not.toContain('rawMetadata');
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
