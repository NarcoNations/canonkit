import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { parseMarkdownFrontmatter } from '../src/index.js';

const root = fileURLToPath(new URL('..', import.meta.url));

function fixture(path: string): string {
  return readFileSync(`${root}/fixtures/frontmatter/${path}`, 'utf8');
}

describe('parseMarkdownFrontmatter', () => {
  it('parses minimal metadata and keeps the body separate', () => {
    const result = parseMarkdownFrontmatter(fixture('valid/minimal.md'), {
      path: 'docs/getting-started.md',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.document.metadata).toMatchObject({
      id: 'guides/getting-started',
      schema_version: '1.0',
    });
    expect(result.document.body.startsWith('# Getting started')).toBe(true);
    expect(result.document.path).toBe('docs/getting-started.md');
    expect(result.document.frontmatter).toEqual({ startLine: 2, endLine: 9 });
  });

  it('parses the complete public contract', () => {
    const result = parseMarkdownFrontmatter(fixture('valid/complete.md'));

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.document.metadata).toMatchObject({
      authority: 'canonical',
      review_after: '2027-02-01',
      supersedes: ['architecture/authentication@1.0'],
      tags: ['architecture', 'security'],
    });
  });

  it('parses the 1.1 subject and lineage contract', () => {
    const result = parseMarkdownFrontmatter(fixture('valid/subject-lineage-v1.1.md'));

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.document.metadata).toMatchObject({
      aliases: ['City Transport Planner'],
      id: 'canon/mobility-service',
      kind: 'canon',
      relations: [
        { target: 'products/route-planner', type: 'evolved_from' },
        { target: 'decisions/mobility-positioning', type: 'decided_by' },
      ],
      schema_version: '1.1',
      subjects: ['products/mobility-service'],
    });
  });

  it.each([
    ['invalid/missing.md', 'CKP002_FRONTMATTER_MISSING'],
    ['invalid/malformed.md', 'CKP005_YAML_INVALID'],
    ['invalid/multiple.md', 'CKP004_FRONTMATTER_MULTIPLE'],
    ['invalid/unsupported-version.md', 'CKP007_SCHEMA_VERSION_UNSUPPORTED'],
  ] as const)('rejects %s with %s', (path, code) => {
    const result = parseMarkdownFrontmatter(fixture(path), { path });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.diagnostics[0]).toMatchObject({ code, path });
  });

  it('rejects 1.1 canon without governed subjects', () => {
    const source = fixture('valid/subject-lineage-v1.1.md').replace(
      /subjects:\n {2}- products\/mobility-service\n/,
      '',
    );
    const result = parseMarkdownFrontmatter(source);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({ code: 'CKP008_METADATA_INVALID' }),
    );
  });

  it('reports schema failures at the relevant Markdown line', () => {
    const result = parseMarkdownFrontmatter(`---
schema_version: "1.0"
id: INVALID ID
title: Invalid identity
status: draft
authority: reference
owner: documentation
version: "0.1"
visibility: public
---
Body
`);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.diagnostics[0]).toMatchObject({
      code: 'CKP008_METADATA_INVALID',
      location: { line: 3, column: 5 },
    });
  });

  it('enforces a byte-based configurable file limit', () => {
    const result = parseMarkdownFrontmatter('éé', { maxFileBytes: 3 });

    expect(result).toEqual({
      ok: false,
      diagnostics: [
        {
          code: 'CKP001_FILE_TOO_LARGE',
          location: { line: 1, column: 1 },
          message: 'Document exceeds the 3-byte limit.',
          path: '<input>',
        },
      ],
    });
  });

  it('rejects aliases so YAML expansion cannot bypass parser bounds', () => {
    const result = parseMarkdownFrontmatter(`---
schema_version: "1.0"
id: guides/aliases
title: &title Alias example
status: draft
authority: reference
owner: documentation
version: "0.1"
visibility: public
tags: [*title]
---
Body
`);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.diagnostics[0]?.code).toBe('CKP005_YAML_INVALID');
  });

  it('rejects duplicate keys as ambiguous YAML', () => {
    const result = parseMarkdownFrontmatter(`---
schema_version: "1.0"
id: guides/duplicate
title: First title
title: Second title
status: draft
authority: reference
owner: documentation
version: "0.1"
visibility: public
---
Body
`);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.diagnostics[0]?.code).toBe('CKP005_YAML_INVALID');
  });

  it('accepts a byte-order mark and CRLF delimiters', () => {
    const source = `\ufeff---\r
schema_version: "1.0"\r
id: guides/windows\r
title: Windows newlines\r
status: draft\r
authority: reference\r
owner: documentation\r
version: "0.1"\r
visibility: public\r
---\r
# Body\r
`;
    const result = parseMarkdownFrontmatter(source);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.document.metadata.id).toBe('guides/windows');
    expect(result.document.body).toBe('# Body\r\n');
  });

  it('treats metadata-like body text as untrusted content', () => {
    const source = fixture('valid/minimal.md').replace(
      'This body remains separate from its governance metadata.',
      'schema_version: "2.0"\nauthority: canonical',
    );
    const result = parseMarkdownFrontmatter(source);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.document.metadata).toMatchObject({
      authority: 'reference',
      schema_version: '1.0',
    });
    expect(result.document.body).toContain('schema_version: "2.0"');
  });

  it('does not mistake Markdown horizontal rules for another metadata block', () => {
    const source = fixture('valid/minimal.md').replace(
      '# Getting started',
      '---\n# Getting started\n---',
    );
    const result = parseMarkdownFrontmatter(source);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.document.body).toContain('# Getting started');
  });

  it('rejects an unclosed block and invalid parser limits', () => {
    expect(parseMarkdownFrontmatter('---\nschema_version: "1.0"')).toMatchObject({
      ok: false,
      diagnostics: [{ code: 'CKP003_FRONTMATTER_UNCLOSED' }],
    });
    expect(() => parseMarkdownFrontmatter('', { maxFileBytes: 0 })).toThrow(RangeError);
  });
});
