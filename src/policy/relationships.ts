import type { NormalizedDocument } from '../model/collection.js';

export const RELATIONSHIP_POLICY_FORMAT_VERSION = '1.0' as const;

export type RelationshipPolicyDiagnosticCode =
  | 'CKR001_SUPERSESSION_TARGET_MISSING'
  | 'CKR002_SELF_SUPERSESSION'
  | 'CKR003_SUPERSESSION_CYCLE'
  | 'CKR004_SUPERSEDED_TARGET_ACTIVE'
  | 'CKR005_SUPERSEDED_DOCUMENT_UNREFERENCED'
  | 'CKR006_MULTIPLE_CURRENT_VERSIONS';

export interface RelationshipPolicyDiagnostic {
  code: RelationshipPolicyDiagnosticCode;
  message: string;
  path: string;
  relatedPaths: string[];
  remediation: string;
  severity: 'error';
}

export interface RelationshipPolicyResult {
  diagnostics: RelationshipPolicyDiagnostic[];
  ok: boolean;
  policyFormatVersion: typeof RELATIONSHIP_POLICY_FORMAT_VERSION;
  summary: {
    errors: number;
    warnings: 0;
  };
}

export function validateRelationshipPolicies(
  documents: readonly NormalizedDocument[],
): RelationshipPolicyResult {
  const diagnostics: RelationshipPolicyDiagnostic[] = [];
  const byIdentity = groupDocuments(documents, ({ id }) => id);
  const byVersion = groupDocuments(documents, ({ id, version }) => `${id}@${version}`);
  const byPath = new Map(documents.map((document) => [document.source.path, document]));
  const edges = new Map(documents.map((document) => [document.source.path, new Set<string>()]));
  const incoming = new Map<string, Set<string>>();

  for (const document of documents) {
    for (const reference of document.supersedes) {
      if (isSelfReference(document, reference)) {
        diagnostics.push({
          code: 'CKR002_SELF_SUPERSESSION',
          message: `Document cannot supersede itself through ${reference}.`,
          path: document.source.path,
          relatedPaths: [],
          remediation:
            reference === document.id
              ? `Reference the earlier version explicitly, for example ${document.id}@<version>.`
              : 'Remove the self-reference or point it to the earlier document version.',
          severity: 'error',
        });
        continue;
      }

      const targets = reference.includes('@') ? byVersion.get(reference) : byIdentity.get(reference);
      if (targets === undefined || targets.length === 0) {
        diagnostics.push({
          code: 'CKR001_SUPERSESSION_TARGET_MISSING',
          message: `Supersession target ${reference} is not present in the scanned collection.`,
          path: document.source.path,
          relatedPaths: [],
          remediation: 'Add the referenced document or correct the supersedes identity and version.',
          severity: 'error',
        });
        continue;
      }

      for (const target of targets) {
        edges.get(document.source.path)?.add(target.source.path);
        appendPath(incoming, target.source.path, document.source.path);
      }
    }
  }

  checkLifecycle(documents, incoming, diagnostics);
  checkMultipleCurrentVersions(byIdentity, diagnostics);
  checkCycles(edges, byPath, diagnostics);

  const sorted = diagnostics.sort(compareDiagnostics);
  return {
    diagnostics: sorted,
    ok: sorted.length === 0,
    policyFormatVersion: RELATIONSHIP_POLICY_FORMAT_VERSION,
    summary: { errors: sorted.length, warnings: 0 },
  };
}

function checkLifecycle(
  documents: readonly NormalizedDocument[],
  incoming: ReadonlyMap<string, Set<string>>,
  diagnostics: RelationshipPolicyDiagnostic[],
): void {
  for (const document of documents) {
    const sources = [...(incoming.get(document.source.path) ?? [])].sort(compareStable);
    if (document.status === 'active' && sources.length > 0) {
      diagnostics.push({
        code: 'CKR004_SUPERSEDED_TARGET_ACTIVE',
        message: 'A document targeted by supersedes cannot remain active.',
        path: document.source.path,
        relatedPaths: sources,
        remediation: 'Mark the replaced document superseded or remove the incorrect supersedes edge.',
        severity: 'error',
      });
    }
    if (document.status === 'superseded' && sources.length === 0) {
      diagnostics.push({
        code: 'CKR005_SUPERSEDED_DOCUMENT_UNREFERENCED',
        message: 'A superseded document must be replaced by another document in the collection.',
        path: document.source.path,
        relatedPaths: [],
        remediation: 'Add the replacing document and its supersedes edge, or correct this lifecycle status.',
        severity: 'error',
      });
    }
  }
}

