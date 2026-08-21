import { parseArgs } from 'node:util';

export const CLI_FORMATS = ['terminal', 'json'] as const;
export type CliFormat = (typeof CLI_FORMATS)[number];

export type CliCommand =
  | { kind: 'help' }
  | { kind: 'version' }
  | { format: CliFormat; kind: 'validate'; path: string; quiet: boolean };

export class CliUsageError extends Error {
  override readonly name = 'CliUsageError';
}

const cliOptions = {
  format: { short: 'f', type: 'string' },
  help: { short: 'h', type: 'boolean' },
  quiet: { short: 'q', type: 'boolean' },
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

  const [command, path, ...extraPositionals] = parsed.positionals;
  if (command === undefined) {
    throw new CliUsageError('A command is required.');
  }
  if (command !== 'validate') {
    throw new CliUsageError(`Unknown command: ${command}`);
  }
  if (extraPositionals.length > 0) {
    throw new CliUsageError('The validate command accepts at most one path.');
  }

  const format = parsed.values['format'] ?? 'terminal';
  if (typeof format !== 'string' || !isCliFormat(format)) {
    throw new CliUsageError(`Unsupported format: ${format}. Use terminal or json.`);
  }

  return {
    format,
    kind: 'validate',
    path: path ?? '.',
    quiet: parsed.values['quiet'] === true,
  };
}

function isCliFormat(value: string): value is CliFormat {
  return CLI_FORMATS.some((format) => format === value);
}
