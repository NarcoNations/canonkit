import { cp, lstat, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterEach, describe, expect, it } from 'vitest';

import { discoverMarkdownFiles } from '../src/index.js';

const root = fileURLToPath(new URL('..', import.meta.url));
const temporaryDirectories: string[] = [];

afterEach(async () => {
  for (const path of temporaryDirectories.splice(0)) {
    await rm(path, { force: true, recursive: true });
  }
});

async function createFixtureRepository(): Promise<string> {
  const parent = await mkdtemp(join(tmpdir(), 'canonkit-discovery-'));
  temporaryDirectories.push(parent);
  const repository = join(parent, 'repository');
  await cp(join(root, 'fixtures/repository'), repository, { recursive: true });
  await mkdir(join(repository, '.git'));
  return repository;
}

describe('discoverMarkdownFiles', () => {
  it('finds eligible Markdown in stable repository-relative order', async () => {
    const repository = await createFixtureRepository();
    const result = await discoverMarkdownFiles(repository);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.files.map((file) => file.relativePath)).toEqual([
      'docs/a-overview.md',
      'docs/nested/z-reference.markdown',
      'private/internal.md',
    ]);
    expect(result.scanRoots).toEqual(['.']);
    expect(result.files.every((file) => file.absolutePath.startsWith(result.repositoryRoot))).toBe(
      true,
    );
  });

  it('uses a subdirectory start path as the default scan root', async () => {
    const repository = await createFixtureRepository();
    const result = await discoverMarkdownFiles(join(repository, 'docs/nested'));

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.scanRoots).toEqual(['docs/nested']);
    expect(result.files.map((file) => file.relativePath)).toEqual([
      'docs/nested/z-reference.markdown',
    ]);
  });

  it('supports configured include and exclude paths', async () => {
    const repository = await createFixtureRepository();
    const result = await discoverMarkdownFiles(repository, {
      excludePaths: ['docs/nested'],
      includePaths: ['docs', 'private'],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.files.map((file) => file.relativePath)).toEqual([
      'docs/a-overview.md',
      'private/internal.md',
    ]);
  });

  it('supports added directory exclusions and case-insensitive Markdown extensions', async () => {
    const repository = await createFixtureRepository();
    await writeFile(join(repository, 'docs/upper.MD'), '# Upper-case extension\n');
    const result = await discoverMarkdownFiles(repository, {
      excludedDirectoryNames: ['private'],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.files.map((file) => file.relativePath)).toContain('docs/upper.MD');
    expect(result.files.map((file) => file.relativePath)).not.toContain('private/internal.md');
  });

  it('keeps default directory exclusions when they are explicitly included', async () => {
    const repository = await createFixtureRepository();
    const result = await discoverMarkdownFiles(repository, { includePaths: ['node_modules'] });

    expect(result).toMatchObject({ ok: true, files: [] });
  });

  it('never follows internal or escaping symlinks', async () => {
    const repository = await createFixtureRepository();
    const outside = join(dirname(repository), 'outside.md');
    await writeFile(outside, '# Outside\n');
    await symlink(outside, join(repository, 'docs/escape.md'));
    await symlink(
      join(repository, 'private/internal.md'),
      join(repository, 'docs/internal-link.md'),
    );

    const result = await discoverMarkdownFiles(repository);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.files.map((file) => file.relativePath)).not.toContain('docs/escape.md');
    expect(result.files.map((file) => file.relativePath)).not.toContain('docs/internal-link.md');
    expect(await readFile(outside, 'utf8')).toBe('# Outside\n');
    expect((await lstat(join(repository, 'docs/escape.md'))).isSymbolicLink()).toBe(true);
  });

  it('does not cross into a nested Git repository', async () => {
    const repository = await createFixtureRepository();
    const nestedRepository = join(repository, 'nested-repository');
    await mkdir(join(nestedRepository, '.git'), { recursive: true });
    await writeFile(join(nestedRepository, 'nested.md'), '# Nested repository\n');

    const result = await discoverMarkdownFiles(repository);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.files.map((file) => file.relativePath)).not.toContain(
      'nested-repository/nested.md',
    );
  });

  it('fails closed when configured paths try to escape the repository', async () => {
    const repository = await createFixtureRepository();
    const result = await discoverMarkdownFiles(repository, { includePaths: ['../'] });

    expect(result).toMatchObject({
      ok: false,
      diagnostics: [{ code: 'CKD003_PATH_OUTSIDE_REPOSITORY', path: '../' }],
    });
  });

  it('fails closed when a configured symlink resolves outside the repository', async () => {
    const repository = await createFixtureRepository();
    const outside = join(dirname(repository), 'outside-directory');
    await mkdir(outside);
    await writeFile(join(outside, 'outside.md'), '# Outside\n');
    await symlink(outside, join(repository, 'linked-directory'));

    const result = await discoverMarkdownFiles(repository, { includePaths: ['linked-directory'] });

    expect(result).toMatchObject({
      ok: false,
      diagnostics: [{ code: 'CKD003_PATH_OUTSIDE_REPOSITORY', path: 'linked-directory' }],
    });
  });

  it('enforces the configured document-count limit without returning partial results', async () => {
    const repository = await createFixtureRepository();
    const result = await discoverMarkdownFiles(repository, { maxDocuments: 1 });

    expect(result).toMatchObject({
      ok: false,
      diagnostics: [{ code: 'CKD005_DOCUMENT_LIMIT_EXCEEDED' }],
    });
  });

  it('reports missing paths and directories outside a Git repository', async () => {
    const repository = await createFixtureRepository();
    const missing = await discoverMarkdownFiles(join(repository, 'missing'));
    expect(missing).toMatchObject({
      ok: false,
      diagnostics: [{ code: 'CKD001_START_PATH_NOT_FOUND' }],
    });

    const ordinaryDirectory = await mkdtemp(join(tmpdir(), 'canonkit-no-repository-'));
    temporaryDirectories.push(ordinaryDirectory);
    const noRepository = await discoverMarkdownFiles(ordinaryDirectory);
    expect(noRepository).toMatchObject({
      ok: false,
      diagnostics: [{ code: 'CKD002_REPOSITORY_NOT_FOUND' }],
    });
  });

  it('validates discovery limits and excluded directory names', async () => {
    const repository = await createFixtureRepository();
    await expect(discoverMarkdownFiles(repository, { maxDocuments: 0 })).rejects.toThrow(
      RangeError,
    );
    await expect(
      discoverMarkdownFiles(repository, { excludedDirectoryNames: ['nested/name'] }),
    ).rejects.toThrow(TypeError);
  });
});
