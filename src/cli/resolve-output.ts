import type { TrustGraphIndex } from '../graph/index.js';
import {
  resolveTrustGraph,
  type ResolutionCandidate,
  type ResolutionResult,
} from '../resolution/index.js';
import {
  filterProjectionWarnings,
  GRAPH_COMMAND_REPORT_FORMAT_VERSION,
  projectionAllowedNodePaths,
  type CommandProjectionOptions,
} from './graph-output.js';
import type { CliReportDiagnostic } from './output.js';

export interface ResolveCommandReport {
  command: 'resolve';
  commandReportFormatVersion: typeof GRAPH_COMMAND_REPORT_FORMAT_VERSION;
  diagnostics: CliReportDiagnostic[];
  eligibilityPolicy: TrustGraphIndex['eligibilityPolicy'];
  graphFormatVersion: TrustGraphIndex['formatVersion'];
  ok: boolean;
  repositoryRoot: string | null;
  resolution: Omit<ResolutionResult, 'candidates' | 'summary'> & {
    candidates: ResolutionCandidate[];
    summary: ResolutionResult['summary'] & {
      returnedCandidates: number;
      truncated: boolean;
      warnings: number;
    };
  };
}

export function buildResolveCommandReport(
  graph: TrustGraphIndex,
  query: string,
  options: CommandProjectionOptions,
): ResolveCommandReport {
  const allowedPaths = projectionAllowedNodePaths(graph);
  const safeGraph = {
    ...graph,
    nodes: graph.nodes.filter(({ nodeId }) => allowedPaths.has(nodeId)),
  };
  const result = resolveTrustGraph(safeGraph, query);
  const candidates = result.candidates.slice(0, options.limit);
  const diagnostics = filterProjectionWarnings(options.validationWarnings, allowedPaths);

  return {
    command: 'resolve',
    commandReportFormatVersion: GRAPH_COMMAND_REPORT_FORMAT_VERSION,
    diagnostics,
    eligibilityPolicy: graph.eligibilityPolicy,
    graphFormatVersion: graph.formatVersion,
    ok: result.status === 'resolved',
    repositoryRoot: options.repositoryRoot,
    resolution: {
      ...result,
      candidates,
      summary: {
        ...result.summary,
        returnedCandidates: candidates.length,
        truncated: candidates.length < result.candidates.length,
        warnings: diagnostics.length,
      },
    },
  };
}

export function renderResolveTerminal(report: ResolveCommandReport): string {
  const { resolution } = report;
  const lines = [
    `CanonKit resolve — ${resolution.status.replace('_', ' ').toUpperCase()}`,
    `Repository: ${report.repositoryRoot ?? 'unresolved'}`,
    `Query: ${JSON.stringify(resolution.query.value)}`,
    `Result: ${resolution.explanation.message}`,
  ];
  if (resolution.selected !== null) {
    const selected = resolution.selected;
    lines.push(
      `Selected: ${selected.id}@${selected.version} [${selected.kind ?? 'legacy'}, ${selected.authority}, ${selected.visibility}] ${selected.nodeId}`,
    );
  }
  lines.push(
    `Candidates: ${resolution.summary.returnedCandidates} of ${resolution.summary.matchedCandidates}${resolution.summary.truncated ? ' (truncated)' : ''}`,
  );
  for (const candidate of resolution.candidates) {
    lines.push(
      `- ${candidate.disposition.toUpperCase()} ${candidate.node.id}@${candidate.node.version} [${candidate.matches.join(', ')}] ${candidate.node.nodeId}`,
    );
    for (const reason of candidate.reasons) {
      lines.push(`  ${reason.code}: ${reason.message}`);
    }
  }
  appendWarnings(lines, report.diagnostics);
  return `${lines.join('\n')}\n`;
}

export function renderResolveJson(report: ResolveCommandReport): string {
  return `${JSON.stringify(report, null, 2)}\n`;
}

function appendWarnings(lines: string[], diagnostics: readonly CliReportDiagnostic[]): void {
  if (diagnostics.length === 0) return;
  lines.push('', 'Warnings:');
  for (const diagnostic of diagnostics) {
    lines.push(
      `- ${diagnostic.code} ${diagnostic.path} — ${diagnostic.message}`,
      `  Fix: ${diagnostic.remediation}`,
    );
  }
}
