import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';

import {
  buildTrustGraphIndex,
  resolveTrustGraph,
  scanRepository,
  validateDocumentPolicies,
  validateRelationshipPolicies,
} from '../src/index.js';

const root = fileURLToPath(new URL('..', import.meta.url));

describe('public usage examples', () => {
  it('runs the basic example through collection, policy, graph, and resolution', async () => {
    const collection = await scanRepository(`${root}/examples/basic`);
    const documents = validateDocumentPolicies(collection.documents, { today: '2026-08-21' });
    const relationships = validateRelationshipPolicies(collection.documents);
    const resolution = resolveTrustGraph(buildTrustGraphIndex(collection.documents), 'products/example-service');

    expect(collection.ok).toBe(true);
    expect(documents.ok).toBe(true);
    expect(relationships.ok).toBe(true);
    expect(resolution).toMatchObject({
      selected: { id: 'canon/example-service' },
      status: 'resolved',
    });
  });

  it('keeps the pull-request workflow public-only, read-only, and credential-free', async () => {
    const source = await readFile(`${root}/examples/github-actions/canonkit.yml`, 'utf8');
    const workflow = parse(source) as {
      jobs: Record<string, { steps: Array<{ env?: Record<string, string>; run?: string }> }>;
      permissions: Record<string, string>;
    };

    expect(workflow.permissions).toEqual({ contents: 'read' });
    expect(source).toContain('@vibelabz/canonkit@0.1.0-alpha.0');
    expect(source).toContain('NPM_CONFIG_IGNORE_SCRIPTS: "true"');
    expect(source).toContain('persist-credentials: false');
    expect(source).not.toContain('pull_request_target');
    expect(source).not.toContain('NPM_TOKEN');
    expect(source).not.toContain('secrets.');
    expect(source).not.toContain('canonkit" pack');
    expect(Object.values(workflow.jobs)).toHaveLength(1);
  });
});
