import { lstat, readdir, realpath } from 'node:fs/promises';
import { basename, dirname, extname, isAbsolute, join, relative, resolve, sep } from 'node:path';

export const DEFAULT_MAX_DOCUMENTS = 10_000;
export const DEFAULT_EXCLUDED_DIRECTORY_NAMES = Object.freeze([
  '.git',
  '.next',
  '.vercel',
  'build',
  'coverage',
  'dist',
  'node_modules',
  'vendor',
]);

export interface DiscoveryOptions {
  excludePaths?: readonly string[];
  excludedDirectoryNames?: readonly string[];
  includePaths?: readonly string[];
  maxDocuments?: number;
}

export interface DiscoveredMarkdownFile {
  absolutePath: string;
  relativePath: string;
}

export type DiscoveryDiagnosticCode =
  | 'CKD001_START_PATH_NOT_FOUND'
  | 'CKD002_REPOSITORY_NOT_FOUND'
  | 'CKD003_PATH_OUTSIDE_REPOSITORY'
  | 'CKD004_IO_ERROR'
  | 'CKD005_DOCUMENT_LIMIT_EXCEEDED';

export interface DiscoveryDiagnostic {
  code: DiscoveryDiagnosticCode;
  message: string;
  path: string;
}

export type DiscoveryResult =
  | {
      files: DiscoveredMarkdownFile[];
      ok: true;
      repositoryRoot: string;
      scanRoots: string[];
    }
  | { diagnostics: DiscoveryDiagnostic[]; ok: false };

export async function discoverMarkdownFiles(
  startPath: string,
  options: DiscoveryOptions = {},
): Promise<DiscoveryResult> {
  const maxDocuments = options.maxDocuments ?? DEFAULT_MAX_DOCUMENTS;
  if (!Number.isSafeInteger(maxDocuments) || maxDocuments <= 0) {
    throw new RangeError('maxDocuments must be a positive safe integer');
  }

  const start = await resolveExistingPath(startPath);
  if (!start.ok) return start.result;

  const startStats = await safeLstat(start.path);
  if (!startStats.ok) return ioFailure(start.path, startStats.error);
  const startDirectory = startStats.stats.isDirectory() ? start.path : dirname(start.path);
  const repositoryRootResult = await findRepositoryRoot(startDirectory);
  if (!repositoryRootResult.ok) return repositoryRootResult.result;
  const repositoryRoot = repositoryRootResult.path;

  const configuredRoots = options.includePaths ?? [relative(repositoryRoot, start.path) || '.'];
  const scanRootsResult = await resolveConfiguredPaths(
    repositoryRoot,
    configuredRoots,
    'includePaths',
  );
  if (!scanRootsResult.ok) return scanRootsResult.result;

  const excludedPathsResult = await resolveConfiguredPaths(
    repositoryRoot,
    options.excludePaths ?? [],
    'excludePaths',
    false,
  );
  if (!excludedPathsResult.ok) return excludedPathsResult.result;

  const excludedDirectoryNames = new Set([
    ...DEFAULT_EXCLUDED_DIRECTORY_NAMES,
    ...(options.excludedDirectoryNames ?? []),
  ]);
  validateDirectoryNames(excludedDirectoryNames);

  const files = new Map<string, DiscoveredMarkdownFile>();
  const scanRoots = scanRootsResult.paths.map((path) => toRepositoryPath(repositoryRoot, path));

  for (const scanRoot of scanRootsResult.paths) {
    const scanResult = await scanPath({
      excludedDirectoryNames,
      excludedPaths: excludedPathsResult.paths,
      files,
      maxDocuments,
      path: scanRoot,
      repositoryRoot,
    });
    if (!scanResult.ok) return scanResult.result;
  }

  return {
    files: [...files.values()].sort((left, right) =>
      compareStable(left.relativePath, right.relativePath),
    ),
    ok: true,
    repositoryRoot,
    scanRoots: scanRoots.sort(compareStable),
  };
}

type Failure = Extract<DiscoveryResult, { ok: false }>;
type PathResult = { ok: true; path: string } | { ok: false; result: Failure };
type PathsResult = { ok: true; paths: string[] } | { ok: false; result: Failure };

async function resolveExistingPath(path: string): Promise<PathResult> {
  try {
    return { ok: true, path: await realpath(resolve(path)) };
  } catch (error) {
    if (isNodeError(error) && error.code === 'ENOENT') {
      return {
        ok: false,
        result: failure(
          'CKD001_START_PATH_NOT_FOUND',
          'Start path does not exist.',
          resolve(path),
        ),
      };
    }
    return { ok: false, result: ioFailure(resolve(path), error) };
  }
}

async function findRepositoryRoot(startDirectory: string): Promise<PathResult> {
  let current = startDirectory;
  while (true) {
    const marker = await safeLstat(join(current, '.git'));
    if (marker.ok) return { ok: true, path: current };
    if (!isNodeError(marker.error) || marker.error.code !== 'ENOENT') {
      return { ok: false, result: ioFailure(join(current, '.git'), marker.error) };
    }
    const parent = dirname(current);
    if (parent === current) {
      return {
        ok: false,
        result: failure(
          'CKD002_REPOSITORY_NOT_FOUND',
          'No Git repository boundary was found for the start path.',
          startDirectory,
        ),
      };
    }
    current = parent;
  }
}

