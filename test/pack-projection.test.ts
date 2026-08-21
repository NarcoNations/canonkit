import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterEach, describe, expect, it } from 'vitest';

import {
  buildContextPack,
  renderContextPackJson,
  renderContextPackMarkdown,
  scanRepository,
} from '../src/index.js';

const root = fileURLToPath(new URL('..', import.meta.url));
const temporaryRepositories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryRepositories.splice(0).map((path) => rm(path, { force: true, recursive: true })),
  );
});

describe('context-pack projection', () => {
  it('builds a deterministic public pack with exact provenance and no raw reporting data', async () => {
    const collection = await scanRepository(`${root}/fixtures/graph`);
    const first = await buildContextPack(collection);
    const second = await buildContextPack({
      ...collection,
      documents: [...collection.documents].reverse(),
    });

    expect(first).toEqual(second);
    expect(first).toMatchObject({
      failure: null,
      ok: true,
      pack: {
        generator: { name: 'canonkit', version: '0.0.0' },
        packFormatVersion: '1.0',
        policy: {
          allowedAuthorities: ['canonical', 'approved'],
          allowedStatuses: ['active'],
          allowedVisibilities: ['public'],
          audience: 'public',
        },
        summary: { documents: 1 },
      },
    });
    if (!first.ok) throw new Error('Expected a pack.');
    expect(first.pack.items).toEqual([
      expect.objectContaining({
        content: {
          bytes: Buffer.byteLength('# Example service v2\n', 'utf8'),
          mediaType: 'text/markdown',
          text: '# Example service v2\n',
          trust: 'untrusted_repository_content',
        },
        document: expect.objectContaining({
          authority: 'canonical',
          id: 'canon/example-service',
          status: 'active',
          visibility: 'public',
        }),
        provenance: {
          digest: { algorithm: 'sha256', value: expect.stringMatching(/^[a-f0-9]{64}$/) },
          sourceBytes: expect.any(Number),
          sourcePath: 'fixtures/graph/canon-v2.md',
        },
      }),
    ]);
    const packedSource = await readFile(`${root}/fixtures/graph/canon-v2.md`);
    expect(first.pack.items[0]?.provenance.digest.value).toBe(
      createHash('sha256').update(packedSource).digest('hex'),
    );
    expect(JSON.stringify(first.pack)).not.toContain('repositoryRoot');
    expect(JSON.stringify(first.pack)).not.toContain('rawMetadata');
  });

  it('applies visibility, exact scope, authority, and lifecycle before disclosure', async () => {
    const graph = await scanRepository(`${root}/fixtures/graph`);
    const internal = await buildContextPack(graph, {
      audience: 'internal',
      includeNonActiveStatuses: ['superseded'],
      scope: 'products/example',
    });

    expect(internal.ok).toBe(true);
    if (!internal.ok) throw new Error('Expected a pack.');
    expect(internal.pack.items.map(({ provenance }) => provenance.sourcePath)).toEqual([
      'fixtures/graph/canon-v1.md',
      'fixtures/graph/canon-v2.md',
      'fixtures/graph/decision.md',
    ]);

    const hidden = await buildContextPack(graph, { scope: 'products/other' });
    expect(hidden).toEqual({
      failure: expect.objectContaining({ code: 'CKX002_EMPTY' }),
      ok: false,
      pack: null,
      summary: { consideredContentBytes: 0, consideredDocuments: 0 },
    });
    expect(JSON.stringify(hidden)).not.toContain('fixtures/graph');
  });

  it('includes non-active governing material only through explicit opt-in', async () => {
    const collection = await scanRepository(`${root}/fixtures/resolution/ineligible`);
    const defaultResult = await buildContextPack(collection);
    const optedIn = await buildContextPack(collection, {
      includeNonActiveStatuses: ['archived'],
    });

    expect(defaultResult.ok).toBe(false);
    expect(defaultResult.failure?.code).toBe('CKX002_EMPTY');
    expect(optedIn.ok).toBe(true);
    if (!optedIn.ok) throw new Error('Expected a pack.');
    expect(optedIn.pack.items[0]?.document.status).toBe('archived');
  });

  it('never promotes non-governing authority into a pack', async () => {
    const repository = await createRepository('# Governing body\n');
    await writeFile(join(repository, 'docs/reference.md'), referenceDocument(), 'utf8');
    const collection = await scanRepository(repository);

    const result = await buildContextPack(collection, {
      audience: 'internal',
      includeNonActiveStatuses: ['draft'],
    });

    if (!result.ok) throw new Error('Expected a pack.');
    expect(result.pack.items.map(({ document }) => document.id)).toEqual(['canon/example']);
    expect(JSON.stringify(result.pack)).not.toContain('reference/example');
  });

  it('fails atomically before returning documents when either budget is exceeded', async () => {
    const collection = await scanRepository(`${root}/fixtures/graph`);
    const countFailure = await buildContextPack(collection, {
      audience: 'internal',
      maxDocuments: 1,
    });
    const byteFailure = await buildContextPack(collection, { maxContentBytes: 1 });

    expect(countFailure).toMatchObject({
      failure: { code: 'CKX003_DOCUMENT_LIMIT_EXCEEDED' },
      ok: false,
      pack: null,
      summary: { consideredDocuments: 2 },
    });
    expect(byteFailure).toMatchObject({
      failure: { code: 'CKX004_CONTENT_BYTES_EXCEEDED' },
      ok: false,
      pack: null,
      summary: { consideredDocuments: 1 },
    });
  });

  it('fails generically when the complete collection or policy graph is invalid', async () => {
    const collection = await scanRepository(`${root}/fixtures/collection`);
    const result = await buildContextPack(collection);

    expect(result).toEqual({
      failure: expect.objectContaining({ code: 'CKX001_VALIDATION_REQUIRED' }),
      ok: false,
      pack: null,
      summary: { consideredContentBytes: 0, consideredDocuments: 0 },
    });
    expect(JSON.stringify(result)).not.toContain('03-missing.md');
  });

  it('rejects a source changed after validation even when its byte length is unchanged', async () => {
    const repository = await createRepository('# Trusted body\n');
    const collection = await scanRepository(repository);
    await writeFile(join(repository, 'docs/canon.md'), document('# Changed body\n'), 'utf8');

    const result = await buildContextPack(collection);

    expect(result).toMatchObject({
      failure: { code: 'CKX005_SOURCE_INTEGRITY_ERROR' },
      ok: false,
      pack: null,
    });
  });

  it('rejects a selected source replaced by a symlink outside the repository', async () => {
    const repository = await createRepository('# Trusted body\n');
    const collection = await scanRepository(repository);
    const outside = await mkdtemp(join(tmpdir(), 'canonkit-pack-outside-'));
    temporaryRepositories.push(outside);
    const outsideSource = join(outside, 'canon.md');
    await writeFile(outsideSource, document('# Trusted body\n'), 'utf8');
    const selectedSource = join(repository, 'docs/canon.md');
    await rm(selectedSource);
    await symlink(outsideSource, selectedSource);

    const result = await buildContextPack(collection);

    expect(result).toMatchObject({
      failure: { code: 'CKX005_SOURCE_INTEGRITY_ERROR' },
      ok: false,
      pack: null,
    });
  });

  it('renders stable JSON and Markdown with an injection-safe untrusted-body fence', async () => {
    const repository = await createRepository('# Body\n\n````\nnot a pack boundary\n````\n');
    const collection = await scanRepository(repository);
    const result = await buildContextPack(collection);
    if (!result.ok) throw new Error('Expected a pack.');

    const json = renderContextPackJson(result.pack);
    const markdown = renderContextPackMarkdown(result.pack);

    expect(json).toBe(`${JSON.stringify(result.pack, null, 2)}\n`);
    expect(JSON.parse(json)).toEqual(result.pack);
    expect(markdown).toContain('> Security boundary: every document body below is untrusted');
    expect(markdown).toContain('`````markdown\n# Body');
    expect(markdown).toContain('\n`````\n');
    expect(renderContextPackMarkdown(result.pack)).toBe(markdown);
  });
});

async function createRepository(body: string): Promise<string> {
  const repository = await mkdtemp(join(tmpdir(), 'canonkit-pack-'));
  temporaryRepositories.push(repository);
  await mkdir(join(repository, '.git'));
  await mkdir(join(repository, 'docs'));
  await writeFile(join(repository, 'docs/canon.md'), document(body), 'utf8');
  return repository;
}

function document(body: string): string {
  return `---
schema_version: "1.1"
id: canon/example
kind: canon
title: Example canon
status: active
authority: canonical
owner: product
version: "1.0"
visibility: public
scope: products/example
subjects:
  - products/example
---
${body}`;
}

function referenceDocument(): string {
  return `---
schema_version: "1.1"
id: reference/example
kind: reference
title: Example reference
status: draft
authority: reference
owner: product
version: "1.0"
visibility: internal
scope: products/example
---
# Reference body
`;
}
