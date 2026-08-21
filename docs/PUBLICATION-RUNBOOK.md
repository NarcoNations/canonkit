# Public-alpha publication runbook

**Current state:** preparation only. Publication, staging, tags, releases, npm authentication, and package reservation remain prohibited until Ashley explicitly approves Stage 5.4.

## Gate A — npm ownership

The maintainer must complete and record:

- control of the intended npm `vibelabz` organisation
- durable owner email and linked GitHub recovery
- WebAuthn MFA and separately stored recovery codes
- organisation-wide 2FA enforcement
- backup-owner decision or explicit acceptance of the solo-owner recovery risk
- confirmation that `@vibelabz/canonkit` can be created under that organisation

Close RB-001 only from authenticated evidence. Public registry absence is not ownership proof.

## Gate B — immutable candidate

From a protected `main` commit:

1. Run normal Node.js 22 and 24 CI and the manual four-job release rehearsal.
2. Require every rehearsal job to reproduce the locked candidate manifest.
3. Confirm the package remains `private: true` during rehearsal.
4. Review the tarball allowlist, runtime licences, dependency audit, repository URL, version, release notes, and clean synthetic installation.
5. Record the exact commit, workflow run, candidate version, manifest, and reviewer.

Any source or package-metadata change invalidates prior candidate evidence and requires a new rehearsal.

## Gate C — first-package bootstrap

A brand-new npm package cannot use staged publishing before it exists. The initial public package creation therefore requires a separately approved, interactive, 2FA-protected bootstrap using the exact rehearsed candidate.

Before that action:

- remove `private: true` only in the approved release commit
- require public scoped access and the explicit alpha distribution tag
- run the exact-candidate rehearsal again
- obtain Ashley's written approval for the named version and commit

The runnable publication command is intentionally omitted from this pre-approval document. Add and execute it only within the approved Stage 5.4 checkpoint.

## Gate D — protected publishing after bootstrap

Immediately after the initial package exists:

- configure one package-specific GitHub trusted publisher
- bind it to the exact public repository, workflow filename, and protected environment
- prefer stage-only permission so a human must review and approve with 2FA
- use GitHub-hosted runners, current supported Node and npm versions, `contents: read`, and the minimum OIDC permission
- pin third-party actions to immutable commit SHAs
- disallow routine token publishing and revoke any bootstrap credential
- verify package identity, source commit, integrity, provenance, visibility, tag, and installation from the public registry

Close RB-005 only after real registry provenance and the protected path are verified.

## Rollback and incident boundary

Do not treat deletion or unpublishing as a normal rollback. For a defective release, stop further publication, document the issue, protect users with an advisory or corrected version as appropriate, and preserve the audit trail. Suspected credential or ownership compromise follows [SECURITY.md](../SECURITY.md) and takes priority over release cadence.
