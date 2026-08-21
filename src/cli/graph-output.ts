import type { TrustGraphIndex, TrustGraphNode } from '../graph/index.js';
import type { CliReportDiagnostic } from './output.js';

export const GRAPH_COMMAND_REPORT_FORMAT_VERSION = '1.0' as const;
export const MAX_GRAPH_EDGES = 1000;

export interface CommandProjectionOptions {
  limit: number;
  repositoryRoot: string | null;
  validationWarnings: readonly CliReportDiagnostic[];
}

export interface ListCommandReport {
  command: 'list';
  commandReportFormatVersion: typeof GRAPH_COMMAND_REPORT_FORMAT_VERSION;
  diagnostics: CliReportDiagnostic[];
  eligibilityPolicy: TrustGraphIndex['eligibilityPolicy'];
  graphFormatVersion: TrustGraphIndex['formatVersion'];
  items: TrustGraphNode[];
  ok: true;
  repositoryRoot: string | null;
  summary: {
    returnedNodes: number;
    totalEligibleNodes: number;
    truncated: boolean;
    warnings: number;
  };
}

export interface GraphCommandReport {
  command: 'graph';
  commandReportFormatVersion: typeof GRAPH_COMMAND_REPORT_FORMAT_VERSION;
  diagnostics: CliReportDiagnostic[];
  eligibilityPolicy: TrustGraphIndex['eligibilityPolicy'];
  graphFormatVersion: TrustGraphIndex['formatVersion'];
  identityIndex: TrustGraphIndex['identityIndex'];
  nodes: TrustGraphNode[];
  ok: true;
  relations: TrustGraphIndex['relations'];
  repositoryRoot: string | null;
  subjectIndex: TrustGraphIndex['subjectIndex'];
  summary: {
    returnedEdges: number;
    returnedNodes: number;
    totalEdges: number;
    totalVisibleNodes: number;
    truncated: boolean;
    warnings: number;
  };
  supersessionEdges: TrustGraphIndex['supersessionEdges'];
  versionIndex: TrustGraphIndex['versionIndex'];
}

export interface CommandFailureReport {
  command: 'graph' | 'list' | 'resolve';
  commandReportFormatVersion: typeof GRAPH_COMMAND_REPORT_FORMAT_VERSION;
  error: {
    code: 'CKC001_VALIDATION_REQUIRED';
    message: string;
    remediation: string;
  };
  ok: false;
  repositoryRoot: string | null;
  summary: { errors: number; warnings: number };
}

export function buildListCommandReport(
  graph: TrustGraphIndex,
  options: CommandProjectionOptions,
): ListCommandReport {
  const visiblePaths = projectionAllowedNodePaths(graph);
  const eligible = graph.nodes.filter(({ eligibility }) => eligibility.eligible);
  const items = eligible.slice(0, options.limit);
  const diagnostics = filterProjectionWarnings(options.validationWarnings, visiblePaths);
  return {
    command: 'list',
    commandReportFormatVersion: GRAPH_COMMAND_REPORT_FORMAT_VERSION,
    diagnostics,
    eligibilityPolicy: graph.eligibilityPolicy,
    graphFormatVersion: graph.formatVersion,
    items,
    ok: true,
    repositoryRoot: options.repositoryRoot,
    summary: {
      returnedNodes: items.length,
      totalEligibleNodes: eligible.length,
      truncated: items.length < eligible.length,
      warnings: diagnostics.length,
    },
  };
}

export function buildGraphCommandReport(
  graph: TrustGraphIndex,
  options: CommandProjectionOptions,
): GraphCommandReport {
  const visiblePaths = projectionAllowedNodePaths(graph);
  const visibleNodes = graph.nodes.filter(({ nodeId }) => visiblePaths.has(nodeId));
  const nodes = visibleNodes.slice(0, options.limit);
  const returnedPaths = new Set(nodes.map(({ nodeId }) => nodeId));
  const allSupersessionEdges = graph.supersessionEdges.filter(
    ({ from, to }) => visiblePaths.has(from) && visiblePaths.has(to),
  );
  const allRelations = graph.relations.filter(({ declaredBy }) => visiblePaths.has(declaredBy));
  const eligibleSupersessionEdges = allSupersessionEdges.filter(
    ({ from, to }) => returnedPaths.has(from) && returnedPaths.has(to),
  );
  const eligibleRelations = allRelations.filter(({ declaredBy }) => returnedPaths.has(declaredBy));
  const supersessionEdges = eligibleSupersessionEdges.slice(0, MAX_GRAPH_EDGES);
  const remaining = MAX_GRAPH_EDGES - supersessionEdges.length;
  const relations = eligibleRelations.slice(0, remaining);
  const returnedEdges = supersessionEdges.length + relations.length;
  const totalEdges = allSupersessionEdges.length + allRelations.length;
  const diagnostics = filterProjectionWarnings(options.validationWarnings, visiblePaths);

  return {
    command: 'graph',
    commandReportFormatVersion: GRAPH_COMMAND_REPORT_FORMAT_VERSION,
    diagnostics,
    eligibilityPolicy: graph.eligibilityPolicy,
    graphFormatVersion: graph.formatVersion,
    identityIndex: filterGroupedIndex(graph.identityIndex, returnedPaths),
    nodes,
    ok: true,
    relations,
    repositoryRoot: options.repositoryRoot,
    subjectIndex: filterGroupedIndex(graph.subjectIndex, returnedPaths),
    summary: {
      returnedEdges,
      returnedNodes: nodes.length,
      totalEdges,
      totalVisibleNodes: visibleNodes.length,
      truncated: nodes.length < visibleNodes.length || returnedEdges < totalEdges,
      warnings: diagnostics.length,
    },
    supersessionEdges,
    versionIndex: graph.versionIndex.filter(({ node }) => returnedPaths.has(node)),
  };
}

