import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { Ajv2020, type AnySchema, type ErrorObject } from 'ajv/dist/2020.js';
import { describe, expect, it } from 'vitest';

const root = fileURLToPath(new URL('..', import.meta.url));
const schema = readJson('schema/canonkit-document.schema.json') as AnySchema;
const ajv = new Ajv2020({ allErrors: true, strict: true });
ajv.addFormat('date', {
  type: 'string',
  validate: (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value),
});
const validate = ajv.compile(schema);

type ExpectedError = {
  instancePath?: string;
  keyword: string;
  missingProperty?: string;
};

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(`${root}/${path}`, 'utf8')) as unknown;
}

function fixtureNames(path: string): string[] {
  return readdirSync(`${root}/${path}`)
    .filter((name) => name.endsWith('.json') && name !== 'expectations.json')
    .sort();
}

function matchesExpectedError(error: ErrorObject, expected: ExpectedError): boolean {
  return (
    error.keyword === expected.keyword &&
    (expected.instancePath === undefined || error.instancePath === expected.instancePath) &&
    (expected.missingProperty === undefined ||
      error.params['missingProperty'] === expected.missingProperty)
  );
}

describe('CanonKit document metadata schema', () => {
  it.each(fixtureNames('fixtures/metadata/valid'))('accepts valid fixture %s', (name) => {
    const valid = validate(readJson(`fixtures/metadata/valid/${name}`));

    expect(validate.errors, JSON.stringify(validate.errors, null, 2)).toBeNull();
    expect(valid).toBe(true);
  });

  const expectations = readJson(
    'fixtures/metadata/invalid/expectations.json',
  ) as Record<string, ExpectedError>;

  it.each(fixtureNames('fixtures/metadata/invalid'))(
    'rejects invalid fixture %s for the intended reason',
    (name) => {
      const valid = validate(readJson(`fixtures/metadata/invalid/${name}`));
      const expected = expectations[name];

      expect(expected, `Missing expectation for ${name}`).toBeDefined();
      if (expected === undefined) {
        throw new Error(`Missing expectation for ${name}`);
      }
      expect(valid).toBe(false);
      expect(validate.errors?.some((error) => matchesExpectedError(error, expected))).toBe(true);
    },
  );

  it('has one expectation for every invalid fixture', () => {
    expect(Object.keys(expectations).sort()).toEqual(fixtureNames('fixtures/metadata/invalid'));
  });
});
