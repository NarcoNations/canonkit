#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { Buffer } from 'node:buffer';
import { createHash } from 'node:crypto';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const repositoryRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const packageJson = readJson(join(repositoryRoot, 'package.json'));
const lockedCandidate = readJson(join(repositoryRoot, 'release', 'alpha-candidate.json'));
const expectedPackageName = '@vibelabz/canonkit';
const expectedVersion = '0.1.0-alpha.0';
const expectedRepository = 'git+https://github.com/NarcoNations/canonkit.git';
const expectedRuntimeLicenses = new Map([
  ['ajv', 'MIT'],
  ['yaml', 'ISC'],
]);
const requiredPackageFiles = [
  'LICENSE',
  'README.md',
  'dist/cli.js',
  'dist/index.d.ts',
  'dist/index.js',
  'package.json',
  'schema/canonkit-document-v1.1.schema.json',
  'schema/canonkit-document.schema.json',
];

assert(packageJson.name === expectedPackageName, `Expected package name ${expectedPackageName}.`);
assert(packageJson.version === expectedVersion, `Expected version ${expectedVersion}.`);
assert(packageJson.private === true, 'The rehearsal package must remain private.');
assert(packageJson.license === 'MIT', 'The package licence must remain MIT.');
assert(packageJson.publishConfig?.access === 'public', 'Scoped public access intent is missing.');
assert(packageJson.repository?.url === expectedRepository, 'The provenance repository URL changed.');
assert(
  JSON.stringify(Object.keys(packageJson.dependencies ?? {}).sort()) ===
    JSON.stringify([...expectedRuntimeLicenses.keys()].sort()),
  'The runtime dependency allowlist changed.',
);

for (const lifecycleName of [
  'preinstall',
  'install',
  'postinstall',
  'prepublish',
  'prepublishOnly',
  'prepare',
]) {
  assert(!(lifecycleName in (packageJson.scripts ?? {})), `Lifecycle script ${lifecycleName} is prohibited.`);
}

for (const [dependency, expectedLicense] of expectedRuntimeLicenses) {
  const dependencyPackage = readJson(join(repositoryRoot, 'node_modules', dependency, 'package.json'));
  assert(
    dependencyPackage.license === expectedLicense,
    `${dependency} licence changed from ${expectedLicense} to ${String(dependencyPackage.license)}.`,
  );
}

const rehearsalRoot = mkdtempSync(join(tmpdir(), 'canonkit-release-rehearsal-'));

try {
  const packOutput = runNpm(
    ['pack', '--json', '--pack-destination', rehearsalRoot],
    repositoryRoot,
  );
  const packedEntries = JSON.parse(packOutput);
  assert(Array.isArray(packedEntries) && packedEntries.length === 1, 'Expected exactly one tarball.');

  const packed = packedEntries[0];
  assert(packed.name === expectedPackageName, 'Packed name does not match the selected candidate.');
  assert(packed.version === expectedVersion, 'Packed version does not match the alpha candidate.');
  assert(typeof packed.integrity === 'string' && packed.integrity.startsWith('sha512-'), 'Missing integrity.');
  assert(packed.entryCount === packed.files.length, 'Package entry count is inconsistent.');

  const packageFiles = packed.files.map(({ path }) => path).sort();
  for (const path of packageFiles) {
    assert(isAllowedPackagePath(path), `Unexpected package path: ${path}`);
  }
  for (const path of requiredPackageFiles) {
    assert(packageFiles.includes(path), `Required package path is missing: ${path}`);
  }

  const manifest = packageFiles.map((path) => ({
    path,
    sha256: sha256(readFileSync(join(repositoryRoot, path))),
  }));
  const manifestSha256 = sha256(Buffer.from(JSON.stringify(manifest)));
  assert(packed.entryCount === lockedCandidate.entryCount, 'Candidate entry count changed.');
  assert(
    manifestSha256 === lockedCandidate.manifestSha256,
    `Candidate contents changed: expected ${lockedCandidate.manifestSha256}, received ${manifestSha256}.`,
  );
  assert(packed.name === lockedCandidate.name, 'Candidate manifest package name changed.');
  assert(packed.version === lockedCandidate.version, 'Candidate manifest version changed.');

  const consumerRoot = join(rehearsalRoot, 'consumer');
  mkdirSync(join(consumerRoot, '.git'), { recursive: true });
  mkdirSync(join(consumerRoot, 'docs'), { recursive: true });
  writeFileSync(
    join(consumerRoot, 'package.json'),
    `${JSON.stringify({ name: 'canonkit-release-consumer', private: true, type: 'module' }, null, 2)}\n`,
  );
  writeFileSync(join(consumerRoot, 'docs', 'example-service.md'), exampleDocument());

  const tarballPath = join(rehearsalRoot, packed.filename);
  runNpm(
    ['install', '--ignore-scripts', '--no-package-lock', '--save-exact', tarballPath],
    consumerRoot,
    'inherit',
  );

  const cliPath = join(
    consumerRoot,
    'node_modules',
    '.bin',
    process.platform === 'win32' ? 'canonkit.cmd' : 'canonkit',
  );
  const versionOutput = run(cliPath, ['--version'], consumerRoot).trim();
  assert(versionOutput === expectedVersion, 'Installed CLI version is incorrect.');
  run(cliPath, ['validate', '.', '--quiet'], consumerRoot);
  run(cliPath, ['resolve', 'products/example-service', '.', '--format', 'json'], consumerRoot);
  const packJson = JSON.parse(run(cliPath, ['pack', '.', '--format', 'json'], consumerRoot));
  assert(packJson.generator?.version === expectedVersion, 'Installed pack generator version is incorrect.');

  run(
    process.execPath,
    [
      '--input-type=module',
      '--eval',
      `import('${expectedPackageName}').then((module) => {
        if (module.CANONKIT_PACKAGE_NAME !== '${expectedPackageName}') process.exit(1);
        if (module.CANONKIT_VERSION !== '${expectedVersion}') process.exit(1);
      });`,
    ],
    consumerRoot,
  );

  const installedTree = JSON.parse(runNpm(['ls', '--omit=dev', '--all', '--json'], consumerRoot));
  assert(installedTree.dependencies?.[expectedPackageName] !== undefined, 'Installed package is missing.');

  process.stdout.write(
    `${JSON.stringify({
      architecture: process.arch,
      entryCount: packed.entryCount,
      filename: packed.filename,
      manifestSha256,
      name: packed.name,
      node: process.version,
      platform: process.platform,
      size: packed.size,
      version: packed.version,
    })}\n`,
  );
} finally {
  rmSync(rehearsalRoot, { force: true, recursive: true });
}

function isAllowedPackagePath(path) {
  return (
    path === 'LICENSE' ||
    path === 'README.md' ||
    path === 'package.json' ||
    path.startsWith('dist/') ||
    path.startsWith('schema/')
  );
}

function exampleDocument() {
  return `---
schema_version: "1.1"
id: canon/example-service
kind: canon
title: Example service
status: active
authority: canonical
owner: documentation
version: "1.0"
visibility: public
scope: products/example
subjects:
  - products/example-service
---
# Example service

Neutral release-rehearsal content.
`;
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function runNpm(args, cwd, stdio = 'pipe') {
  return run(npmCommand, args, cwd, stdio);
}

function run(command, args, cwd, stdio = 'pipe') {
  return execFileSync(command, args, {
    cwd,
    encoding: 'utf8',
    env: {
      ...process.env,
      NPM_CONFIG_IGNORE_SCRIPTS: 'true',
    },
    stdio,
  });
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
