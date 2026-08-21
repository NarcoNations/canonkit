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
