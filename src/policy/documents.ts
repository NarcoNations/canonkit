import type { NormalizedDocument } from '../model/collection.js';

export const DOCUMENT_POLICY_FORMAT_VERSION = '1.0' as const;

export type DocumentPolicyDiagnosticCode =
  | 'CKV001_DUPLICATE_DOCUMENT_VERSION'
  | 'CKV002_ACTIVE_OWNER_MISSING'
  | 'CKV003_REVIEW_OVERDUE'
  | 'CKV004_ACTIVE_SCOPE_MISSING'
  | 'CKV005_COMPETING_ACTIVE_AUTHORITY'
  | 'CKV006_VISIBILITY_CONFLICT';

export interface DocumentPolicyDiagnostic {
  code: DocumentPolicyDiagnosticCode;
  message: string;
  path: string;
  relatedPaths: string[];
  remediation: string;
  severity: 'error' | 'warning';
}

export interface DocumentPolicyResult {
  diagnostics: DocumentPolicyDiagnostic[];
  ok: boolean;
  policyFormatVersion: typeof DOCUMENT_POLICY_FORMAT_VERSION;
  summary: {
    errors: number;
    warnings: number;
  };
}

export interface DocumentPolicyOptions {
  today?: string;
}

export function validateDocumentPolicies(
  documents: readonly NormalizedDocument[],
  options: DocumentPolicyOptions = {},
): DocumentPolicyResult {
  const today = options.today ?? new Date().toISOString().slice(0, 10);
  if (!isIsoDate(today)) throw new TypeError('today must be an ISO 8601 calendar date');

  const diagnostics: DocumentPolicyDiagnostic[] = [];
  checkDuplicateVersions(documents, diagnostics);

  for (const document of documents) {
    if (!isActiveGoverning(document)) continue;
    if (document.owner.trim().length === 0) {
      diagnostics.push({
        code: 'CKV002_ACTIVE_OWNER_MISSING',
        message: 'Active governing documents require a non-blank owner.',
        path: document.source.path,
        relatedPaths: [],
        remediation: 'Set owner to the accountable person, role, or team.',
        severity: 'error',
      });
    }
    if (document.scope === null) {
      diagnostics.push({
        code: 'CKV004_ACTIVE_SCOPE_MISSING',
        message: 'Active governing documents require an explicit scope.',
        path: document.source.path,
        relatedPaths: [],
        remediation: 'Set scope to the bounded area in which this document may govern.',
        severity: 'error',
      });
    }
    if (document.reviewAfter !== null && document.reviewAfter < today) {
      diagnostics.push({
        code: 'CKV003_REVIEW_OVERDUE',
        message: `Document review was due after ${document.reviewAfter}.`,
        path: document.source.path,
        relatedPaths: [],
        remediation: 'Review the document and move review_after to the next approved review date.',
        severity: 'warning',
      });
    }
  }

  checkSubjectAuthority(documents, diagnostics);

  const sorted = diagnostics.sort(compareDiagnostics);
  const errors = sorted.filter(({ severity }) => severity === 'error').length;
  const warnings = sorted.length - errors;
  return {
    diagnostics: sorted,
    ok: errors === 0,
    policyFormatVersion: DOCUMENT_POLICY_FORMAT_VERSION,
    summary: { errors, warnings },
  };
}

function checkDuplicateVersions(
  documents: readonly NormalizedDocument[],
  diagnostics: DocumentPolicyDiagnostic[],
): void {
  const groups = groupDocuments(documents, (document) => `${document.id}@${document.version}`);
  for (const group of groups.values()) {
    if (group.length < 2) continue;
    const paths = group.map(({ source }) => source.path).sort(compareStable);
    for (const document of group) {
      diagnostics.push({
        code: 'CKV001_DUPLICATE_DOCUMENT_VERSION',
        message: `Document identity ${document.id}@${document.version} is declared more than once.`,
        path: document.source.path,
        relatedPaths: paths.filter((path) => path !== document.source.path),
        remediation: 'Keep one file for this document version or assign a distinct stable identity.',
        severity: 'error',
      });
    }
  }
}

function checkSubjectAuthority(
  documents: readonly NormalizedDocument[],
  diagnostics: DocumentPolicyDiagnostic[],
): void {
  const canonicalBySubject = new Map<string, NormalizedDocument[]>();
  const governingBySubject = new Map<string, NormalizedDocument[]>();

  for (const document of documents) {
    if (document.status !== 'active') continue;
    for (const subject of document.subjects) {
      if (document.authority === 'canonical' && document.kind === 'canon') {
        append(canonicalBySubject, subject, document);
      }
      if (document.kind === 'canon' && isActiveGoverning(document)) {
        append(governingBySubject, subject, document);
      }
    }
  }

  for (const [subject, group] of canonicalBySubject) {
    if (new Set(group.map(({ id }) => id)).size < 2) continue;
    addGroupDiagnostics(
      diagnostics,
      group,
      'CKV005_COMPETING_ACTIVE_AUTHORITY',
      `Subject ${subject} has more than one active canonical document.`,
      'Supersede, narrow, or demote competing documents until one canonical document governs the subject.',
    );
  }

  for (const [subject, group] of governingBySubject) {
    if (new Set(group.map(({ visibility }) => visibility)).size < 2) continue;
    addGroupDiagnostics(
      diagnostics,
      group,
      'CKV006_VISIBILITY_CONFLICT',
      `Subject ${subject} has active governing documents with conflicting visibility.`,
      'Align visibility or split the subject into explicitly bounded governance scopes.',
    );
  }
}

function addGroupDiagnostics(
  diagnostics: DocumentPolicyDiagnostic[],
  group: readonly NormalizedDocument[],
  code: 'CKV005_COMPETING_ACTIVE_AUTHORITY' | 'CKV006_VISIBILITY_CONFLICT',
  message: string,
  remediation: string,
): void {
  const paths = [...new Set(group.map(({ source }) => source.path))].sort(compareStable);
  for (const document of group) {
    diagnostics.push({
      code,
      message,
      path: document.source.path,
      relatedPaths: paths.filter((path) => path !== document.source.path),
      remediation,
      severity: 'error',
    });
  }
}

function isActiveGoverning(document: NormalizedDocument): boolean {
  return (
    document.status === 'active' &&
    (document.authority === 'canonical' || document.authority === 'approved')
  );
}

function groupDocuments(
  documents: readonly NormalizedDocument[],
  keyFor: (document: NormalizedDocument) => string,
): Map<string, NormalizedDocument[]> {
  const groups = new Map<string, NormalizedDocument[]>();
  for (const document of documents) append(groups, keyFor(document), document);
  return groups;
}

function append(
  groups: Map<string, NormalizedDocument[]>,
  key: string,
  document: NormalizedDocument,
): void {
  const group = groups.get(key);
  if (group === undefined) groups.set(key, [document]);
  else group.push(document);
}

function compareDiagnostics(
  left: DocumentPolicyDiagnostic,
  right: DocumentPolicyDiagnostic,
): number {
  return compareStable(left.path, right.path) || compareStable(left.code, right.code);
}

function compareStable(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
