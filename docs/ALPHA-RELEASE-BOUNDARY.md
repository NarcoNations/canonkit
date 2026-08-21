# Public-alpha release boundary

## Decision

The Stage 5.3 identity review supersedes the transitional Stage 5.1 package choice:

- **Product:** CanonKit
- **Positioning:** Govern what becomes authoritative.
- **Relationship:** independently branded open-source VibeLabz product; technically independent of FABRIC
- **Selected package candidate:** `@vibelabz/canonkit`
- **CLI binary:** `canonkit`
- **Initial version:** `0.1.0-alpha.0`
- **Access:** public scoped package
- **Current source/provenance host:** the `NarcoNations/canonkit` GitHub repository
- **Runtime:** Node.js 22 or newer
- **Licence:** MIT

This is a release contract, not a publication. The private package metadata now uses the selected candidate so the exact artifact can be rehearsed, but the npm organisation is not yet verified, no publisher has been authenticated, and no artifact or tag has been published.

The unscoped `canonkit` name is an active unrelated package with similar positioning and is unavailable. CanonKit documentation and automation must never instruct users to install it. Registry checks on 2026-08-21 returned no public package for either `@canonkit/canonkit` or `@vibelabz/canonkit`, but package-level absence does not prove ownership of either organisation scope. [`PACKAGE-IDENTITY-REVIEW.md`](./PACKAGE-IDENTITY-REVIEW.md) records the evidence, alternatives, decision, and authenticated ownership gate. `@narconations/canonkit` is transitional build history only and is not an approved public identity.

## Intended usage boundary

The alpha is:

- a local, offline-capable CLI and TypeScript library
- run by a user or controlled CI job with permission to read the target repository
- read-only with respect to governed repository content
- suitable for public, internal, or restricted repositories when the operator controls the output destination
- deterministic and network-disabled at runtime

The alpha is not:

- a hosted service, API, dashboard, database, identity system, or multi-tenant product
- an authority or approval system independent of Git repository access and review policy
- a sandbox for hostile code
- a prompt-injection defense for downstream AI agents
- permission to publish internal or restricted packs from untrusted pull-request jobs
- a guarantee that a document's human claims are true merely because its metadata is valid

## Artifact boundary

The release tarball may contain only:

- compiled ESM JavaScript, declarations, and source maps under `dist/`
- public JSON Schemas and their public README under `schema/`
- `README.md`
- `LICENSE`
- npm-generated package metadata

It must not contain fixtures, tests, source Markdown from target repositories, environment files, credentials, local absolute paths, Vercel state, coverage, Git metadata, private documentation, or development-only configuration.

Runtime dependencies remain limited to the schema validator and YAML parser already declared in `package.json`. Any added runtime dependency requires an explicit reason, licence review, audit, and package-content recheck.

## Publishing authority

The normal publishing boundary is a protected GitHub Actions release workflow using [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/) with automatically generated provenance. Npm's current setup begins in an existing package's settings, so the first package creation may require a one-time bootstrap before trusted publishing can be configured.

Normal release flow:

1. A reviewed commit is merged to protected `main` and all required checks pass.
2. The maintainer gives explicit release approval through a protected GitHub environment.
3. The workflow builds once, previews and verifies the exact tarball, installs that tarball in a clean production-only consumer, and reruns CLI smoke tests.
4. The same verified tarball is published publicly as `@vibelabz/canonkit@0.1.0-alpha.0` with provenance.
5. Only after registry verification is the matching Git tag and GitHub prerelease created.

If npm does not support configuring a trusted publisher before the package exists, the first publication may use a one-time maintainer-authenticated bootstrap only when every other blocker has closed. It must publish the same verified tarball with MFA, use [`--access public` as required for a scoped public package](https://docs.npmjs.com/creating-and-publishing-scoped-public-packages/), avoid a long-lived automation token, configure the trusted publisher immediately afterward, and verify or revoke every bootstrap credential. This exception still requires explicit maintainer approval at the publication checkpoint.

Required controls:

- authenticated npm `vibelabz` organisation ownership and recovery controlled by the maintainer
- phishing-resistant MFA on maintainer accounts
- no routine long-lived npm token and no token in forked pull-request workflows
- release tooling compatible with npm's current trusted-publishing requirements
- GitHub workflow permissions set to the minimum required for the publish job
- protected release environment with manual approval
- third-party GitHub Actions pinned to immutable commit SHAs in a publishing workflow
- package identity, version, repository commit, integrity, provenance, and public access verified after publish
- explicit maintainer approval immediately before the first external publication

Local `npm publish` is limited to the explicitly approved first-package bootstrap described above or an emergency recovery. It is not the normal release process.

## CI disclosure policy

For untrusted or forked pull requests:

- permitted: install dependencies, build, test, and run validation against synthetic or public-only material
- prohibited: `canonkit pack --audience internal`, `canonkit pack --audience restricted`, secret access, publish credentials, package publication, and uploading sensitive packs as logs or artifacts
- required: read-only repository permissions and no privileged `pull_request_target` execution of untrusted checkout code

Sensitive packs may run only in a trusted, protected job where the repository, workflow, destination, retention, and human operator are all authorised for the selected audience.

## Alpha release blockers

| ID | Blocker | Required evidence | Target checkpoint | Status |
| --- | --- | --- | --- | --- |
| RB-001 | The selected npm `vibelabz` organisation scope is not yet authenticated or proven controlled | Authenticated owner access, current email and GitHub recovery links, WebAuthn MFA, organisation 2FA enforcement, offline recovery codes, a recorded backup-owner or accepted solo-owner risk, and a current first-package bootstrap decision | 5.3 release rehearsal | Open |
| RB-002 | Apply the intended scoped identity without accidentally publishing | `@vibelabz/canonkit@0.1.0-alpha.0` private metadata, public-access intent, exact source links, licence, package preview, and clean local tarball install; `private: true` remains the deliberate no-publish gate | 5.3 package identity checkpoint | Closed |
| RB-003 | Bound aggregate repository input before retaining normalized documents | Default 32 MiB and hard 256 MiB aggregate contract, bounded-read implementation, atomic `CKS003_TOTAL_BYTES_EXCEEDED`, and tests | 5.2 installation and CI usage | Closed |
| RB-004 | Define safe untrusted-PR and downstream-agent usage | Neutral example, public-only read-only PR workflow, and explicit Git-authority, sensitive-output, and AI-consumer boundaries | 5.2 installation and CI usage | Closed |
| RB-005 | No protected trusted-publishing workflow or provenance gate exists | Least-privilege OIDC workflow, immutable action references, approval environment, exact-tarball verification | 5.3 release rehearsal | Open |
| RB-006 | Cross-platform and exact-candidate-tarball evidence is incomplete | Locked unpacked-content manifest, supported Node/OS matrix, package audit, licence check, and clean production-only install; real provenance remains RB-005 | 5.3 non-publishing rehearsal | Open — workflow implemented, matrix pending |

Any newly discovered Critical or High threat becomes an additional blocker unless it is resolved before publication.

## Non-blocking hardening

- Add explicit CSP, framing, and content-type headers for the static concept site during deployment hardening.
- Review whether absolute discovery-error paths should be redacted in public CI output.
- Revisit descriptor-based no-follow reads only if the formal local-attacker assumption changes or evidence shows the current fail-closed integrity checks are insufficient.

## Publication decision

Publication remains prohibited until every blocker above is closed, the release rehearsal passes, and the maintainer explicitly authorises the external publish action. Preparing code, documentation, npm configuration, or workflows does not itself grant publication authority.
