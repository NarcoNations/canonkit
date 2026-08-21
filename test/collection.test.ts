import { cp, mkdir, mkdtemp, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterEach, describe, expect, it } from 'vitest';

import {
  DEFAULT_MAX_TOTAL_BYTES,
  HARD_MAX_TOTAL_BYTES,
  scanRepository,
} from '../src/index.js';

const root = fileURLToPath(new URL('..', import.meta.url));
const temporaryDirectories: string[] = [];

afterEach(async () => {
  for (const path of temporaryDirectories.splice(0)) {
    await rm(path, { force: true, recursive: true });
  }
});

async function createCollectionRepository(): Promise<string> {
  const parent = await mkdtemp(join(tmpdir(), 'canonkit-collection-'));
  temporaryDirectories.push(parent);
  const repository = join(parent, 'repository');
  await cp(join(root, 'fixtures/collection'), repository, { recursive: true });
  await mkdir(join(repository, '.git'));
  return repository;
}

describe('scanRepository', () => {
  it('returns valid documents and diagnostics for every invalid neighbour', async () => {
    const repository = await createCollectionRepository();
    const collection = await scanRepository(repository);

    expect(collection.ok).toBe(false);
    expect(collection.documents.map((document) => document.id)).toEqual([
      'guides/overview',
      'guides/reference',
    ]);
    expect(collection.diagnostics.map(({ code, path, phase }) => ({ code, path, phase }))).toEqual([
      {
        code: 'CKP002_FRONTMATTER_MISSING',
        path: 'docs/03-missing.md',
        phase: 'parse',
      },
      {
        code: 'CKP005_YAML_INVALID',
        path: 'docs/04-malformed.md',
        phase: 'parse',
      },
      {
        code: 'CKP007_SCHEMA_VERSION_UNSUPPORTED',
        path: 'docs/05-unsupported.md',
        phase: 'parse',
      },
    ]);
    expect(collection.summary).toEqual({
      discoveredFiles: 5,
      errors: 3,
      invalidDocuments: 3,
      validDocuments: 2,
    });
  });

  it('normalises optional fields without inventing authority', async () => {
    const repository = await createCollectionRepository();
    const collection = await scanRepository(repository);
    const overview = collection.documents[0];
    const reference = collection.documents[1];

    expect(overview).toMatchObject({
      authority: 'approved',
      reviewAfter: null,
      scope: 'guides',
      source: { path: 'docs/01-overview.md' },
      supersedes: [],
      tags: ['guide'],
    });
    expect(reference).toMatchObject({
      authority: 'reference',
      reviewAfter: null,
      scope: null,
      supersedes: [],
      tags: [],
    });
    expect(reference?.reporting.rawMetadata).not.toHaveProperty('scope');
  });

  it('passes bounded discovery configuration through to the collection scan', async () => {
    const repository = await createCollectionRepository();
    const collection = await scanRepository(repository, {
      includePaths: ['docs/01-overview.md'],
      maxDocuments: 1,
    });

    expect(collection.ok).toBe(true);
    expect(collection.documents.map((document) => document.id)).toEqual(['guides/overview']);
    expect(collection.summary).toEqual({
      discoveredFiles: 1,
      errors: 0,
      invalidDocuments: 0,
      validDocuments: 1,
    });
  });

  it('produces a stable JSON-serialisable result without undefined values', async () => {
    const repository = await createCollectionRepository();
    const first = await scanRepository(repository);
    const second = await scanRepository(repository);
    const serialized = JSON.stringify(first);

    expect(JSON.parse(serialized)).toEqual(first);
    expect(serialized).not.toContain('undefined');
    expect(second.documents).toEqual(first.documents);
    expect(second.diagnostics).toEqual(first.diagnostics);
  });

  it('rejects invalid UTF-8 while preserving other documents', async () => {
    const repository = await createCollectionRepository();
    await writeFile(join(repository, 'docs/06-invalid-utf8.md'), Buffer.from([0xc3, 0x28]));
    const collection = await scanRepository(repository);

    expect(collection.documents).toHaveLength(2);
    expect(collection.diagnostics).toContainEqual({
      code: 'CKS002_INVALID_UTF8',
      location: { line: 1, column: 1 },
      message: 'Document is not valid UTF-8.',
      path: 'docs/06-invalid-utf8.md',
      phase: 'parse',
      severity: 'error',
    });
  });

  it('enforces byte limits without returning partial invalid documents', async () => {
    const repository = await createCollectionRepository();
    const collection = await scanRepository(repository, { maxFileBytes: 200 });

    expect(collection.diagnostics.some((diagnostic) => diagnostic.code === 'CKP001_FILE_TOO_LARGE')).toBe(
      true,
    );
    expect(collection.summary.discoveredFiles).toBe(5);
    expect(collection.summary.invalidDocuments).toBe(
      collection.summary.discoveredFiles - collection.summary.validDocuments,
    );
  });

  it('fails atomically when repository Markdown exceeds the aggregate byte limit', async () => {
    const parent = await mkdtemp(join(tmpdir(), 'canonkit-collection-total-'));
    temporaryDirectories.push(parent);
    const repository = join(parent, 'repository');
    await mkdir(join(repository, '.git'), { recursive: true });
    await mkdir(join(repository, 'docs'));
    const first = validDocument('guides/first', '# First body\n');
    await writeFile(join(repository, 'docs/01-first.md'), first, 'utf8');
    await writeFile(
      join(repository, 'docs/02-second.md'),
      validDocument('guides/second', '# Second body\n'),
      'utf8',
    );

    const collection = await scanRepository(repository, {
      maxTotalBytes: Buffer.byteLength(first, 'utf8'),
    });

    expect(collection).toEqual({
      collectionFormatVersion: '1.0',
      diagnostics: [
        {
          code: 'CKS003_TOTAL_BYTES_EXCEEDED',
          location: null,
          message: `Repository Markdown exceeds the ${Buffer.byteLength(first, 'utf8')}-byte aggregate limit.`,
          path: '.',
          phase: 'read',
          severity: 'error',
        },
      ],
      documents: [],
      ok: false,
      repositoryRoot: await realpath(repository),
      scanRoots: ['.'],
      summary: {
        discoveredFiles: 2,
        errors: 1,
        invalidDocuments: 2,
        validDocuments: 0,
      },
    });
  });

  it('normalises discovery failures into an empty diagnostic collection', async () => {
    const parent = await mkdtemp(join(tmpdir(), 'canonkit-collection-missing-'));
    temporaryDirectories.push(parent);
    const collection = await scanRepository(join(parent, 'missing'));

    expect(collection).toMatchObject({
      collectionFormatVersion: '1.0',
      diagnostics: [{ code: 'CKD001_START_PATH_NOT_FOUND', phase: 'discovery' }],
      documents: [],
      ok: false,
      repositoryRoot: null,
      scanRoots: [],
      summary: {
        discoveredFiles: 0,
        errors: 1,
        invalidDocuments: 0,
        validDocuments: 0,
      },
    });
  });

  it('validates file limits before discovery', async () => {
    await expect(scanRepository('missing', { maxFileBytes: 0 })).rejects.toThrow(RangeError);
  });

  it('validates aggregate limits before discovery', async () => {
    expect(DEFAULT_MAX_TOTAL_BYTES).toBe(32 * 1024 * 1024);
    expect(HARD_MAX_TOTAL_BYTES).toBe(256 * 1024 * 1024);
    await expect(scanRepository('missing', { maxTotalBytes: 0 })).rejects.toThrow(RangeError);
    await expect(
      scanRepository('missing', { maxTotalBytes: HARD_MAX_TOTAL_BYTES + 1 }),
    ).rejects.toThrow(RangeError);
  });

  it('charges bounded oversized reads against the aggregate budget', async () => {
    const parent = await mkdtemp(join(tmpdir(), 'canonkit-collection-oversized-total-'));
    temporaryDirectories.push(parent);
    const repository = join(parent, 'repository');
    await mkdir(join(repository, '.git'), { recursive: true });
    await mkdir(join(repository, 'docs'));

    for (const name of ['01-first.md', '02-second.md', '03-third.md']) {
      await writeFile(join(repository, 'docs', name), 'x'.repeat(300), 'utf8');
    }

    const collection = await scanRepository(repository, {
      maxFileBytes: 100,
      maxTotalBytes: 202,
    });

    expect(collection).toMatchObject({
      diagnostics: [{ code: 'CKS003_TOTAL_BYTES_EXCEEDED' }],
      documents: [],
      ok: false,
      summary: {
        discoveredFiles: 3,
        errors: 1,
        invalidDocuments: 3,
        validDocuments: 0,
      },
    });
  });
});

function validDocument(id: string, body: string): string {
  return `---
schema_version: "1.1"
id: ${id}
kind: reference
title: Example document
status: active
authority: reference
owner: docs
version: "1.0"
visibility: public
---
${body}`;
}
