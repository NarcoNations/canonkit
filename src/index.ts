/** The package identifier exposed by the Stage 1.1 foundation build. */
export const CANONKIT_PACKAGE_NAME = 'canonkit' as const;

export { CANONKIT_VERSION } from './version.js';

export {
  DEFAULT_EXCLUDED_DIRECTORY_NAMES,
  DEFAULT_MAX_DOCUMENTS,
  discoverMarkdownFiles,
  type DiscoveredMarkdownFile,
  type DiscoveryDiagnostic,
  type DiscoveryDiagnosticCode,
  type DiscoveryOptions,
  type DiscoveryResult,
} from './discovery/repository.js';

export {
  DEFAULT_MAX_FILE_BYTES,
  LATEST_SCHEMA_VERSION,
  parseMarkdownFrontmatter,
  SUPPORTED_SCHEMA_VERSION,
  SUPPORTED_SCHEMA_VERSIONS,
  type CanonKitMetadata,
  type DocumentAuthority,
  type DocumentKind,
  type DocumentRelation,
  type DocumentRelationType,
  type DocumentStatus,
  type DocumentVisibility,
  type ParsedMarkdownDocument,
  type ParseFrontmatterOptions,
  type ParseFrontmatterResult,
  type ParserDiagnostic,
  type ParserDiagnosticCode,
  type SourceLocation,
  type SchemaVersion,
} from './metadata/frontmatter.js';

export {
  COLLECTION_FORMAT_VERSION,
  scanRepository,
  type CollectionDiagnostic,
  type CollectionDiagnosticCode,
  type DocumentCollection,
  type NormalizedDocument,
  type ScanRepositoryOptions,
} from './model/collection.js';

export {
  DOCUMENT_POLICY_FORMAT_VERSION,
  validateDocumentPolicies,
  type DocumentPolicyDiagnostic,
  type DocumentPolicyDiagnosticCode,
  type DocumentPolicyOptions,
  type DocumentPolicyResult,
} from './policy/documents.js';

export {
  RELATIONSHIP_POLICY_FORMAT_VERSION,
  validateRelationshipPolicies,
  type RelationshipPolicyDiagnostic,
  type RelationshipPolicyDiagnosticCode,
  type RelationshipPolicyResult,
} from './policy/relationships.js';

export {
  buildTrustGraphIndex,
  DEFAULT_GRAPH_VISIBILITIES,
  GOVERNING_AUTHORITIES,
  TRUST_GRAPH_FORMAT_VERSION,
  TrustGraphInputError,
  type EligibilityExclusion,
  type EligibilityExclusionCode,
  type ExplicitRelationEdge,
  type GraphEligibilityOptions,
  type SupersessionEdge,
  type TrustGraphIndex,
  type TrustGraphNode,
} from './graph/index.js';

export {
  MAX_RESOLUTION_NODES,
  RESOLUTION_AUTHORITY_PRIORITY,
  RESOLUTION_FORMAT_VERSION,
  RESOLUTION_KIND_PRIORITY,
  RESOLUTION_MATCH_PRIORITY,
  ResolutionInputError,
  resolveTrustGraph,
  type ResolutionCandidate,
  type ResolutionDisposition,
  type ResolutionExplanationCode,
  type ResolutionMatch,
  type ResolutionRank,
  type ResolutionReason,
  type ResolutionRejectionCode,
  type ResolutionResult,
  type ResolutionStatus,
} from './resolution/index.js';

export {
  DEFAULT_PACK_MAX_CONTENT_BYTES,
  DEFAULT_PACK_MAX_DOCUMENTS,
  HARD_PACK_MAX_CONTENT_BYTES,
  HARD_PACK_MAX_DOCUMENTS,
  normalizePackPolicy,
  PACK_AUDIENCES,
  PACK_FORMAT_VERSION,
  PACK_GOVERNING_AUTHORITIES,
  PACK_NON_ACTIVE_STATUSES,
  PACK_POLICY_FORMAT_VERSION,
  PackContractError,
  type ContextPack,
  type ContextPackDocument,
  type ContextPackItem,
  type PackAudience,
  type PackBuildResult,
  type PackFailure,
  type PackFailureCode,
  type PackNonActiveStatus,
  type PackPolicy,
  type PackPolicyOptions,
} from './pack/contract.js';

export {
  buildContextPack,
  renderContextPackJson,
  renderContextPackMarkdown,
} from './pack/projection.js';
