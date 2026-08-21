import type { DocumentCollection } from '../model/collection.js';

export const CLI_REPORT_FORMAT_VERSION = '1.0' as const;

export function renderTerminalReport(collection: DocumentCollection): string {
  const lines = [
    'CanonKit validate',
    `Repository: ${collection.repositoryRoot ?? 'unresolved'}`,
    `Documents: ${collection.summary.validDocuments} valid, ${collection.summary.invalidDocuments} invalid, ${collection.summary.discoveredFiles} discovered`,
    `Errors: ${collection.summary.errors}`,
    `Result: ${collection.ok ? 'valid' : 'invalid'}`,
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

  return `${lines.join('\n')}\n`;
}

export function renderJsonReport(collection: DocumentCollection): string {
  return `${JSON.stringify(
    {
      cliReportFormatVersion: CLI_REPORT_FORMAT_VERSION,
      collectionFormatVersion: collection.collectionFormatVersion,
      command: 'validate',
      diagnostics: collection.diagnostics,
      documents: collection.documents.map((document) => ({
        authority: document.authority,
        id: document.id,
        owner: document.owner,
        path: document.source.path,
        status: document.status,
        title: document.title,
        version: document.version,
        visibility: document.visibility,
      })),
      ok: collection.ok,
      repositoryRoot: collection.repositoryRoot,
      scanRoots: collection.scanRoots,
      summary: collection.summary,
    },
    null,
    2,
  )}\n`;
}
