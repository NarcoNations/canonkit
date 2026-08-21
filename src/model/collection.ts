import { open } from 'node:fs/promises';

import {
  discoverMarkdownFiles,
  type DiscoveryDiagnostic,
  type DiscoveryDiagnosticCode,
  type DiscoveryOptions,
} from '../discovery/repository.js';
import {
  DEFAULT_MAX_FILE_BYTES,
  parseMarkdownFrontmatter,
  type CanonKitMetadata,
  type DocumentAuthority,
  type DocumentKind,
  type DocumentRelation,
  type DocumentStatus,
  type DocumentVisibility,
  type ParserDiagnostic,
  type ParserDiagnosticCode,
  type SourceLocation,
} from '../metadata/frontmatter.js';

export const COLLECTION_FORMAT_VERSION = '1.0' as const;
export const DEFAULT_MAX_TOTAL_BYTES = 32 * 1024 * 1024;
export const HARD_MAX_TOTAL_BYTES = 256 * 1024 * 1024;

export interface ScanRepositoryOptions extends DiscoveryOptions {
  maxFileBytes?: number;
  maxTotalBytes?: number;
}

export interface NormalizedDocument {
  aliases: string[];
  authority: DocumentAuthority;
  body: string;
  id: string;
  kind: DocumentKind | null;
  owner: string;
  reporting: {
    rawMetadata: CanonKitMetadata;
  };
  reviewAfter: string | null;
  relations: DocumentRelation[];
  schemaVersion: CanonKitMetadata['schema_version'];
  scope: string | null;
  source: {
    bytes: number;
    path: string;
  };
  status: DocumentStatus;
  subjects: string[];
  supersedes: string[];
  tags: string[];
  title: string;
  version: string;
  visibility: DocumentVisibility;
}

export type CollectionDiagnosticCode =
  | DiscoveryDiagnosticCode
  | ParserDiagnosticCode
  | 'CKS001_FILE_READ_ERROR'
  | 'CKS002_INVALID_UTF8'
  | 'CKS003_TOTAL_BYTES_EXCEEDED';

export interface CollectionDiagnostic {
  code: CollectionDiagnosticCode;
  location: SourceLocation | null;
  message: string;
  path: string;
  phase: 'discovery' | 'read' | 'parse';
  severity: 'error';
}

export interface DocumentCollection {
  collectionFormatVersion: typeof COLLECTION_FORMAT_VERSION;
  diagnostics: CollectionDiagnostic[];
  documents: NormalizedDocument[];
  ok: boolean;
  repositoryRoot: string | null;
  scanRoots: string[];
  summary: {
    discoveredFiles: number;
    errors: number;
    invalidDocuments: number;
    validDocuments: number;
  };
}

export async function scanRepository(
  startPath: string,
  options: ScanRepositoryOptions = {},
): Promise<DocumentCollection> {
  const {
    maxFileBytes = DEFAULT_MAX_FILE_BYTES,
    maxTotalBytes = DEFAULT_MAX_TOTAL_BYTES,
    ...discoveryOptions
  } = options;
  validateMaxFileBytes(maxFileBytes);
  validateMaxTotalBytes(maxTotalBytes);

  const discovery = await discoverMarkdownFiles(startPath, discoveryOptions);
  if (!discovery.ok) {
    const diagnostics = discovery.diagnostics.map(normalizeDiscoveryDiagnostic);
    return createCollection({ diagnostics, documents: [] });
  }

  const diagnostics: CollectionDiagnostic[] = [];
  const documents: NormalizedDocument[] = [];
  let totalBytes = 0;

  for (const file of discovery.files) {
    const remainingTotalBytes = maxTotalBytes - totalBytes;
    const readLimit = Math.min(maxFileBytes, remainingTotalBytes);
    let readResult: BoundedReadResult;
    try {
      readResult = await readBoundedFile(file.absolutePath, readLimit);
    } catch (error) {
      diagnostics.push({
        code: 'CKS001_FILE_READ_ERROR',
        location: null,
        message: error instanceof Error ? error.message : 'Unable to read document.',
        path: file.relativePath,
        phase: 'read',
        severity: 'error',
      });
      continue;
    }

    if (readResult.exceeded && remainingTotalBytes <= maxFileBytes) {
      return createCollection({
        diagnostics: [
          {
            code: 'CKS003_TOTAL_BYTES_EXCEEDED',
            location: null,
            message: `Repository Markdown exceeds the ${maxTotalBytes}-byte aggregate limit.`,
            path: '.',
            phase: 'read',
            severity: 'error',
          },
        ],
        discoveredFiles: discovery.files.length,
        documents: [],
        repositoryRoot: discovery.repositoryRoot,
        scanRoots: discovery.scanRoots,
      });
    }

    if (readResult.exceeded) {
      totalBytes += readResult.bytesRead;
      diagnostics.push({
        code: 'CKP001_FILE_TOO_LARGE',
        location: { line: 1, column: 1 },
        message: `Document exceeds the ${maxFileBytes}-byte limit.`,
        path: file.relativePath,
        phase: 'parse',
        severity: 'error',
      });
      continue;
    }
    const bytes = readResult.bytes;
    totalBytes += bytes.byteLength;

    let markdown: string;
    try {
      markdown = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    } catch {
      diagnostics.push({
        code: 'CKS002_INVALID_UTF8',
        location: { line: 1, column: 1 },
        message: 'Document is not valid UTF-8.',
        path: file.relativePath,
        phase: 'parse',
        severity: 'error',
      });
      continue;
    }

    const parsed = parseMarkdownFrontmatter(markdown, {
      maxFileBytes,
      path: file.relativePath,
    });
    if (!parsed.ok) {
      diagnostics.push(...parsed.diagnostics.map(normalizeParserDiagnostic));
      continue;
    }

    documents.push(
      normalizeDocument(
        parsed.document.metadata,
        parsed.document.body,
        file.relativePath,
        bytes.byteLength,
      ),
    );
  }

  return createCollection({
    diagnostics: diagnostics.sort(compareDiagnostics),
    documents,
    repositoryRoot: discovery.repositoryRoot,
    scanRoots: discovery.scanRoots,
    discoveredFiles: discovery.files.length,
  });
}