function checkMultipleCurrentVersions(
  byIdentity: ReadonlyMap<string, NormalizedDocument[]>,
  diagnostics: RelationshipPolicyDiagnostic[],
): void {
  for (const [identity, documents] of byIdentity) {
    const current = documents.filter(({ status }) => status === 'active');
    if (current.length < 2) continue;
    const paths = current.map(({ source }) => source.path).sort(compareStable);
    for (const document of current) {
      diagnostics.push({
        code: 'CKR006_MULTIPLE_CURRENT_VERSIONS',
        message: `Document identity ${identity} has more than one active version.`,
        path: document.source.path,
        relatedPaths: paths.filter((path) => path !== document.source.path),
        remediation: 'Keep one active version and move replaced versions to superseded status.',
        severity: 'error',
      });
    }
  }
}

function checkCycles(
  edges: ReadonlyMap<string, Set<string>>,
  byPath: ReadonlyMap<string, NormalizedDocument>,
  diagnostics: RelationshipPolicyDiagnostic[],
): void {
  for (const component of stronglyConnectedComponents(edges)) {
    if (component.length < 2) continue;
    const paths = component.sort(compareStable);
    const identities = paths
      .map((path) => byPath.get(path))
      .filter((document): document is NormalizedDocument => document !== undefined)
      .map(({ id, version }) => `${id}@${version}`)
      .sort(compareStable);
    for (const path of paths) {
      diagnostics.push({
        code: 'CKR003_SUPERSESSION_CYCLE',
        message: `Supersession cycle includes ${identities.join(', ')}.`,
        path,
        relatedPaths: paths.filter((relatedPath) => relatedPath !== path),
        remediation: 'Remove or redirect an edge so supersession flows only toward earlier documents.',
        severity: 'error',
      });
    }
  }
}

function stronglyConnectedComponents(
  edges: ReadonlyMap<string, Set<string>>,
): string[][] {
  let nextIndex = 0;
  const indices = new Map<string, number>();
  const lowLinks = new Map<string, number>();
  const stack: string[] = [];
  const onStack = new Set<string>();
  const components: string[][] = [];

  const visit = (path: string): void => {
    const index = nextIndex++;
    indices.set(path, index);
    lowLinks.set(path, index);
    stack.push(path);
    onStack.add(path);

    for (const target of [...(edges.get(path) ?? [])].sort(compareStable)) {
      if (!indices.has(target)) {
        visit(target);
        lowLinks.set(path, Math.min(lowLinks.get(path)!, lowLinks.get(target)!));
      } else if (onStack.has(target)) {
        lowLinks.set(path, Math.min(lowLinks.get(path)!, indices.get(target)!));
      }
    }

    if (lowLinks.get(path) !== indices.get(path)) return;
    const component: string[] = [];
    let member: string;
    do {
      member = stack.pop()!;
      onStack.delete(member);
      component.push(member);
    } while (member !== path);
    components.push(component);
  };

  for (const path of [...edges.keys()].sort(compareStable)) {
    if (!indices.has(path)) visit(path);
  }
  return components;
}

function isSelfReference(document: NormalizedDocument, reference: string): boolean {
  return reference === document.id || reference === `${document.id}@${document.version}`;
}

function groupDocuments(
  documents: readonly NormalizedDocument[],
  keyFor: (document: NormalizedDocument) => string,
): Map<string, NormalizedDocument[]> {
  const groups = new Map<string, NormalizedDocument[]>();
  for (const document of documents) {
    const key = keyFor(document);
    const group = groups.get(key);
    if (group === undefined) groups.set(key, [document]);
    else group.push(document);
  }
  return groups;
}

function appendPath(groups: Map<string, Set<string>>, key: string, path: string): void {
  const group = groups.get(key);
  if (group === undefined) groups.set(key, new Set([path]));
  else group.add(path);
}

function compareDiagnostics(
  left: RelationshipPolicyDiagnostic,
  right: RelationshipPolicyDiagnostic,
): number {
  return (
    compareStable(left.path, right.path) ||
    compareStable(left.code, right.code) ||
    compareStable(left.message, right.message)
  );
}

function compareStable(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}
