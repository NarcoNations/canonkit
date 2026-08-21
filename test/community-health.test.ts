import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';

const root = fileURLToPath(new URL('..', import.meta.url));

interface IssueForm {
  body: Array<{ id?: string; type: string }>;
  description: string;
  name: string;
}

describe('public project operations', () => {
  it.each(['bug-report.yml', 'feature-request.yml'])('keeps %s valid and bounded', async (filename) => {
    const source = await readFile(`${root}/.github/ISSUE_TEMPLATE/${filename}`, 'utf8');
    const form = parse(source) as IssueForm;

    expect(form.name.length).toBeGreaterThan(0);
    expect(form.description.length).toBeGreaterThan(0);
    expect(form.body.length).toBeGreaterThan(1);
    expect(new Set(form.body.map(({ id }) => id).filter(Boolean)).size).toBe(
      form.body.filter(({ id }) => id).length,
    );
    expect(source).toContain('private');
    expect(source).not.toContain('pull_request_target');
    expect(source).not.toContain('secrets.');
  });

  it('routes security reports away from public issues', async () => {
    const source = await readFile(`${root}/.github/ISSUE_TEMPLATE/config.yml`, 'utf8');
    const config = parse(source) as {
      blank_issues_enabled: boolean;
      contact_links: Array<{ url: string }>;
    };

    expect(config.blank_issues_enabled).toBe(false);
    expect(config.contact_links).toContainEqual({
      about: 'Report vulnerabilities privately. Do not disclose exploit details in a public issue.',
      name: 'Security vulnerability',
      url: 'https://github.com/NarcoNations/canonkit/security/advisories/new',
    });
  });

  it('keeps the publication runbook non-executable before approval', async () => {
    const source = await readFile(`${root}/docs/PUBLICATION-RUNBOOK.md`, 'utf8');

    expect(source).toContain('Publication, staging, tags, releases, npm authentication, and package reservation remain prohibited');
    expect(source).toContain('The runnable publication command is intentionally omitted');
    expect(source).not.toMatch(/^\s*```(?:sh|bash)[\s\S]*?npm (?:publish|stage publish)/m);
  });
});