export function buildCommandFailureReport(
  command: CommandFailureReport['command'],
  repositoryRoot: string | null,
  errors: number,
  warnings: number,
): CommandFailureReport {
  return {
    command,
    commandReportFormatVersion: GRAPH_COMMAND_REPORT_FORMAT_VERSION,
    error: {
      code: 'CKC001_VALIDATION_REQUIRED',
      message: `Cannot build ${command} output because repository validation found ${errors} errors.`,
      remediation: 'Run canonkit validate on the same path, correct every error, and retry.',
    },
    ok: false,
    repositoryRoot,
    summary: { errors, warnings },
  };
}

export function renderListTerminal(report: ListCommandReport): string {
  const lines = [
    'CanonKit list',
    `Repository: ${report.repositoryRoot ?? 'unresolved'}`,
    `Eligible documents: ${report.summary.returnedNodes} of ${report.summary.totalEligibleNodes}${report.summary.truncated ? ' (truncated)' : ''}`,
  ];
  for (const node of report.items) {
    lines.push(
      `- ${node.id}@${node.version} [${node.authority}, ${node.visibility}] ${node.nodeId}`,
    );
  }
  appendWarnings(lines, report.diagnostics);
  return `${lines.join('\n')}\n`;
}

export function renderGraphTerminal(report: GraphCommandReport): string {
  const lines = [
    'CanonKit graph',
    `Repository: ${report.repositoryRoot ?? 'unresolved'}`,
    `Nodes: ${report.summary.returnedNodes} of ${report.summary.totalVisibleNodes}`,
    `Edges: ${report.summary.returnedEdges} of ${report.summary.totalEdges}${report.summary.truncated ? ' (truncated)' : ''}`,
    '',
    'Nodes:',
  ];
  for (const node of report.nodes) {
    lines.push(
      `- ${node.nodeId} — ${node.id}@${node.version} [${node.eligibility.eligible ? 'eligible' : 'excluded'}]`,
    );
  }
  if (report.supersessionEdges.length > 0 || report.relations.length > 0) {
    lines.push('', 'Edges:');
    for (const edge of report.supersessionEdges) {
      lines.push(`- ${edge.from} --supersedes--> ${edge.to}`);
    }
    for (const edge of report.relations) {
      lines.push(
        `- ${edge.sources.join(', ') || '(no subject)'} --${edge.type}--> ${edge.target} [${edge.declaredBy}]`,
      );
    }
  }
  appendWarnings(lines, report.diagnostics);
  return `${lines.join('\n')}\n`;
}

export function renderCommandFailureTerminal(report: CommandFailureReport): string {
  return `CanonKit ${report.command} — BLOCKED\n${report.error.message}\nFix: ${report.error.remediation}\n`;
}

export function renderCommandJson(
  report: ListCommandReport | GraphCommandReport | CommandFailureReport,
): string {
  return `${JSON.stringify(report, null, 2)}\n`;
}

export function projectionAllowedNodePaths(graph: TrustGraphIndex): Set<string> {
  return new Set(
    graph.nodes
      .filter(
        ({ eligibility }) =>
          !eligibility.exclusions.some(
            ({ code }) =>
              code === 'CKG003_VISIBILITY_NOT_ALLOWED' || code === 'CKG004_SCOPE_NOT_ALLOWED',
          ),
      )
      .map(({ nodeId }) => nodeId),
  );
}

export function filterProjectionWarnings(
  warnings: readonly CliReportDiagnostic[],
  allowedPaths: ReadonlySet<string>,
): CliReportDiagnostic[] {
  return warnings.filter(({ path, severity }) => severity === 'warning' && allowedPaths.has(path));
}

function filterGroupedIndex<T extends { nodes: string[] }>(
  entries: readonly T[],
  allowedPaths: ReadonlySet<string>,
): T[] {
  return entries.flatMap((entry) => {
    const nodes = entry.nodes.filter((node) => allowedPaths.has(node));
    return nodes.length === 0 ? [] : [{ ...entry, nodes }];
  });
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