interface CollectionInput {
  diagnostics: CollectionDiagnostic[];
  discoveredFiles?: number;
  documents: NormalizedDocument[];
  repositoryRoot?: string;
  scanRoots?: string[];
}

function createCollection(input: CollectionInput): DocumentCollection {
  const discoveredFiles = input.discoveredFiles ?? 0;
  return {
    collectionFormatVersion: COLLECTION_FORMAT_VERSION,
    diagnostics: input.diagnostics,
    documents: input.documents,
    ok: input.diagnostics.length === 0,
    repositoryRoot: input.repositoryRoot ?? null,
    scanRoots: input.scanRoots ?? [],
    summary: {
      discoveredFiles,
      errors: input.diagnostics.length,
      invalidDocuments: discoveredFiles - input.documents.length,
      validDocuments: input.documents.length,
    },
  };
}

function normalizeDocument(
  metadata: CanonKitMetadata,
  body: string,
  path: string,
  bytes: number,
): NormalizedDocument {
  return {
    aliases: [...(metadata.aliases ?? [])],
    authority: metadata.authority,
    body,
    id: metadata.id,
    kind: metadata.kind ?? null,
    owner: metadata.owner,
    reporting: { rawMetadata: structuredClone(metadata) },
    reviewAfter: metadata.review_after ?? null,
    relations: structuredClone(metadata.relations ?? []),
    schemaVersion: metadata.schema_version,
    scope: metadata.scope ?? null,
    source: { bytes, path },
    status: metadata.status,
    subjects: [...(metadata.subjects ?? [])],
    supersedes: [...(metadata.supersedes ?? [])],
    tags: [...(metadata.tags ?? [])],
    title: metadata.title,
    version: metadata.version,
    visibility: metadata.visibility,
  };
}

function normalizeDiscoveryDiagnostic(diagnostic: DiscoveryDiagnostic): CollectionDiagnostic {
  return {
    code: diagnostic.code,
    location: null,
    message: diagnostic.message,
    path: diagnostic.path,
    phase: 'discovery',
    severity: 'error',
  };
}

function normalizeParserDiagnostic(diagnostic: ParserDiagnostic): CollectionDiagnostic {
  return {
    code: diagnostic.code,
    location: diagnostic.location,
    message: diagnostic.message,
    path: diagnostic.path,
    phase: 'parse',
    severity: 'error',
  };
}

function validateMaxFileBytes(maxFileBytes: number): void {
  if (!Number.isSafeInteger(maxFileBytes) || maxFileBytes <= 0) {
    throw new RangeError('maxFileBytes must be a positive safe integer');
  }
}

function validateMaxTotalBytes(maxTotalBytes: number): void {
  if (
    !Number.isSafeInteger(maxTotalBytes) ||
    maxTotalBytes <= 0 ||
    maxTotalBytes > HARD_MAX_TOTAL_BYTES
  ) {
    throw new RangeError(
      `maxTotalBytes must be a positive safe integer no greater than ${HARD_MAX_TOTAL_BYTES}`,
    );
  }
}

type BoundedReadResult =
  | { bytes: Buffer; bytesRead: number; exceeded: false }
  | { bytes: null; bytesRead: number; exceeded: true };

async function readBoundedFile(path: string, maxBytes: number): Promise<BoundedReadResult> {
  const handle = await open(path, 'r');
  const chunks: Buffer[] = [];
  let totalBytes = 0;
  const targetBytes = maxBytes + 1;

  try {
    while (totalBytes < targetBytes) {
      const buffer = Buffer.allocUnsafe(Math.min(64 * 1024, targetBytes - totalBytes));
      const { bytesRead } = await handle.read(buffer, 0, buffer.byteLength, null);
      if (bytesRead === 0) break;
      chunks.push(buffer.subarray(0, bytesRead));
      totalBytes += bytesRead;
    }
  } finally {
    await handle.close();
  }

  return totalBytes > maxBytes
    ? { bytes: null, bytesRead: totalBytes, exceeded: true }
    : { bytes: Buffer.concat(chunks, totalBytes), bytesRead: totalBytes, exceeded: false };
}

function compareDiagnostics(left: CollectionDiagnostic, right: CollectionDiagnostic): number {
  return (
    compareStable(left.path, right.path) ||
    (left.location?.line ?? 0) - (right.location?.line ?? 0) ||
    (left.location?.column ?? 0) - (right.location?.column ?? 0) ||
    compareStable(left.code, right.code)
  );
}

function compareStable(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}
