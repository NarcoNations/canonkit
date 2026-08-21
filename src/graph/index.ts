import type {
  DocumentAuthority,
  DocumentRelationType,
  DocumentStatus,
  DocumentVisibility,
} from '../metadata/frontmatter.js';
import type { NormalizedDocument } from '../model/collection.js';

export const TRUST_GRAPH_FORMAT_VERSION = '1.0' as const;
export const GOVERNING_AUTHORITIES = ['canonical', 'approved'] as const;
export const DEFAULT_GRAPH_VISIBILITIES = ['public'] as const;

export type EligibilityExclusionCode =
  | 'CKG001_STATUS_NOT_ACTIVE'
  | 'CKG002_AUTHORITY_NOT_GOVERNING'
  | 'CKG003_VISIBILITY_NOT_ALLOWED'
  | 'CKG004_SCOPE_NOT_ALLOWED';

export interface EligibilityExclusion {
  code: EligibilityExclusionCode;
  message: string;
}

export interface GraphEligibilityOptions {
  allowedVisibilities?: readonly DocumentVisibility[];
  scope?: string;
}

export interface TrustGraphNode {
  aliases: string[];
  authority: DocumentAuthority;
  eligibility: {
    eligible: boolean;
    exclusions: EligibilityExclusion[];
  };
  id: string;
  kind: NormalizedDocument['kind'];
  nodeId: string;
  owner: string;
  scope: string | null;
  status: DocumentStatus;
  subjects: string[];
  title: string;
  version: string;
  visibility: DocumentVisibility;
}

export interface SupersessionEdge {
  from: string;
  reference: string;
  to: string;
  type: 'supersedes';
}

export interface ExplicitRelationEdge {
  declaredBy: string;
  sources: string[];
  target: string;
  type: DocumentRelationType;
}

export interface TrustGraphIndex {
  eligibilityPolicy: {
    allowedVisibilities: DocumentVisibility[];
    governingAuthorities: Array<(typeof GOVERNING_AUTHORITIES)[number]>;
    requiredStatus: 'active';
    scope: string | null;
  };
  formatVersion: typeof TRUST_GRAPH_FORMAT_VERSION;
  identityIndex: Array<{ id: string; nodes: string[] }>;
  nodes: TrustGraphNode[];
  relations: ExplicitRelationEdge[];
  subjectIndex: Array<{ nodes: string[]; subject: string }>;
  supersessionEdges: SupersessionEdge[];
  versionIndex: Array<{ id: string; node: string; version: string }>;
}

export class TrustGraphInputError extends Error {
  override readonly name = 'TrustGraphInputError';
}

export function buildTrustGraphIndex(
  documents: readonly NormalizedDocument[],
  options: GraphEligibilityOptions = {},
): TrustGraphIndex {
  const allowedVisibilities = normalizeVisibilities(options.allowedVisibilities);
  const requestedScope = normalizeScope(options.scope);
  const sortedDocuments = [...documents].sort(compareDocuments);
  assertUniqueDocuments(sortedDocuments);

  const byIdentity = groupDocuments(sortedDocuments, ({ id }) => id);
  const byVersion = groupDocuments(sortedDocuments, ({ id, version }) => versionKey(id, version));
  const identityIndex = [...byIdentity]
    .sort(([left], [right]) => compareStable(left, right))
    .map(([id, group]) => ({ id, nodes: paths(group) }));
  const versionIndex = sortedDocuments
    .map(({ id, source, version }) => ({ id, node: source.path, version }))
    .sort(compareVersions);

  const subjectGroups = new Map<string, Set<string>>();
  for (const document of sortedDocuments) {
    for (const subject of document.subjects) append(subjectGroups, subject, document.source.path);
  }
  const subjectIndex = [...subjectGroups]
    .sort(([left], [right]) => compareStable(left, right))
    .map(([subject, nodes]) => ({ nodes: [...nodes].sort(compareStable), subject }));

  const supersessionEdges: SupersessionEdge[] = [];
  const relations: ExplicitRelationEdge[] = [];
  for (const document of sortedDocuments) {
    for (const reference of document.supersedes) {
      const targets = resolveSupersession(reference, byIdentity, byVersion);
      if (targets.length === 0) {
        throw new TrustGraphInputError(
          `Cannot index unresolved supersession target ${reference} from ${document.source.path}.`,
        );
      }
      for (const target of targets) {
        supersessionEdges.push({
          from: document.source.path,
          reference,
          to: target.source.path,
          type: 'supersedes',
        });
      }
    }
    for (const relation of document.relations) {
      relations.push({
        declaredBy: document.source.path,
        sources: [...document.subjects].sort(compareStable),
        target: relation.target,
        type: relation.type,
      });
    }
  }

  return {
    eligibilityPolicy: {
      allowedVisibilities,
      governingAuthorities: [...GOVERNING_AUTHORITIES],
      requiredStatus: 'active',
      scope: requestedScope,
    },
    formatVersion: TRUST_GRAPH_FORMAT_VERSION,
    identityIndex,
    nodes: sortedDocuments.map((document) =>
      createNode(document, allowedVisibilities, requestedScope),
    ),
    relations: relations.sort(compareRelations),
    subjectIndex,
    supersessionEdges: supersessionEdges.sort(compareSupersessionEdges),
    versionIndex,
  };
}

