import type { PackBuildResult, PackFailure } from '../pack/contract.js';
import {
  renderContextPackJson,
  renderContextPackMarkdown,
} from '../pack/projection.js';
import type { PackCliFormat } from './arguments.js';

export const PACK_CLI_REPORT_FORMAT_VERSION = '1.0' as const;
export const MAX_PACK_RENDERED_BYTES = 8 * 1024 * 1024;

export interface PackCommandOutput {
  ok: boolean;
  output: string;
}

export function renderPackCommandResult(
  result: PackBuildResult,
  format: PackCliFormat,
): PackCommandOutput {
  if (!result.ok) {
    return { ok: false, output: renderFailure(format, result.failure, result.summary) };
  }

  const output =
    format === 'json'
      ? renderContextPackJson(result.pack)
      : renderContextPackMarkdown(result.pack);
  if (Buffer.byteLength(output, 'utf8') <= MAX_PACK_RENDERED_BYTES) {
    return { ok: true, output };
  }

  return {
    ok: false,
    output: renderFailure(
      format,
      {
        code: 'CKX006_OUTPUT_BYTES_EXCEEDED',
        message: `Rendered pack exceeds the ${MAX_PACK_RENDERED_BYTES}-byte process-output limit.`,
        remediation: 'Narrow the exact scope or reduce pack document and content-byte budgets.',
      },
      {
        consideredContentBytes: result.pack.summary.contentBytes,
        consideredDocuments: result.pack.summary.documents,
      },
    ),
  };
}

function renderFailure(
  format: PackCliFormat,
  failure: PackFailure,
  summary: { consideredContentBytes: number; consideredDocuments: number },
): string {
  if (format === 'json') {
    return `${JSON.stringify(
      {
        cliReportFormatVersion: PACK_CLI_REPORT_FORMAT_VERSION,
        command: 'pack',
        error: failure,
        ok: false,
        summary,
      },
      null,
      2,
    )}\n`;
  }

  return `# CanonKit context pack — FAILED

- Code: ${failure.code}
- Message: ${failure.message}
- Remediation: ${failure.remediation}
- Considered documents: ${summary.consideredDocuments}
- Considered UTF-8 content bytes: ${summary.consideredContentBytes}
`;
}
