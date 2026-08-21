import { parseArgs } from 'node:util';

import type { DocumentVisibility } from '../metadata/frontmatter.js';
import {
  DEFAULT_PACK_MAX_CONTENT_BYTES,
  DEFAULT_PACK_MAX_DOCUMENTS,
  HARD_PACK_MAX_CONTENT_BYTES,
  HARD_PACK_MAX_DOCUMENTS,
  PACK_AUDIENCES,
  PACK_NON_ACTIVE_STATUSES,
  type PackAudience,
  type PackNonActiveStatus,
} from '../pack/contract.js';

export const CLI_FORMATS = ['terminal', 'json'] as const;
export const PACK_CLI_FORMATS = ['markdown', 'json'] as const;
export const DEFAULT_COMMAND_LIMIT = 100;
export const MAX_COMMAND_LIMIT = 1000;
export type CliFormat = (typeof CLI_FORMATS)[number];
export type PackCliFormat = (typeof PACK_CLI_FORMATS)[number];

export type CliCommand =
  | { kind: 'help' }
  | { kind: 'version' }
  | { format: CliFormat; kind: 'validate'; path: string; quiet: boolean }
  | {
      allowedVisibilities: DocumentVisibility[];
      format: CliFormat;
      kind: 'graph' | 'list';
      limit: number;
      path: string;
      scope?: string;
    }
  | {
      allowedVisibilities: DocumentVisibility[];
      format: CliFormat;
      kind: 'resolve';
      limit: number;
      path: string;
      query: string;
      scope?: string;
    }
  | {
      audience: PackAudience;
      format: PackCliFormat;
      includeNonActiveStatuses: PackNonActiveStatus[];
      kind: 'pack';
      maxContentBytes: number;
      maxDocuments: number;
      path: string;
      scope?: string;
    };

export class CliUsageError extends Error {
  override readonly name = 'CliUsageError';
}

const cliOptions = {
  'allow-visibility': { multiple: true, type: 'string' },
  audience: { type: 'string' },
  format: { short: 'f', type: 'string' },
  help: { short: 'h', type: 'boolean' },
  'include-status': { multiple: true, type: 'string' },
  limit: { short: 'l', type: 'string' },
  'max-content-bytes': { type: 'string' },
  'max-documents': { type: 'string' },
  quiet: { short: 'q', type: 'boolean' },
  scope: { short: 's', type: 'string' },
  version: { short: 'v', type: 'boolean' },
} as const;

export function parseCliArguments(args: readonly string[]): CliCommand {
  let parsed: ReturnType<typeof parseArgs>;
  try {
    parsed = parseArgs({
      allowPositionals: true,
      args: [...args],
      options: cliOptions,
      strict: true,
    });
  } catch (error) {
    throw new CliUsageError(error instanceof Error ? error.message : 'Invalid arguments.');
  }

  if (parsed.values['help'] === true) return { kind: 'help' };
  if (parsed.values['version'] === true) return { kind: 'version' };

  const [command, ...positionals] = parsed.positionals;
  if (command === undefined) throw new CliUsageError('A command is required.');
  if (
    command !== 'validate' &&
    command !== 'list' &&
    command !== 'graph' &&
    command !== 'resolve' &&
    command !== 'pack'
  ) {
    throw new CliUsageError(`Unknown command: ${command}`);
  }

  const requestedFormat = parsed.values['format'];

  if (command === 'pack') {
    const [path, ...extraPositionals] = positionals;
    if (extraPositionals.length > 0) {
      throw new CliUsageError('The pack command accepts at most one path.');
    }
    if (
      parsed.values['allow-visibility'] !== undefined ||
      parsed.values['limit'] !== undefined ||
      parsed.values['quiet'] === true
    ) {
      throw new CliUsageError(
        'Visibility, limit, and quiet options do not apply to pack; use audience and pack budgets.',
      );
    }
    return {
      audience: parseAudience(parsed.values['audience']),
      format: parsePackFormat(requestedFormat),
      includeNonActiveStatuses: parseNonActiveStatuses(parsed.values['include-status']),
      kind: 'pack',
      maxContentBytes: parsePackBudget(
        parsed.values['max-content-bytes'],
        DEFAULT_PACK_MAX_CONTENT_BYTES,
        HARD_PACK_MAX_CONTENT_BYTES,
        'max-content-bytes',
      ),
      maxDocuments: parsePackBudget(
        parsed.values['max-documents'],
        DEFAULT_PACK_MAX_DOCUMENTS,
        HARD_PACK_MAX_DOCUMENTS,
        'max-documents',
      ),
      path: path ?? '.',
      ...(parsed.values['scope'] === undefined
        ? {}
        : { scope: parseScope(parsed.values['scope']) }),
    };
  }

  rejectPackOnlyOptions(parsed.values);
  const format = parseCliFormat(requestedFormat);

  if (command === 'validate') {
    const [path, ...extraPositionals] = positionals;
    if (extraPositionals.length > 0) {
      throw new CliUsageError('The validate command accepts at most one path.');
    }
    if (
      parsed.values['allow-visibility'] !== undefined ||
      parsed.values['limit'] !== undefined ||
      parsed.values['scope'] !== undefined
    ) {
      throw new CliUsageError(
        'Visibility, scope, and limit options apply only to list, graph, and resolve.',
      );
    }
    return {
      format,
      kind: 'validate',
      path: path ?? '.',
      quiet: parsed.values['quiet'] === true,
    };
  }

  if (parsed.values['quiet'] === true) {
    throw new CliUsageError('Quiet mode applies only to validate.');
  }
  const [first, second, ...extraPositionals] = positionals;
  if (command === 'resolve') {
    if (first === undefined) throw new CliUsageError('The resolve command requires a query.');
    if (extraPositionals.length > 0) {
      throw new CliUsageError('The resolve command accepts one query and at most one path.');
    }
    return {
      allowedVisibilities: parseVisibilities(parsed.values['allow-visibility']),
      format,
      kind: 'resolve',
      limit: parseLimit(parsed.values['limit']),
      path: second ?? '.',
      query: parseQuery(first),
      ...(parsed.values['scope'] === undefined
        ? {}
        : { scope: parseScope(parsed.values['scope']) }),
    };
  }
  if (second !== undefined) {
    throw new CliUsageError(`The ${command} command accepts at most one path.`);
  }
  return {
    allowedVisibilities: parseVisibilities(parsed.values['allow-visibility']),
    format,
    kind: command,
    limit: parseLimit(parsed.values['limit']),
    path: first ?? '.',
    ...(parsed.values['scope'] === undefined
      ? {}
      : { scope: parseScope(parsed.values['scope']) }),
  };
}