function createNode(
  document: NormalizedDocument,
  allowedVisibilities: readonly DocumentVisibility[],
  requestedScope: string | null,
): TrustGraphNode {
  const exclusions: EligibilityExclusion[] = [];
  if (document.status !== 'active') {
    exclusions.push({
      code: 'CKG001_STATUS_NOT_ACTIVE',
      message: `Status ${document.status} is not eligible; expected active.`,
    });
  }
  if (!isGoverningAuthority(document.authority)) {
    exclusions.push({
      code: 'CKG002_AUTHORITY_NOT_GOVERNING',
      message: `Authority ${document.authority} is not governing; expected canonical or approved.`,
    });
  }
  if (!allowedVisibilities.includes(document.visibility)) {
    exclusions.push({
      code: 'CKG003_VISIBILITY_NOT_ALLOWED',
      message: `Visibility ${document.visibility} is not in the explicit allowed visibility set.`,
    });
  }
  if (requestedScope !== null && document.scope !== requestedScope) {
    exclusions.push({
      code: 'CKG004_SCOPE_NOT_ALLOWED',
      message: `Scope ${document.scope ?? 'unset'} does not exactly match ${requestedScope}.`,
    });
  }

  return {
    aliases: [...document.aliases],
    authority: document.authority,
    eligibility: { eligible: exclusions.length === 0, exclusions },
    id: document.id,
    kind: document.kind,
    nodeId: document.source.path,
    owner: document.owner,
    scope: document.scope,
    status: document.status,
    subjects: [...document.subjects],
    title: document.title,
    version: document.version,
    visibility: document.visibility,
  };
}

function resolveSupersession(
  reference: string,
  byIdentity: ReadonlyMap<string, NormalizedDocument[]>,
  byVersion: ReadonlyMap<string, NormalizedDocument[]>,
): NormalizedDocument[] {
  const separator = reference.indexOf('@');
  if (separator === -1) return byIdentity.get(reference) ?? [];
  return byVersion.get(versionKey(reference.slice(0, separator), reference.slice(separator + 1))) ?? [];
}

function assertUniqueDocuments(documents: readonly NormalizedDocument[]): void {
  const paths = new Set<string>();
  const versions = new Set<string>();
  for (const document of documents) {
    if (paths.has(document.source.path)) {
      throw new TrustGraphInputError(`Duplicate graph node path: ${document.source.path}.`);
    }
    paths.add(document.source.path);
    const key = versionKey(document.id, document.version);
    if (versions.has(key)) {
      throw new TrustGraphInputError(
        `Duplicate document identity and version: ${document.id}@${document.version}.`,
      );
    }
    versions.add(key);
  }
}

function normalizeVisibilities(
  visibilities: readonly DocumentVisibility[] | undefined,
): DocumentVisibility[] {
  const values = visibilities ?? DEFAULT_GRAPH_VISIBILITIES;
  const allowed = new Set<DocumentVisibility>(['public', 'internal', 'restricted']);
  for (const visibility of values) {
    if (!allowed.has(visibility)) {
      throw new TypeError(`Unsupported graph visibility: ${String(visibility)}.`);
    }
  }
  return [...new Set(values)].sort(compareStable);
}

function normalizeScope(scope: string | undefined): string | null {
  if (scope === undefined) return null;
  if (!/^[a-z0-9]+(?:[._/-][a-z0-9]+)*$/.test(scope)) {
    throw new TypeError('Graph eligibility scope must be a stable lower-case identity.');
  }
  return scope;
}

function isGoverningAuthority(
  authority: DocumentAuthority,
): authority is (typeof GOVERNING_AUTHORITIES)[number] {
  return GOVERNING_AUTHORITIES.some((candidate) => candidate === authority);
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

function append(groups: Map<string, Set<string>>, key: string, value: string): void {
  const group = groups.get(key);
  if (group === undefined) groups.set(key, new Set([value]));
  else group.add(value);
}

function paths(documents: readonly NormalizedDocument[]): string[] {
  return documents.map(({ source }) => source.path).sort(compareStable);
}

function versionKey(id: string, version: string): string {
  return JSON.stringify([id, version]);
}

function compareDocuments(left: NormalizedDocument, right: NormalizedDocument): number {
  return compareStable(left.source.path, right.source.path);
}

function compareVersions(
  left: { id: string; node: string; version: string },
  right: { id: string; node: string; version: string },
): number {
  return (
    compareStable(left.id, right.id) ||
    compareStable(left.version, right.version) ||
    compareStable(left.node, right.node)
  );
}

function compareRelations(left: ExplicitRelationEdge, right: ExplicitRelationEdge): number {
  return (
    compareStable(left.declaredBy, right.declaredBy) ||
    compareStable(left.type, right.type) ||
    compareStable(left.target, right.target)
  );
}

function compareSupersessionEdges(left: SupersessionEdge, right: SupersessionEdge): number {
  return (
    compareStable(left.from, right.from) ||
    compareStable(left.to, right.to) ||
    compareStable(left.reference, right.reference)
  );
}

function compareStable(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}
