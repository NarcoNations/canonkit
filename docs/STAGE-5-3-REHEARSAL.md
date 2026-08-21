# Stage 5.3 non-publishing release rehearsal

- **Candidate:** `@vibelabz/canonkit@0.1.0-alpha.0`
- **Status:** complete
- **Publication:** prohibited
- **Locked entries:** 78
- **Locked unpacked-content manifest:** `762707170938ba80dbc4a56c8ded04f5427b6e5fcd4a90221493b16682685207`

## Boundary

This checkpoint proves only the safe technical preparation that does not require an incorporated company or npm organisation access. It does not claim the `vibelabz` npm scope, authenticate npm, configure a trusted publisher, request an OIDC token, publish or stage a package, upload the tarball, create a Git tag, or create a GitHub release.

The manual workflow in [`.github/workflows/release-rehearsal.yml`](../.github/workflows/release-rehearsal.yml) has only `contents: read`, checks out without persisted credentials, uses immutable GitHub Action commit references, and runs no third-party action beyond checkout and Node setup.

## What each matrix job proves

1. Installs the exact lockfile with lifecycle scripts disabled.
2. Runs lint, strict typechecking, all tests, and the production build.
3. Runs a high-severity npm dependency audit.
4. Verifies package identity, version, private publication lock, licence, repository/provenance URL, public-access intent, runtime dependency allowlist, and absence of package lifecycle scripts.
5. Creates exactly one tarball and permits only `dist/`, `schema/`, `README.md`, `LICENSE`, and package metadata.
6. Requires every job to reproduce the locked 78-file unpacked-content manifest.
7. Verifies the direct runtime dependency licences: `ajv` is MIT and `yaml` is ISC.
8. Installs that job's exact tarball with scripts disabled into a fresh synthetic Git repository.
9. Imports the installed public library API and runs the packaged `validate`, `resolve`, and `pack` flows.
10. Deletes the temporary tarball and consumer without uploading an artifact.

## Matrix

| Operating system | Node 22 | Node 24 |
| --- | --- | --- |
| Ubuntu | [Passed — Node 22.23.2](https://github.com/NarcoNations/canonkit/actions/runs/32510120043/job/96858997729) | [Passed — Node 24.19.0](https://github.com/NarcoNations/canonkit/actions/runs/32510120043/job/96858997294) |
| macOS | [Passed — Node 22.23.1](https://github.com/NarcoNations/canonkit/actions/runs/32510120043/job/96858997598) | [Passed — Node 24.18.0](https://github.com/NarcoNations/canonkit/actions/runs/32510120043/job/96858997573) |

The manually dispatched [Release Rehearsal run](https://github.com/NarcoNations/canonkit/actions/runs/32510120043) passed from protected `main` at merge commit `8c440bbe21f8e2fe31a14d7017e6ee2534637ed5`. All four jobs produced 78 permitted entries and the locked manifest `762707170938ba80dbc4a56c8ded04f5427b6e5fcd4a90221493b16682685207`.

## Local evidence

The rehearsal passed on 2026-08-21 using macOS arm64 and Node.js 26 as an additional non-supported development check:

- 78 permitted package entries
- locked manifest reproduced
- exact tarball installed successfully
- library import passed
- `validate`, `resolve`, and `pack` passed
- dependency audit reported zero vulnerabilities

Supported-version evidence comes only from the GitHub matrix above; the local Node.js 26 run does not expand the supported runtime contract.

## Remaining blockers

- **RB-001 remains deferred:** authenticated npm `vibelabz` organisation ownership, MFA, recovery, and bootstrap decision.
- **RB-005 remains open:** protected trusted-publishing configuration and real provenance evidence require package ownership.
- **RB-006 is closed:** the supported operating-system and Node.js matrix reproduced and exercised the exact locked candidate in all four jobs.

The safe, non-publishing portion of Stage 5.3 is complete. Resume the ownership and protected-publishing work only when the maintainer is ready to establish the npm organisation and recovery boundary. Do not close RB-005 based on this non-publishing rehearsal.
