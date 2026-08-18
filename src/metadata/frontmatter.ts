import { readFileSync } from 'node:fs';

import { Ajv2020, type AnySchema, type ErrorObject } from 'ajv/dist/2020.js';
import { isNode, LineCounter, parseDocument } from 'yaml';

export const DEFAULT_MAX_FILE_BYTES = 1024 * 1024;
export const SUPPORTED_SCHEMA_VERSION = '1.0' as const;

export type DocumentStatus = 'draft' | 'review' | 'active' | 'superseded' | 'archived';
export type DocumentAuthority =
  | 'canonical'
  | 'approved'
  | 'reference'
  | 'derived'
  | 'unverified';
export type DocumentVisibility = 'public' | 'internal' | 'restricted';

export interface CanonKitMetadata {
  schema_version: typeof SUPPORTED_SCHEMA_VERSION;
  id: string;
  title: string;
  status: DocumentStatus;
  authority: DocumentAuthority;
  owner: string;
  version: string;
  visibility: DocumentVisibility;
  scope?: string;
  supersedes?: string[];
  review_after?: string;
  tags?: string[];
}

export interface SourceLocation {
  column: number;
  line: number;
}

export type ParserDiagnosticCode =
  | 'CKP001_FILE_TOO_LARGE'
  | 'CKP002_FRONTMATTER_MISSING'
  | 'CKP003_FRONTMATTER_UNCLOSED'
  | 'CKP004_FRONTMATTER_MULTIPLE'
  | 'CKP005_YAML_INVALID'
  | 'CKP006_METADATA_NOT_OBJECT'
  | 'CKP007_SCHEMA_VERSION_UNSUPPORTED'
  | 'CKP008_METADATA_INVALID';

export interface ParserDiagnostic {
  code: ParserDiagnosticCode;
  location: SourceLocation;
  message: string;
  path: string;
}

export interface ParsedMarkdownDocument {
  body: string;
  frontmatter: {
    endLine: number;
    startLine: number;
  };
  metadata: CanonKitMetadata;
  path: string;
}

export interface ParseFrontmatterOptions {
  maxFileBytes?: number;
  path?: string;
}

export type ParseFrontmatterResult =
  | { document: ParsedMarkdownDocument; ok: true }
  | { diagnostics: ParserDiagnostic[]; ok: false };

const schema = JSON.parse(
  readFileSync(new URL('../../schema/canonkit-document.schema.json', import.meta.url), 'utf8'),
) as AnySchema;
const ajv = new Ajv2020({ allErrors: true, strict: true });
ajv.addFormat('date', { type: 'string', validate: isIsoDate });
const validateMetadata = ajv.compile<CanonKitMetadata>(schema);

export function parseMarkdownFrontmatter(
  markdown: string,
  options: ParseFrontmatterOptions = {},
): ParseFrontmatterResult {
  const path = options.path ?? '<input>';
  const maxFileBytes = options.maxFileBytes ?? DEFAULT_MAX_FILE_BYTES;

  if (!Number.isSafeInteger(maxFileBytes) || maxFileBytes <= 0) {
    throw new RangeError('maxFileBytes must be a positive safe integer');
  }

  if (Buffer.byteLength(markdown, 'utf8') > maxFileBytes) {
    return failure('CKP001_FILE_TOO_LARGE', `Document exceeds the ${maxFileBytes}-byte limit.`, path);
  }

  const source = markdown.charCodeAt(0) === 0xfeff ? markdown.slice(1) : markdown;
  const envelope = readEnvelope(source);

  if (envelope.kind === 'missing') {
    return failure('CKP002_FRONTMATTER_MISSING', 'Document must start with YAML frontmatter.', path);
  }
  if (envelope.kind === 'unclosed') {
    return failure(
      'CKP003_FRONTMATTER_UNCLOSED',
      'Frontmatter is missing its closing delimiter.',
      path,
    );
  }
  const secondFrontmatterLine = findSecondFrontmatterLine(envelope.body);
  if (secondFrontmatterLine !== undefined) {
    return failure(
      'CKP004_FRONTMATTER_MULTIPLE',
      'Document contains more than one leading frontmatter block.',
      path,
      { line: envelope.bodyStartLine + secondFrontmatterLine - 1, column: 1 },
    );
  }

  const lineCounter = new LineCounter();
  const yamlDocument = parseDocument(envelope.yaml, {
    lineCounter,
    merge: false,
    prettyErrors: false,
    strict: true,
    uniqueKeys: true,
  });

  if (yamlDocument.errors.length > 0) {
    return {
      ok: false,
      diagnostics: yamlDocument.errors.map((error) => ({
        code: 'CKP005_YAML_INVALID',
        location: yamlLocation(error.linePos?.[0]),
        message: error.message,
        path,
      })),
    };
  }

  let metadata: unknown;
  try {
    metadata = yamlDocument.toJS({ maxAliasCount: 0 });
  } catch (error) {
    return failure(
      'CKP005_YAML_INVALID',
      error instanceof Error ? error.message : 'Frontmatter contains unsupported YAML.',
      path,
    );
  }

  if (!isRecord(metadata)) {
    return failure(
      'CKP006_METADATA_NOT_OBJECT',
      'Frontmatter must contain a metadata object.',
      path,
    );
  }

  if (
    Object.hasOwn(metadata, 'schema_version') &&
    metadata['schema_version'] !== SUPPORTED_SCHEMA_VERSION
  ) {
    return failure(
      'CKP007_SCHEMA_VERSION_UNSUPPORTED',
      `Unsupported schema_version; expected ${SUPPORTED_SCHEMA_VERSION}.`,
      path,
      locationForKey(yamlDocument, lineCounter, 'schema_version'),
    );
  }

  if (!validateMetadata(metadata)) {
    return {
      ok: false,
      diagnostics: (validateMetadata.errors ?? []).map((error) => ({
        code: 'CKP008_METADATA_INVALID',
        location: locationForSchemaError(yamlDocument, lineCounter, error),
        message: schemaErrorMessage(error),
        path,
      })),
    };
  }

  return {
    ok: true,
    document: {
      body: envelope.body,
      frontmatter: { startLine: 2, endLine: envelope.closingLine - 1 },
      metadata: metadata as unknown as CanonKitMetadata,
      path,
    },
  };
}

