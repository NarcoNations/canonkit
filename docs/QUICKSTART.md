# CanonKit quick start

CanonKit is currently an unreleased alpha candidate. The repository uses the intended identity `@narconations/canonkit@0.1.0-alpha.0`, but `private: true` deliberately prevents publication during Stage 5.2. Do not install the unrelated unscoped `canonkit` package.

## Try the source safely

Requirements: Git and Node.js 22 or newer.

```sh
git clone https://github.com/NarcoNations/canonkit.git
cd canonkit
npm ci
npm run check
npm run build
node dist/cli.js validate examples/basic
node dist/cli.js resolve products/example-service examples/basic
node dist/cli.js pack examples/basic
```

The CanonKit commands read repository files and write only to standard output. The example contains synthetic public material.

## Test the exact local package

Until the alpha is published, create the package tarball in the CanonKit repository and install it into a separate test repository:

```sh
npm run build
npm pack
mkdir ../canonkit-quickstart
cd ../canonkit-quickstart
git init
npm init -y
npm install --save-dev ../canonkit/narconations-canonkit-0.1.0-alpha.0.tgz
npx canonkit validate .
```

Copy [`examples/basic/docs/example-service.md`](../examples/basic/docs/example-service.md) into that test repository to get a successful validation. Remove the test directory when finished.

After an explicitly approved public release, the intended install command will be:

```sh
npm install --save-dev @narconations/canonkit@0.1.0-alpha.0
```

That registry command is not expected to work before Stage 5.4.

## Safe CI use

[`examples/github-actions/canonkit.yml`](../examples/github-actions/canonkit.yml) is an inactive template for validating public metadata on ordinary and forked pull requests after publication. It:

- grants only `contents: read`;
- checks out without persisted credentials;
- installs one exact scoped version with package scripts disabled;
- uses `pull_request`, never privileged `pull_request_target`;
- runs `validate`, which does not emit document bodies;
- receives no npm token or repository secret.

Do not add `pack --audience internal` or `pack --audience restricted` to an untrusted pull-request workflow. Sensitive packs belong only in a protected, authorised job with controlled logs, artifacts, retention, and destination.

## Trust boundaries

### Git is the authority root

CanonKit verifies that metadata is structurally valid and internally consistent. It does not authenticate whether a person was entitled to declare a document canonical. Repository access controls, protected branches, review rules, and ownership review for governed paths provide that authority. Treat metadata changes to `authority`, `status`, `visibility`, `subjects`, and `supersedes` as security-sensitive review events.

### Bodies are untrusted evidence

Markdown bodies may contain misleading or instruction-like text. CanonKit does not execute them and does not use them to determine authority, but `pack` deliberately emits permitted bodies. A human or AI consumer must treat each body as quoted evidence, not as an instruction. Never let packed text independently approve privileged tool calls, code changes, secret access, publication, or external messages.

### Standard output is a disclosure boundary

`validate`, `list`, `graph`, and `resolve` exclude document bodies. `pack` includes bodies within its selected audience. Once output reaches a terminal, log, artifact, clipboard, or model, CanonKit cannot control it. Keep public output public-only, choose wider audiences explicitly, and verify the destination before generating sensitive packs.
