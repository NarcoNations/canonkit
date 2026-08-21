import { scanRepository, type DocumentCollection } from '../model/collection.js';
import { buildTrustGraphIndex } from '../graph/index.js';
import { validateDocumentPolicies } from '../policy/documents.js';
import { validateRelationshipPolicies } from '../policy/relationships.js';
import type { PackBuildResult, PackPolicyOptions } from '../pack/contract.js';
import { buildContextPack } from '../pack/projection.js';
import { CANONKIT_VERSION } from '../version.js';
import { CliUsageError, parseCliArguments } from './arguments.js';
import { buildValidationReport, renderJsonReport, renderTerminalReport } from './output.js';
import {
  buildCommandFailureReport,
  buildGraphCommandReport,
  buildListCommandReport,
  renderCommandFailureTerminal,
  renderCommandJson,
  renderGraphTerminal,
  renderListTerminal,
} from './graph-output.js';
import {
  buildResolveCommandReport,
  renderResolveJson,
  renderResolveTerminal,
} from './resolve-output.js';
import { renderPackCommandResult } from './pack-output.js';

export const CLI_EXIT_CODES = Object.freeze({
  success: 0,
  documentFailure: 1,
  packFailure: 1,
  resolutionFailure: 1,
  usageError: 2,
  unexpectedError: 3,
});

export const CLI_HELP = `CanonKit — deterministic governance for repository Markdown

Usage:
  canonkit validate [path] [--format terminal|json] [--quiet]
  canonkit list [path] [--format terminal|json] [--allow-visibility <value>] [--scope <scope>] [--limit <n>]
  canonkit graph [path] [--format terminal|json] [--allow-visibility <value>] [--scope <scope>] [--limit <n>]
  canonkit resolve <query> [path] [--format terminal|json] [--allow-visibility <value>] [--scope <scope>] [--limit <n>]
  canonkit pack [path] [--format markdown|json] [--audience <value>] [--include-status <value>] [--scope <scope>] [--max-documents <n>] [--max-content-bytes <n>]
  canonkit --help
  canonkit --version

Options:
      --allow-visibility  Include a visibility (repeatable; default: public)
      --audience <value>  Pack disclosure ceiling: public, internal, or restricted
  -f, --format <format>  Output format (command-specific; pack defaults to markdown)
  -h, --help             Show this help
      --include-status <value>  Include a non-active pack status (repeatable)
  -l, --limit <n>        Maximum returned nodes or candidates (1–1000; default: 100)
      --max-content-bytes <n>   Maximum pack Markdown-body bytes (default: 262144)
      --max-documents <n>       Maximum pack documents (default: 25)
  -q, --quiet            Suppress completely clean validation output
  -s, --scope <scope>    Require an exact lower-case document scope
  -v, --version          Show the package version

Exit codes:
  0  Command completed without errors
  1  Validation, resolution, or pack construction failed
  2  Command usage error
  3  Unexpected internal error
`;

export interface CliIo {
  stderr(value: string): void;
  stdout(value: string): void;
}

export interface CliDependencies {
  buildContextPack?(
    collection: DocumentCollection,
    options?: PackPolicyOptions,
  ): Promise<PackBuildResult>;
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
    if (command.kind === 'pack') {
      const packResult = await (dependencies.buildContextPack ?? buildContextPack)(collection, {
        audience: command.audience,
        includeNonActiveStatuses: command.includeNonActiveStatuses,
        maxContentBytes: command.maxContentBytes,
        maxDocuments: command.maxDocuments,
        ...(command.scope === undefined ? {} : { scope: command.scope }),
      });
      const rendered = renderPackCommandResult(packResult, command.format);
      io.stdout(rendered.output);
      return rendered.ok ? CLI_EXIT_CODES.success : CLI_EXIT_CODES.packFailure;
    }

    const documentPolicy = validateDocumentPolicies(collection.documents);
    const relationshipPolicy = validateRelationshipPolicies(collection.documents);
    const validationReport = buildValidationReport(
      collection,
      documentPolicy,
      relationshipPolicy,
    );
    if (command.kind === 'validate') {
      if (!command.quiet || validationReport.diagnostics.length > 0) {
        io.stdout(
          command.format === 'json'
            ? renderJsonReport(validationReport)
            : renderTerminalReport(validationReport),
        );
      }
      return validationReport.ok
        ? CLI_EXIT_CODES.success
        : CLI_EXIT_CODES.documentFailure;
    }

    if (!validationReport.ok) {
      const failure = buildCommandFailureReport(
        command.kind,
        collection.repositoryRoot,
        validationReport.summary.errors,
        validationReport.summary.warnings,
      );
      io.stdout(
        command.format === 'json'
          ? renderCommandJson(failure)
          : renderCommandFailureTerminal(failure),
      );
      return CLI_EXIT_CODES.documentFailure;
    }

    const graph = buildTrustGraphIndex(collection.documents, {
      allowedVisibilities: command.allowedVisibilities,
      ...(command.scope === undefined ? {} : { scope: command.scope }),
    });
    const options = {
      limit: command.limit,
      repositoryRoot: collection.repositoryRoot,
      validationWarnings: validationReport.diagnostics,
    };
    if (command.kind === 'list') {
      const report = buildListCommandReport(graph, options);
      io.stdout(command.format === 'json' ? renderCommandJson(report) : renderListTerminal(report));
      return CLI_EXIT_CODES.success;
    }
    if (command.kind === 'graph') {
      const report = buildGraphCommandReport(graph, options);
      io.stdout(command.format === 'json' ? renderCommandJson(report) : renderGraphTerminal(report));
      return CLI_EXIT_CODES.success;
    }
    if (command.kind !== 'resolve') throw new Error('Unsupported parsed command.');
    const report = buildResolveCommandReport(graph, command.query, options);
    io.stdout(command.format === 'json' ? renderResolveJson(report) : renderResolveTerminal(report));
    return report.ok ? CLI_EXIT_CODES.success : CLI_EXIT_CODES.resolutionFailure;
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