type Envelope =
  | { kind: 'missing' }
  | { kind: 'unclosed' }
  | {
      body: string;
      bodyStartLine: number;
      closingLine: number;
      kind: 'valid';
      yaml: string;
    };

function readEnvelope(markdown: string): Envelope {
  const opening = /^---(?:\r?\n|$)/.exec(markdown);
  if (opening === null) return { kind: 'missing' };

  const contentStart = opening[0].length;
  const closingPattern = /^---[\t ]*(?:\r?$)/gm;
  closingPattern.lastIndex = contentStart;
  const closing = closingPattern.exec(markdown);
  if (closing === null) return { kind: 'unclosed' };

  const closingLine = countLines(markdown.slice(0, closing.index)) + 1;
  const closingEnd = consumeLineEnding(markdown, closing.index + closing[0].length);

  return {
    body: markdown.slice(closingEnd),
    bodyStartLine: closingLine + 1,
    closingLine,
    kind: 'valid',
    yaml: markdown.slice(contentStart, closing.index),
  };
}

function consumeLineEnding(source: string, index: number): number {
  if (source.startsWith('\r\n', index)) return index + 2;
  if (source[index] === '\n') return index + 1;
  return index;
}

function findSecondFrontmatterLine(body: string): number | undefined {
  const blankPrefix = /^(?:[\t ]*\r?\n)*/.exec(body)?.[0] ?? '';
  const withoutBlankLines = body.slice(blankPrefix.length);
  const opening = /^---\r?\n/.exec(withoutBlankLines);
  if (opening === null) return undefined;
  const closingPattern = /^---[\t ]*(?:\r?$)/gm;
  closingPattern.lastIndex = opening[0].length;
  const closing = closingPattern.exec(withoutBlankLines);
  if (closing === null) return undefined;
  const possibleMetadata = withoutBlankLines.slice(opening[0].length, closing.index);
  return /^[\t ]*schema_version[\t ]*:/m.test(possibleMetadata)
    ? countLines(blankPrefix) + 1
    : undefined;
}

function locationForSchemaError(
  document: ReturnType<typeof parseDocument>,
  lineCounter: LineCounter,
  error: ErrorObject,
): SourceLocation {
  const key = decodePointerSegment(error.instancePath.split('/')[1]);
  return key === undefined ? { line: 2, column: 1 } : locationForKey(document, lineCounter, key);
}

function locationForKey(
  document: ReturnType<typeof parseDocument>,
  lineCounter: LineCounter,
  key: string,
): SourceLocation {
  const node = document.get(key, true);
  if (!isNode(node) || node.range == null) return { line: 2, column: 1 };
  return yamlLocation(lineCounter.linePos(node.range[0]));
}

function yamlLocation(location: { col: number; line: number } | undefined): SourceLocation {
  return location === undefined
    ? { line: 2, column: 1 }
    : { line: location.line + 1, column: location.col };
}

function decodePointerSegment(segment: string | undefined): string | undefined {
  return segment?.replaceAll('~1', '/').replaceAll('~0', '~');
}

function schemaErrorMessage(error: ErrorObject): string {
  if (error.keyword === 'required') {
    return `Missing required field ${String(error.params['missingProperty'])}.`;
  }
  const field = error.instancePath || 'metadata';
  return `${field} ${error.message ?? 'is invalid'}.`;
}

function failure(
  code: ParserDiagnosticCode,
  message: string,
  path: string,
  location: SourceLocation = { line: 1, column: 1 },
): ParseFrontmatterResult {
  return { ok: false, diagnostics: [{ code, location, message, path }] };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function countLines(value: string): number {
  return (value.match(/\n/g) ?? []).length;
}

function isIsoDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (match === null) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year === 0 || month < 1 || month > 12) return false;
  const daysByMonth = [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return day >= 1 && day <= (daysByMonth[month - 1] ?? 0);
}

function isLeapYear(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}