async function resolveConfiguredPaths(
  repositoryRoot: string,
  paths: readonly string[],
  optionName: string,
  mustExist = true,
): Promise<PathsResult> {
  const resolvedPaths: string[] = [];

  for (const configuredPath of paths) {
    if (configuredPath.length === 0 || isAbsolute(configuredPath)) {
      return outsideFailure(configuredPath, optionName);
    }
    const lexicalPath = resolve(repositoryRoot, configuredPath);
    if (!isInside(repositoryRoot, lexicalPath)) return outsideFailure(configuredPath, optionName);

    try {
      const canonicalPath = await realpath(lexicalPath);
      if (!isInside(repositoryRoot, canonicalPath)) return outsideFailure(configuredPath, optionName);
      resolvedPaths.push(canonicalPath);
    } catch (error) {
      if (!mustExist && isNodeError(error) && error.code === 'ENOENT') {
        resolvedPaths.push(lexicalPath);
        continue;
      }
      if (isNodeError(error) && error.code === 'ENOENT') {
        return {
          ok: false,
          result: failure(
            'CKD001_START_PATH_NOT_FOUND',
            `${optionName} entry does not exist.`,
            configuredPath,
          ),
        };
      }
      return { ok: false, result: ioFailure(configuredPath, error) };
    }
  }

  return { ok: true, paths: [...new Set(resolvedPaths)].sort(compareStable) };
}

interface ScanContext {
  excludedDirectoryNames: Set<string>;
  excludedPaths: string[];
  files: Map<string, DiscoveredMarkdownFile>;
  maxDocuments: number;
  path: string;
  repositoryRoot: string;
}

async function scanPath(context: ScanContext): Promise<{ ok: true } | { ok: false; result: Failure }> {
  if (isExcluded(context.path, context.excludedPaths)) return { ok: true };
  if (
    context.path !== context.repositoryRoot &&
    context.excludedDirectoryNames.has(basename(context.path))
  ) {
    return { ok: true };
  }

  const statsResult = await safeLstat(context.path);
  if (!statsResult.ok) return { ok: false, result: ioFailure(context.path, statsResult.error) };
  const { stats } = statsResult;

  if (stats.isSymbolicLink()) return { ok: true };
  if (stats.isFile()) {
    if (!isMarkdownPath(context.path)) return { ok: true };
    context.files.set(context.path, {
      absolutePath: context.path,
      relativePath: toRepositoryPath(context.repositoryRoot, context.path),
    });
    if (context.files.size > context.maxDocuments) {
      return {
        ok: false,
        result: failure(
          'CKD005_DOCUMENT_LIMIT_EXCEEDED',
          `Discovery exceeded the ${context.maxDocuments}-document limit.`,
          context.repositoryRoot,
        ),
      };
    }
    return { ok: true };
  }
  if (!stats.isDirectory()) return { ok: true };

  if (context.path !== context.repositoryRoot) {
    const nestedRepositoryMarker = await safeLstat(join(context.path, '.git'));
    if (nestedRepositoryMarker.ok) return { ok: true };
    if (!isNodeError(nestedRepositoryMarker.error) || nestedRepositoryMarker.error.code !== 'ENOENT') {
      return {
        ok: false,
        result: ioFailure(join(context.path, '.git'), nestedRepositoryMarker.error),
      };
    }
  }

  let entries;
  try {
    entries = await readdir(context.path, { withFileTypes: true });
  } catch (error) {
    return { ok: false, result: ioFailure(context.path, error) };
  }

  for (const entry of entries.sort((left, right) => compareStable(left.name, right.name))) {
    if (entry.isDirectory() && context.excludedDirectoryNames.has(entry.name)) continue;
    const childResult = await scanPath({ ...context, path: join(context.path, entry.name) });
    if (!childResult.ok) return childResult;
  }

  return { ok: true };
}

function isExcluded(path: string, excludedPaths: string[]): boolean {
  return excludedPaths.some((excludedPath) => isInside(excludedPath, path));
}

function isInside(root: string, candidate: string): boolean {
  const pathFromRoot = relative(root, candidate);
  return (
    pathFromRoot === '' ||
    (!pathFromRoot.startsWith(`..${sep}`) && pathFromRoot !== '..' && !isAbsolute(pathFromRoot))
  );
}

function isMarkdownPath(path: string): boolean {
  const extension = extname(path).toLowerCase();
  return extension === '.md' || extension === '.markdown';
}

function toRepositoryPath(repositoryRoot: string, path: string): string {
  return relative(repositoryRoot, path).split(sep).join('/') || '.';
}

function validateDirectoryNames(names: Set<string>): void {
  for (const name of names) {
    if (name.length === 0 || name === '.' || name === '..' || name.includes('/') || name.includes('\\')) {
      throw new TypeError('excludedDirectoryNames entries must be single directory names');
    }
  }
}

function outsideFailure(path: string, optionName: string): PathsResult {
  return {
    ok: false,
    result: failure(
      'CKD003_PATH_OUTSIDE_REPOSITORY',
      `${optionName} entries must be relative paths inside the repository.`,
      path,
    ),
  };
}

function ioFailure(path: string, error: unknown): Failure {
  return failure(
    'CKD004_IO_ERROR',
    error instanceof Error ? error.message : 'Filesystem operation failed.',
    path,
  );
}

function failure(code: DiscoveryDiagnosticCode, message: string, path: string): Failure {
  return { ok: false, diagnostics: [{ code, message, path }] };
}

async function safeLstat(
  path: string,
): Promise<
  | { ok: true; stats: Awaited<ReturnType<typeof lstat>> }
  | { error: unknown; ok: false }
> {
  try {
    return { ok: true, stats: await lstat(path) };
  } catch (error) {
    return { error, ok: false };
  }
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error;
}

function compareStable(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}
