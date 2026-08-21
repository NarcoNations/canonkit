import type { DocumentCollection, NormalizedDocument } from '../model/collection.js';
import type { DocumentPolicyResult } from '../policy/documents.js';
import type { RelationshipPolicyResult } from '../policy/relationships.js';

export const CLI_REPORT_FORMAT_VERSION = '2.0' as const;

export interface CliReportDiagnostic {
  code: string;
  location: { column: number; line: number } | null;
  message: string;
  path: string;
  phase: 'discovery' | 'read' | 'parse' | 'document-policy' | 'relationship-policy';
  relatedPaths: string[];
  remediation: string;
  severity: 'error' | 'warning';
}

export interface CliValidationReport {
  cliReportFormatVersion: typeof CLI_REPORT_FORMAT_VERSION;
  command: 'validate';
  contracts: {
    collection: DocumentCollection['collectionFormatVersion'];
    documentPolicy: DocumentPolicyResult['policyFormatVersion'];
    relationshipPolicy: RelationshipPolicyResult['policyFormatVersion'];
  };
  diagnostics: CliReportDiagnostic[];
  documents: Array<{
    aliases: string[];
    authority: NormalizedDocument['authority'];
    id: string;
    kind: NormalizedDocument['kind'];
    owner: string;
    path: string;
    status: NormalizedDocument['status'];
    subjects: string[];
    title: string;
    version: string;
    visibility: NormalizedDocument['visibility'];
  }>;
  ok: boolean;
  repositoryRoot: string | null;
  scanRoots: string[];
  summary: {
    discoveredFiles: number;
    errors: number;
    invalidDocuments: number;
    validDocuments: number;
    warnings: number;
  };
}

export function buildValidationReport(
  collection: DocumentCollection,
  documentPolicy: DocumentPolicyResult,
  relationshipPolicy: RelationshipPolicyResult,
): CliValidationReport {
  const diagnostics: CliReportDiagnostic[] = [
    ...collection.diagnostics.map((diagnostic): CliReportDiagnostic => ({
      ...diagnostic,
      relatedPaths: [],
      remediation: collectionRemediation(diagnostic.phase),
    })),
    ...documentPolicy.diagnostics.map((diagnostic): CliReportDiagnostic => ({
      ...diagnostic,
      location: null,
      phase: 'document-policy',
    })),
    ...relationshipPolicy.diagnostics.map((diagnostic): CliReportDiagnostic => ({
      ...diagnostic,
      location: null,
      phase: 'relationship-policy',
    })),
  ].sort(compareDiagnostics);

  const errors = diagnostics.filter(({ severity }) => severity === 'error').length;
  const warnings = diagnostics.length - errors;
  return {
    cliReportFormatVersion: CLI_REPORT_FORMAT_VERSION,
    command: 'validate',
    contracts: {
      collection: collection.collectionFormatVersion,
      documentPolicy: documentPolicy.policyFormatVersion,
      relationshipPolicy: relationshipPolicy.policyFormatVersion,
    },
    diagnostics,
    documents: collection.documents.map((document) => ({
      aliases: document.aliases,
      authority: document.authority,
      id: document.id,
      kind: document.kind,
      owner: document.owner,
      path: document.source.path,
      status: document.status,
      subjects: document.subjects,
      title: document.title,
      version: document.version,
      visibility: document.visibility,
    })),
    ok: errors === 0,
    repositoryRoot: collection.repositoryRoot,
    scanRoots: collection.scanRoots,
    summary: {
      discoveredFiles: collection.summary.discoveredFiles,
      errors,
      invalidDocuments: collection.summary.invalidDocuments,
      validDocuments: collection.summary.validDocuments,
      warnings,
    },
  };
}

export function renderTerminalReport(report: CliValidationReport): string {
  const lines = [
    `CanonKit validate — ${report.ok ? 'VALID' : 'INVALID'}`,
    `Repository: ${report.repositoryRoot ?? 'unresolved'}`,
    `Documents: ${report.summary.validDocuments} valid, ${report.summary.invalidDocuments} invalid, ${report.summary.discoveredFiles} discovered`,
    `Diagnostics: ${report.summary.errors} errors, ${report.summary.warnings} warnings`,
  ];

  if (report.diagnostics.length > 0) {
    lines.push('', 'Diagnostics:');
    for (const diagnostic of report.diagnostics) {
      const location = diagnostic.location
        ? `:${diagnostic.location.line}:${diagnostic.location.column}`
        : '';
      lines.push(
        `- ${diagnostic.severity.toUpperCase()} [${diagnostic.phase}] ${diagnostic.code} ${diagnostic.path}${location} — ${diagnostic.message}`,
      );
      if (diagnostic.relatedPaths.length > 0) {
        lines.push(`  Related: ${diagnostic.relatedPaths.join(', ')}`);
      }
      lines.push(`  Fix: ${diagnostic.remediation}`);
    }
  }

  return `${lines.join('\n')}\n`;
}

export function renderJsonReport(report: CliValidationReport): string {
  return `${JSON.stringify(report, null, 2)}\n`;
}

function collectionRemediation(phase: 'discovery' | 'read' | 'parse'): string {
  if (phase === 'discovery') {
    return 'Correct the repository path, boundary, exclusions, or document-count configuration.';
  }
  if (phase === 'read') {
    return 'Make the document readable inside the repository boundary and rerun validation.';
  }
  return 'Correct the Markdown frontmatter or metadata contract error and rerun validation.';
}

function compareDiagnostics(left: CliReportDiagnostic, right: CliReportDiagnostic): number {
  return (
    compareStable(left.path, right.path) ||
    (left.location?.line ?? 0) - (right.location?.line ?? 0) ||
    (left.location?.column ?? 0) - (right.location?.column ?? 0) ||
    compareStable(left.code, right.code) ||
    compareStable(left.message, right.message)
  );
}

function compareStable(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}
