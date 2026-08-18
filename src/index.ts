/** The package identifier exposed by the Stage 1.1 foundation build. */
export const CANONKIT_PACKAGE_NAME = 'canonkit' as const;

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
  parseMarkdownFrontmatter,
  SUPPORTED_SCHEMA_VERSION,
  type CanonKitMetadata,
  type DocumentAuthority,
  type DocumentStatus,
  type DocumentVisibility,
  type ParsedMarkdownDocument,
  type ParseFrontmatterOptions,
  type ParseFrontmatterResult,
  type ParserDiagnostic,
  type ParserDiagnosticCode,
  type SourceLocation,
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
