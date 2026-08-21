import {
  TRUST_GRAPH_FORMAT_VERSION,
  type EligibilityExclusionCode,
  type TrustGraphIndex,
  type TrustGraphNode,
} from '../graph/index.js';

export const RESOLUTION_FORMAT_VERSION = '1.0' as const;
export const MAX_RESOLUTION_NODES = 1000;

export const RESOLUTION_MATCH_PRIORITY = Object.freeze([
  'subject',
  'document_id',
  'alias',
] as const);
export const RESOLUTION_KIND_PRIORITY = Object.freeze([
  'canon',
  'policy',
  'decision',
  'reference',
  'legacy',
] as const);
export const RESOLUTION_AUTHORITY_PRIORITY = Object.freeze([
  'canonical',
  'approved',
] as const);

export type ResolutionMatch = (typeof RESOLUTION_MATCH_PRIORITY)[number];
export type ResolutionStatus = 'resolved' | 'ambiguous' | 'unresolved' | 'not_found';
export type ResolutionDisposition = 'selected' | 'contender' | 'rejected';
export type ResolutionExplanationCode =
  | 'CKS001_SELECTED'
  | 'CKS002_AMBIGUOUS'
  | 'CKS003_NO_ELIGIBLE_CANDIDATE'
  | 'CKS004_NO_MATCH';
export type ResolutionRejectionCode =
  | EligibilityExclusionCode
  | 'CKS101_LOWER_MATCH_PRIORITY'
  | 'CKS102_LOWER_KIND_PRIORITY'
  | 'CKS103_LOWER_AUTHORITY_PRIORITY';

export interface ResolutionRank {
  authority: number;
  kind: number;
  match: number;
}

export interface ResolutionReason {
  code: ResolutionRejectionCode;
  message: string;
}

export interface ResolutionCandidate {
  disposition: ResolutionDisposition;
  matches: ResolutionMatch[];
  node: TrustGraphNode;
  rank: ResolutionRank;
  reasons: ResolutionReason[];
}

export interface ResolutionResult {
  candidates: ResolutionCandidate[];
  explanation: {
    code: ResolutionExplanationCode;
    message: string;
  };
  formatVersion: typeof RESOLUTION_FORMAT_VERSION;
  policy: {
    authorityPriority: typeof RESOLUTION_AUTHORITY_PRIORITY;
    kindPriority: typeof RESOLUTION_KIND_PRIORITY;
    matchPriority: typeof RESOLUTION_MATCH_PRIORITY;
  };
  query: {
    normalized: string;
    value: string;
  };
  selected: TrustGraphNode | null;
  status: ResolutionStatus;
  summary: {
    eligibleCandidates: number;
    matchedCandidates: number;
    rejectedCandidates: number;
    topRankedCandidates: number;
  };
}

export class ResolutionInputError extends Error {
  override readonly name = 'ResolutionInputError';
}

export function resolveTrustGraph(graph: TrustGraphIndex, query: string): ResolutionResult {
  const normalized = normalizeQuery(query);
  assertGraphBoundary(graph);

  const matched = graph.nodes.flatMap((node): ResolutionCandidate[] => {
    const matches = matchesFor(node, normalized);
    if (matches.length === 0) return [];
    return [
      {
        disposition: 'rejected',
        matches,
        node,
        rank: rankFor(node, matches),
        reasons: node.eligibility.exclusions.map(({ code, message }) => ({ code, message })),
      },
    ];
  });
  const eligible = matched.filter(({ node }) => node.eligibility.eligible);
  const topRank = eligible.reduce<ResolutionRank | null>(
    (current, candidate) =>
      current === null || compareRanks(candidate.rank, current) < 0 ? candidate.rank : current,
    null,
  );
  const topNodeIds = new Set(
    topRank === null
      ? []
      : eligible
          .filter(({ rank }) => equalRanks(rank, topRank))
          .map(({ node }) => node.nodeId),
  );
  const selectedNodeId = topNodeIds.size === 1 ? [...topNodeIds][0] : undefined;
  const candidates = matched
    .map((candidate): ResolutionCandidate => {
      if (!candidate.node.eligibility.eligible) return candidate;
      if (topNodeIds.has(candidate.node.nodeId)) {
        return {
          ...candidate,
          disposition: selectedNodeId === candidate.node.nodeId ? 'selected' : 'contender',
          reasons: [],
        };
      }
      return {
        ...candidate,
        disposition: 'rejected',
        reasons: [lowerRankReason(candidate.rank, topRank as ResolutionRank)],
      };
    })
    .sort(compareCandidates);

  const selected =
    selectedNodeId === undefined
      ? null
      : (candidates.find(({ node }) => node.nodeId === selectedNodeId)?.node ?? null);
  const status = resolutionStatus(matched.length, eligible.length, topNodeIds.size);
  const explanation = explanationFor(status, matched.length, topNodeIds.size);

  return {
    candidates,
    explanation,
    formatVersion: RESOLUTION_FORMAT_VERSION,
    policy: {
      authorityPriority: RESOLUTION_AUTHORITY_PRIORITY,
      kindPriority: RESOLUTION_KIND_PRIORITY,
      matchPriority: RESOLUTION_MATCH_PRIORITY,
    },
    query: { normalized, value: query },
    selected,
    status,
    summary: {
      eligibleCandidates: eligible.length,
      matchedCandidates: matched.length,
      rejectedCandidates: candidates.filter(({ disposition }) => disposition === 'rejected').length,
      topRankedCandidates: topNodeIds.size,
    },
  };
}

