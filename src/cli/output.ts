import type { DocumentCollection } from '../model/collection.js';
import type { DocumentPolicyResult } from '../policy/documents.js';

export const CLI_REPORT_FORMAT_VERSION = '1.1' as const;

export function renderTerminalReport(
  collection: DocumentCollection,
  policy: DocumentPolicyResult,
): string {
  const ok = collection.ok && policy.ok;
  const lines = [
    'CanonKit validate',
    `Repository: ${collection.repositoryRoot ?? 'unresolved'}`,
    `Documents: ${collection.summary.validDocuments} valid, ${collection.summary.invalidDocuments} invalid, ${collection.summary.discoveredFiles} discovered`,
    `Errors: ${collection.summary.errors + policy.summary.errors}`,
    `Warnings: ${policy.summary.warnings}`,
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

  if (policy.diagnostics.length > 0) {
    lines.push('', 'Policy diagnostics:');
    for (const diagnostic of policy.diagnostics) {
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
  policy: DocumentPolicyResult,
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
      ok: collection.ok && policy.ok,
      policyDiagnostics: policy.diagnostics,
      policyFormatVersion: policy.policyFormatVersion,
      policySummary: policy.summary,
      repositoryRoot: collection.repositoryRoot,
      scanRoots: collection.scanRoots,
      summary: collection.summary,
    },
    null,
    2,
  )}\n`;
}