function parseVisibilities(value: unknown): DocumentVisibility[] {
  if (value === undefined) return ['public'];
  const values = Array.isArray(value) ? value : [value];
  const allowed = new Set<DocumentVisibility>(['public', 'internal', 'restricted']);
  const visibilities: DocumentVisibility[] = [];
  for (const candidate of values) {
    if (typeof candidate !== 'string' || !allowed.has(candidate as DocumentVisibility)) {
      throw new CliUsageError(
        `Unsupported visibility: ${String(candidate)}. Use public, internal, or restricted.`,
      );
    }
    visibilities.push(candidate as DocumentVisibility);
  }
  return [...new Set(visibilities)].sort(compareStable);
}

function parseAudience(value: unknown): PackAudience {
  const audience = value ?? 'public';
  if (typeof audience !== 'string' || !isPackAudience(audience)) {
    throw new CliUsageError(
      `Unsupported audience: ${String(audience)}. Use public, internal, or restricted.`,
    );
  }
  return audience;
}

function parseNonActiveStatuses(value: unknown): PackNonActiveStatus[] {
  if (value === undefined) return [];
  const values = Array.isArray(value) ? value : [value];
  const statuses: PackNonActiveStatus[] = [];
  for (const status of values) {
    if (typeof status !== 'string' || !isPackNonActiveStatus(status)) {
      throw new CliUsageError(
        `Unsupported pack status: ${String(status)}. Use draft, review, superseded, or archived.`,
      );
    }
    statuses.push(status);
  }
  return [...new Set(statuses)].sort(compareStable);
}

function parsePackBudget(
  value: unknown,
  defaultValue: number,
  hardMaximum: number,
  option: string,
): number {
  if (value === undefined) return defaultValue;
  if (typeof value !== 'string' || !/^\d+$/.test(value)) {
    throw new CliUsageError(`${option} must be a positive integer.`);
  }
  const budget = Number(value);
  if (!Number.isSafeInteger(budget) || budget < 1 || budget > hardMaximum) {
    throw new CliUsageError(`${option} must be between 1 and ${hardMaximum}.`);
  }
  return budget;
}

function parseLimit(value: unknown): number {
  if (value === undefined) return DEFAULT_COMMAND_LIMIT;
  if (typeof value !== 'string' || !/^\d+$/.test(value)) {
    throw new CliUsageError('Limit must be a positive integer.');
  }
  const limit = Number(value);
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > MAX_COMMAND_LIMIT) {
    throw new CliUsageError(`Limit must be between 1 and ${MAX_COMMAND_LIMIT}.`);
  }
  return limit;
}

function parseScope(value: unknown): string {
  if (typeof value !== 'string' || !/^[a-z0-9]+(?:[._/-][a-z0-9]+)*$/.test(value)) {
    throw new CliUsageError('Scope must be a stable lower-case identity.');
  }
  return value;
}

function parseQuery(value: string): string {
  const normalized = value.trim().replace(/\s+/g, ' ');
  if (normalized.length === 0) throw new CliUsageError('Resolution query must not be empty.');
  if (normalized.length > 160) {
    throw new CliUsageError('Resolution query must not exceed 160 characters.');
  }
  return value;
}

function parseCliFormat(value: unknown): CliFormat {
  const format = value ?? 'terminal';
  if (typeof format !== 'string' || !isCliFormat(format)) {
    throw new CliUsageError(`Unsupported format: ${String(format)}. Use terminal or json.`);
  }
  return format;
}

function parsePackFormat(value: unknown): PackCliFormat {
  const format = value ?? 'markdown';
  if (typeof format !== 'string' || !isPackCliFormat(format)) {
    throw new CliUsageError(`Unsupported pack format: ${String(format)}. Use markdown or json.`);
  }
  return format;
}

function rejectPackOnlyOptions(values: Record<string, unknown>): void {
  if (
    values['audience'] !== undefined ||
    values['include-status'] !== undefined ||
    values['max-content-bytes'] !== undefined ||
    values['max-documents'] !== undefined
  ) {
    throw new CliUsageError(
      'Audience, include-status, and pack budget options apply only to pack.',
    );
  }
}

function isCliFormat(value: string): value is CliFormat {
  return CLI_FORMATS.some((format) => format === value);
}

function isPackCliFormat(value: string): value is PackCliFormat {
  return PACK_CLI_FORMATS.some((format) => format === value);
}

function isPackAudience(value: string): value is PackAudience {
  return PACK_AUDIENCES.some((audience) => audience === value);
}

function isPackNonActiveStatus(value: string): value is PackNonActiveStatus {
  return PACK_NON_ACTIVE_STATUSES.some((status) => status === value);
}

function compareStable(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}
