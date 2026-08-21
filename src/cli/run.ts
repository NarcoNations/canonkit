import { scanRepository, type DocumentCollection } from '../model/collection.js';
import { validateDocumentPolicies } from '../policy/documents.js';
import { CANONKIT_VERSION } from '../version.js';
import { CliUsageError, parseCliArguments } from './arguments.js';
import { renderJsonReport, renderTerminalReport } from './output.js';

export const CLI_EXIT_CODES = Object.freeze({
  success: 0,
  documentFailure: 1,
  usageError: 2,
  unexpectedError: 3,
});

export const CLI_HELP = `CanonKit — deterministic governance for repository Markdown

Usage:
  canonkit validate [path] [--format terminal|json]
  canonkit --help
  canonkit --version

Options:
  -f, --format <format>  Output format (terminal or json; default: terminal)
  -h, --help             Show this help
  -v, --version          Show the package version

Exit codes:
  0  Scan completed without document errors
  1  Scan completed with document or discovery errors
  2  Command usage error
  3  Unexpected internal error
`;

export interface CliIo {
  stderr(value: string): void;
  stdout(value: string): void;
}

export interface CliDependencies {
  scanRepository(path: string): Promise<DocumentCollection>;
}

const defaultDependencies: CliDependencies = { scanRepository };

export async function runCli(
  args: readonly string[],
  io: CliIo,
  dependencies: CliDependencies = defaultDependencies,
): Promise<number> {
  try {
    const command = parseCliArguments(args);
    if (command.kind === 'help') {
      io.stdout(CLI_HELP);
      return CLI_EXIT_CODES.success;
    }
    if (command.kind === 'version') {
      io.stdout(`${CANONKIT_VERSION}\n`);
      return CLI_EXIT_CODES.success;
    }

    const collection = await dependencies.scanRepository(command.path);
    const policy = validateDocumentPolicies(collection.documents);
    io.stdout(
      command.format === 'json'
        ? renderJsonReport(collection, policy)
        : renderTerminalReport(collection, policy),
    );
    return collection.ok && policy.ok
      ? CLI_EXIT_CODES.success
      : CLI_EXIT_CODES.documentFailure;
  } catch (error) {
    if (error instanceof CliUsageError) {
      io.stderr(`CanonKit usage error: ${error.message}\nRun canonkit --help for usage.\n`);
      return CLI_EXIT_CODES.usageError;
    }

    const message = error instanceof Error ? error.message : 'Unknown error.';
    io.stderr(`CanonKit unexpected error: ${message}\n`);
    return CLI_EXIT_CODES.unexpectedError;
  }
}
