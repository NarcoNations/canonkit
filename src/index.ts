/** The package identifier exposed by the Stage 1.1 foundation build. */
export const CANONKIT_PACKAGE_NAME = 'canonkit' as const;

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
