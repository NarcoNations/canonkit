import { parseArgs } from 'node:util';

import type { DocumentVisibility } from '../metadata/frontmatter.js';

export const CLI_FORMATS = ['terminal', 'json'] as const;
export const DEFAULT_COMMAND_LIMIT = 100;
export const MAX_COMMAND_LIMIT = 1000;
export type CliFormat = (typeof CLI_FORMATS)[number];

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
    };

export class CliUsageError extends Error {
  override readonly name = 'CliUsageError';
}

const cliOptions = {
  'allow-visibility': { multiple: true, type: 'string' },
  format: { short: 'f', type: 'string' },
  help: { short: 'h', type: 'boolean' },
  limit: { short: 'l', type: 'string' },
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
    command !== 'resolve'
  ) {
    throw new CliUsageError(`Unknown command: ${command}`);
  }

  const format = parsed.values['format'] ?? 'terminal';
  if (typeof format !== 'string' || !isCliFormat(format)) {
    throw new CliUsageError(`Unsupported format: ${format}. Use terminal or json.`);
  }

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

function isCliFormat(value: string): value is CliFormat {
  return CLI_FORMATS.some((format) => format === value);
}

function compareStable(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}
