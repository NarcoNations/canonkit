import type { DocumentCollection } from '../model/collection.js';
import type { DocumentPolicyResult } from '../policy/documents.js';
import type { RelationshipPolicyResult } from '../policy/relationships.js';

export const CLI_REPORT_FORMAT_VERSION = '1.2' as const;

export function renderTerminalReport(
  collection: DocumentCollection,
  documentPolicy: DocumentPolicyResult,
  relationshipPolicy: RelationshipPolicyResult,
): string {
  const ok = collection.ok && documentPolicy.ok && relationshipPolicy.ok;
  const lines = [
    'CanonKit validate',
    `Repository: ${collection.repositoryRoot ?? 'unresolved'}`,
    `Documents: ${collection.summary.validDocuments} valid, ${collection.summary.invalidDocuments} invalid, ${collection.summary.discoveredFiles} discovered`,
    `Errors: ${collection.summary.errors + documentPolicy.summary.errors + relationshipPolicy.summary.errors}`,
    `Warnings: ${documentPolicy.summary.warnings + relationshipPolicy.summary.warnings}`,
    `Result: ${ok ? 'valid' : 'invalid'}`,
  ];

  if (collection.diagnostics.length > 0) {
    lines.push('', 'Diagnostics:');
    for (const diagnostic of collection.diagnostics) {
      const location = diagnostic.location
        ? `:${diagnostic.location.line}:${diagnostic.location.column}`
        : '';
      lines.push(
        `- ${diagnostic.severity.toUpperCase()} ${diagnostic.code} ${diagnostic.path}${location} — ${diagnostic.message}`,
      );
    }
  }

  if (documentPolicy.diagnostics.length > 0) {
    lines.push('', 'Document policy diagnostics:');
    for (const diagnostic of documentPolicy.diagnostics) {
      lines.push(
        `- ${diagnostic.severity.toUpperCase()} ${diagnostic.code} ${diagnostic.path} — ${diagnostic.message}`,
        `  Fix: ${diagnostic.remediation}`,
      );
    }
  }

  if (relationshipPolicy.diagnostics.length > 0) {
    lines.push('', 'Relationship policy diagnostics:');
    for (const diagnostic of relationshipPolicy.diagnostics) {
      lines.push(
        `- ${diagnostic.severity.toUpperCase()} ${diagnostic.code} ${diagnostic.path} — ${diagnostic.message}`,
        `  Fix: ${diagnostic.remediation}`,
      );
    }
  }

  return `${lines.join('\n')}\n`;
}

export function renderJsonReport(
  collection: DocumentCollection,
  documentPolicy: DocumentPolicyResult,
  relationshipPolicy: RelationshipPolicyResult,
): string {
  return `${JSON.stringify(
    {
      cliReportFormatVersion: CLI_REPORT_FORMAT_VERSION,
      collectionFormatVersion: collection.collectionFormatVersion,
      command: 'validate',
      diagnostics: collection.diagnostics,
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
      ok: collection.ok && documentPolicy.ok && relationshipPolicy.ok,
      policyDiagnostics: documentPolicy.diagnostics,
      policyFormatVersion: documentPolicy.policyFormatVersion,
      policySummary: documentPolicy.summary,
      relationshipDiagnostics: relationshipPolicy.diagnostics,
      relationshipPolicyFormatVersion: relationshipPolicy.policyFormatVersion,
      relationshipSummary: relationshipPolicy.summary,
      repositoryRoot: collection.repositoryRoot,
      scanRoots: collection.scanRoots,
      summary: collection.summary,
    },
    null,
    2,
  )}\n`;
}
