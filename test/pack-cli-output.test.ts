import { describe, expect, it } from 'vitest';

import {
  MAX_PACK_RENDERED_BYTES,
  renderPackCommandResult,
} from '../src/cli/pack-output.js';
import type { ContextPack, PackBuildResult } from '../src/index.js';

describe('pack CLI output', () => {
  it('renders a readable Markdown failure with no partial pack', () => {
    const result: PackBuildResult = {
      failure: {
        code: 'CKX002_EMPTY',
        message: 'No permitted documents.',
        remediation: 'Review the requested policy.',
      },
      ok: false,
      pack: null,
      summary: { consideredContentBytes: 0, consideredDocuments: 0 },
    };

    const rendered = renderPackCommandResult(result, 'markdown');

    expect(rendered.ok).toBe(false);
    expect(rendered.output).toContain('# CanonKit context pack — FAILED');
    expect(rendered.output).toContain('CKX002_EMPTY');
    expect(rendered.output).not.toContain('"items"');
  });

  it('replaces an oversized successful projection with a bounded failure', () => {
    const pack = minimalPack('x'.repeat(MAX_PACK_RENDERED_BYTES));
    const rendered = renderPackCommandResult(
      { failure: null, ok: true, pack },
      'json',
    );
    const report = JSON.parse(rendered.output) as {
      error: { code: string };
      ok: boolean;
    };

    expect(rendered.ok).toBe(false);
    expect(Buffer.byteLength(rendered.output, 'utf8')).toBeLessThan(MAX_PACK_RENDERED_BYTES);
    expect(report).toMatchObject({
      error: { code: 'CKX006_OUTPUT_BYTES_EXCEEDED' },
      ok: false,
    });
    expect(rendered.output).not.toContain('xxxxx');
  });
});

function minimalPack(text: string): ContextPack {
  return {
    generator: { name: 'canonkit', version: '0.0.0' },
    items: [
      {
        content: {
          bytes: Buffer.byteLength(text, 'utf8'),
          mediaType: 'text/markdown',
          text,
          trust: 'untrusted_repository_content',
        },
        document: {
          aliases: [],
          authority: 'canonical',
          id: 'canon/example',
          kind: 'canon',
          owner: 'product',
          relations: [],
          reviewAfter: null,
          schemaVersion: '1.1',
          scope: 'products/example',
          status: 'active',
          subjects: ['products/example'],
          supersedes: [],
          tags: [],
          title: 'Example',
          version: '1.0',
          visibility: 'public',
        },
        provenance: {
          digest: { algorithm: 'sha256', value: '0'.repeat(64) },
          sourceBytes: 1,
          sourcePath: 'docs/example.md',
        },
      },
    ],
    packFormatVersion: '1.0',
    policy: {
      allowedAuthorities: ['canonical', 'approved'],
      allowedStatuses: ['active'],
      allowedVisibilities: ['public'],
      audience: 'public',
      budget: { maxContentBytes: 1_048_576, maxDocuments: 100, overflow: 'error' },
      policyFormatVersion: '1.0',
      scope: null,
    },
    summary: { contentBytes: Buffer.byteLength(text, 'utf8'), documents: 1 },
  };
}
