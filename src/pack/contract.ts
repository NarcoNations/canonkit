import type {
  DocumentAuthority,
  DocumentKind,
  DocumentRelation,
  DocumentStatus,
  DocumentVisibility,
  SchemaVersion,
} from '../metadata/frontmatter.js';

export const PACK_FORMAT_VERSION = '1.0' as const;
export const PACK_POLICY_FORMAT_VERSION = '1.0' as const;

export const PACK_AUDIENCES = Object.freeze(['public', 'internal', 'restricted'] as const);
export type PackAudience = (typeof PACK_AUDIENCES)[number];

export const PACK_GOVERNING_AUTHORITIES = Object.freeze([
  'canonical',
  'approved',
] as const satisfies readonly DocumentAuthority[]);

export const PACK_NON_ACTIVE_STATUSES = Object.freeze([
  'draft',
  'review',
  'superseded',
  'archived',
] as const satisfies readonly DocumentStatus[]);
export type PackNonActiveStatus = (typeof PACK_NON_ACTIVE_STATUSES)[number];

export const DEFAULT_PACK_MAX_DOCUMENTS = 25;
export const HARD_PACK_MAX_DOCUMENTS = 100;
export const DEFAULT_PACK_MAX_CONTENT_BYTES = 256 * 1024;
export const HARD_PACK_MAX_CONTENT_BYTES = 1024 * 1024;

const SCOPE_PATTERN = /^[a-z0-9]+(?:[._/-][a-z0-9]+)*$/;
const STATUS_SERIALIZATION_ORDER: readonly DocumentStatus[] = [
  'active',
  'draft',
  'review',
  'superseded',
  'archived',
];

const AUDIENCE_VISIBILITIES: Readonly<
  Record<PackAudience, readonly DocumentVisibility[]>
> = Object.freeze({
  public: Object.freeze(['public'] as const),
  internal: Object.freeze(['public', 'internal'] as const),
  restricted: Object.freeze(['public', 'internal', 'restricted'] as const),
});

export interface PackPolicyOptions {
  audience?: PackAudience;
  includeNonActiveStatuses?: readonly PackNonActiveStatus[];
  maxContentBytes?: number;
  maxDocuments?: number;
  scope?: string;
}

export interface PackPolicy {
  allowedAuthorities: readonly ['canonical', 'approved'];
  allowedStatuses: readonly DocumentStatus[];
  allowedVisibilities: readonly DocumentVisibility[];
  audience: PackAudience;
  budget: Readonly<{
    maxContentBytes: number;
    maxDocuments: number;
    overflow: 'error';
  }>;
  policyFormatVersion: typeof PACK_POLICY_FORMAT_VERSION;
  scope: string | null;
}

export interface ContextPackDocument {
  aliases: readonly string[];
  authority: DocumentAuthority;
  id: string;
  kind: DocumentKind | null;
  owner: string;
  relations: readonly DocumentRelation[];
  reviewAfter: string | null;
  schemaVersion: SchemaVersion;
  scope: string | null;
  status: DocumentStatus;
  subjects: readonly string[];
  supersedes: readonly string[];
  tags: readonly string[];
  title: string;
  version: string;
  visibility: DocumentVisibility;
}

export interface ContextPackItem {
  content: {
    bytes: number;
    mediaType: 'text/markdown';
    text: string;
    trust: 'untrusted_repository_content';
  };
  document: ContextPackDocument;
  provenance: {
    digest: {
      algorithm: 'sha256';
      value: string;
    };
    sourceBytes: number;
    sourcePath: string;
  };
}

export interface ContextPack {
  generator: {
    name: 'canonkit';
    version: string;
  };
  items: ContextPackItem[];
  packFormatVersion: typeof PACK_FORMAT_VERSION;
  policy: PackPolicy;
  summary: {
    contentBytes: number;
    documents: number;
  };
}

export type PackFailureCode =
  | 'CKX001_VALIDATION_REQUIRED'
  | 'CKX002_EMPTY'
  | 'CKX003_DOCUMENT_LIMIT_EXCEEDED'
  | 'CKX004_CONTENT_BYTES_EXCEEDED'
  | 'CKX005_SOURCE_INTEGRITY_ERROR';

export interface PackFailure {
  code: PackFailureCode;
  message: string;
  remediation: string;
}

export type PackBuildResult =
  | {
      failure: null;
      ok: true;
      pack: ContextPack;
    }
  | {
      failure: PackFailure;
      ok: false;
      pack: null;
      summary: {
        consideredContentBytes: number;
        consideredDocuments: number;
      };
    };

export class PackContractError extends TypeError {
  constructor(message: string) {
    super(message);
    this.name = 'PackContractError';
  }
}

export function normalizePackPolicy(options: PackPolicyOptions = {}): PackPolicy {
  const audience = normalizeAudience(options.audience);
  const statuses = normalizeStatuses(options.includeNonActiveStatuses);
  const maxContentBytes = normalizeBudget(
    options.maxContentBytes,
    DEFAULT_PACK_MAX_CONTENT_BYTES,
    HARD_PACK_MAX_CONTENT_BYTES,
    'maxContentBytes',
  );
  const maxDocuments = normalizeBudget(
    options.maxDocuments,
    DEFAULT_PACK_MAX_DOCUMENTS,
    HARD_PACK_MAX_DOCUMENTS,
    'maxDocuments',
  );
  const scope = normalizeScope(options.scope);

  return Object.freeze({
    allowedAuthorities: PACK_GOVERNING_AUTHORITIES,
    allowedStatuses: statuses,
    allowedVisibilities: AUDIENCE_VISIBILITIES[audience],
    audience,
    budget: Object.freeze({ maxContentBytes, maxDocuments, overflow: 'error' as const }),
    policyFormatVersion: PACK_POLICY_FORMAT_VERSION,
    scope,
  });
}

function normalizeAudience(audience: PackAudience | undefined): PackAudience {
  const resolved = audience ?? 'public';
  if (!PACK_AUDIENCES.some((candidate) => candidate === resolved)) {
    throw new PackContractError('audience must be public, internal, or restricted');
  }
  return resolved;
}

function normalizeStatuses(
  included: readonly PackNonActiveStatus[] | undefined,
): readonly DocumentStatus[] {
  const requested = included ?? [];
  for (const status of requested) {
    if (!PACK_NON_ACTIVE_STATUSES.some((candidate) => candidate === status)) {
      throw new PackContractError(
        'includeNonActiveStatuses may contain only draft, review, superseded, or archived',
      );
    }
  }
  const unique = new Set<DocumentStatus>(['active', ...requested]);
  return Object.freeze(
    STATUS_SERIALIZATION_ORDER.filter((status) => unique.has(status)),
  );
}

function normalizeBudget(
  value: number | undefined,
  defaultValue: number,
  hardMaximum: number,
  name: string,
): number {
  const resolved = value ?? defaultValue;
  if (!Number.isSafeInteger(resolved) || resolved <= 0 || resolved > hardMaximum) {
    throw new PackContractError(
      `${name} must be a positive safe integer no greater than ${hardMaximum}`,
    );
  }
  return resolved;
}

function normalizeScope(scope: string | undefined): string | null {
  if (scope === undefined) return null;
  if (!SCOPE_PATTERN.test(scope)) {
    throw new PackContractError('scope must be a stable lower-case identity');
  }
  return scope;
}