function normalizeQuery(query: string): string {
  if (typeof query !== 'string') throw new ResolutionInputError('Resolution query must be text.');
  const normalized = query.trim().replace(/\s+/g, ' ').toLowerCase();
  if (normalized.length === 0) {
    throw new ResolutionInputError('Resolution query must not be empty.');
  }
  if (normalized.length > 160) {
    throw new ResolutionInputError('Resolution query must not exceed 160 characters.');
  }
  return normalized;
}

function assertGraphBoundary(graph: TrustGraphIndex): void {
  if (graph.formatVersion !== TRUST_GRAPH_FORMAT_VERSION) {
    throw new ResolutionInputError('Resolution requires a supported trust graph format.');
  }
  if (graph.nodes.length > MAX_RESOLUTION_NODES) {
    throw new ResolutionInputError(
      `Resolution graph exceeds the ${MAX_RESOLUTION_NODES}-node safety limit.`,
    );
  }
  const nodeIds = new Set<string>();
  for (const node of graph.nodes) {
    if (nodeIds.has(node.nodeId)) {
      throw new ResolutionInputError(`Resolution graph contains duplicate node ${node.nodeId}.`);
    }
    nodeIds.add(node.nodeId);
  }
}

function matchesFor(node: TrustGraphNode, normalized: string): ResolutionMatch[] {
  const matches: ResolutionMatch[] = [];
  if (node.subjects.includes(normalized)) matches.push('subject');
  if (node.id === normalized) matches.push('document_id');
  if (node.aliases.some((alias) => normalizeAlias(alias) === normalized)) matches.push('alias');
  return matches;
}

function normalizeAlias(alias: string): string {
  return alias.trim().replace(/\s+/g, ' ').toLowerCase();
}

function rankFor(node: TrustGraphNode, matches: readonly ResolutionMatch[]): ResolutionRank {
  return {
    authority: priority(node.authority, RESOLUTION_AUTHORITY_PRIORITY),
    kind: priority(node.kind ?? 'legacy', RESOLUTION_KIND_PRIORITY),
    match: Math.max(...matches.map((match) => priority(match, RESOLUTION_MATCH_PRIORITY))),
  };
}

function priority(value: string, ordered: readonly string[]): number {
  const index = ordered.indexOf(value);
  return index === -1 ? 0 : ordered.length - index;
}

function compareRanks(left: ResolutionRank, right: ResolutionRank): number {
  return right.match - left.match || right.kind - left.kind || right.authority - left.authority;
}

function equalRanks(left: ResolutionRank, right: ResolutionRank): boolean {
  return left.match === right.match && left.kind === right.kind && left.authority === right.authority;
}

function lowerRankReason(rank: ResolutionRank, top: ResolutionRank): ResolutionReason {
  if (rank.match !== top.match) {
    return {
      code: 'CKS101_LOWER_MATCH_PRIORITY',
      message: 'A higher-priority explicit query match is available.',
    };
  }
  if (rank.kind !== top.kind) {
    return {
      code: 'CKS102_LOWER_KIND_PRIORITY',
      message: 'A higher-priority document role is available.',
    };
  }
  return {
    code: 'CKS103_LOWER_AUTHORITY_PRIORITY',
    message: 'A higher-priority governing authority is available.',
  };
}

function compareCandidates(left: ResolutionCandidate, right: ResolutionCandidate): number {
  return (
    dispositionPriority(right.disposition) - dispositionPriority(left.disposition) ||
    compareRanks(left.rank, right.rank) ||
    compareStable(left.node.nodeId, right.node.nodeId)
  );
}

function dispositionPriority(disposition: ResolutionDisposition): number {
  if (disposition === 'selected') return 3;
  if (disposition === 'contender') return 2;
  return 1;
}

function resolutionStatus(
  matchedCandidates: number,
  eligibleCandidates: number,
  topRankedCandidates: number,
): ResolutionStatus {
  if (matchedCandidates === 0) return 'not_found';
  if (eligibleCandidates === 0) return 'unresolved';
  return topRankedCandidates === 1 ? 'resolved' : 'ambiguous';
}

function explanationFor(
  status: ResolutionStatus,
  matchedCandidates: number,
  topRankedCandidates: number,
): ResolutionResult['explanation'] {
  if (status === 'resolved') {
    return {
      code: 'CKS001_SELECTED',
      message: 'One eligible candidate has the highest explicit policy rank.',
    };
  }
  if (status === 'ambiguous') {
    return {
      code: 'CKS002_AMBIGUOUS',
      message: `${topRankedCandidates} eligible candidates share the highest policy rank; no source was selected.`,
    };
  }
  if (status === 'unresolved') {
    return {
      code: 'CKS003_NO_ELIGIBLE_CANDIDATE',
      message: `${matchedCandidates} candidates matched, but every candidate is ineligible.`,
    };
  }
  return {
    code: 'CKS004_NO_MATCH',
    message: 'No document matched the explicit subject, document identity, or alias.',
  };
}

function compareStable(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}
