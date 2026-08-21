# Public package identity review

- **Decision date:** 2026-08-21
- **Product:** CanonKit
- **Positioning:** Govern what becomes authoritative.
- **Product relationship:** CanonKit is an independently branded open-source VibeLabz product and is technically independent of FABRIC.
- **Selected public package candidate:** `@vibelabz/canonkit`
- **CLI binary:** `canonkit`
- **Initial version:** `0.1.0-alpha.0`
- **Publication status:** prohibited until the authenticated ownership and release gates close

This decision does not rename the product, create a multi-package architecture, claim an npm scope, authenticate npm, publish a package, or tag a release.

## Current evidence

The following checks were performed against the public npm registry on 2026-08-21:

| Candidate | Public registry result | Operational result |
| --- | --- | --- |
| `canonkit` | Exists at version `0.2.0`; describes a different AI-assisted canonical-guidance project and links to a different source repository | Unavailable. Installing it would run unrelated third-party code and create severe brand confusion. It must never appear as this project's install command. |
| `@canonkit/canonkit` | No public package returned by the registry; public scoped-package search returned no packages in `@canonkit` | Package name is publicly unused, but unauthenticated registry results do not prove that the organisation scope can be claimed or that it has no private packages. |
| `@vibelabz/canonkit` | No public package returned by the registry; public scoped-package search returned no packages in `@vibelabz` | Package name is publicly unused, but authenticated organisation creation or owner access is still required to prove control of the scope. |

Primary evidence and rules:

- [public registry record for the unrelated unscoped package](https://registry.npmjs.org/canonkit)
- [npm scopes](https://docs.npmjs.com/about-scopes/)
- [npm organisations and public-package plans](https://docs.npmjs.com/organizations/)
- [npm organisation creation](https://docs.npmjs.com/creating-an-organization/)
- [npm name and squatting policy](https://docs.npmjs.com/policies/disputes/)

An npm package-level `404` means only that no caller-visible package exists at that exact name. It is not evidence that an organisation name is available. Npm explicitly allows paid organisations to have private packages that are invisible publicly, and organisation names are first-come, first-served. The availability of `vibelabz` must therefore be confirmed from an authenticated maintainer account by creating the organisation or proving owner access.

Npm also prohibits claiming names merely to reserve them. Create the `vibelabz` organisation only as an immediate release-readiness action with a real public package following through the approved Stage 5.4 flow; do not create `canonkit` as a speculative defensive scope.

## Decision

`@vibelabz/canonkit` is the selected public-package candidate, subject to authenticated ownership verification and Ashley's final release approval.

Why:

- It expresses the agreed public relationship: **CanonKit — from VibeLabz**.
- It removes any implication that NarcoNations owns the public package.
- It preserves the product name and the `canonkit` executable.
- It supports one durable VibeLabz organisation with enforced security and recovery controls.
- It leaves room for future VibeLabz packages without asserting that CanonKit itself needs multiple packages.
- It avoids the redundant `@canonkit/canonkit` form and the operational burden of a second npm organisation created only for one current package.

An independent `@canonkit` organisation may become preferable later only if real evidence shows that CanonKit needs independent multi-maintainer governance or multiple genuinely separate packages. That evidence does not exist for the single-package alpha. No `@canonkit/core` package is proposed.

`@narconations/canonkit` remains historical/transitional build infrastructure only. It is not an approved public identity and must not be published.

## Ownership and recovery gate

Before release rehearsal can treat the selected identity as operationally controlled, record evidence that:

1. Ashley owns or has created the npm `vibelabz` organisation and can access its settings.
2. The owning npm account uses a current, controlled email address and is linked to the correct GitHub account where useful for recovery.
3. Phishing-resistant WebAuthn MFA is enabled on every owner account.
4. Organisation-wide 2FA enforcement is enabled.
5. Recovery codes are regenerated, stored offline in a controlled location, and tested procedurally without exposing them to the repository or logs.
6. At least one recovery path exists if the primary device is lost. A second trusted organisation owner is preferred; if a solo-owner model is retained, the residual account-loss risk must be explicitly accepted.
7. `@vibelabz/canonkit` is visible to the owner as the intended new public package identity before any bootstrap publish.

Relevant npm controls:

- [configure 2FA](https://docs.npmjs.com/configuring-two-factor-authentication/)
- [require 2FA across an organisation](https://docs.npmjs.com/requiring-two-factor-authentication-in-your-organization/)
- [recover a 2FA-enabled account](https://docs.npmjs.com/recovering-your-2fa-enabled-account/)
- [require 2FA for publishing and settings changes](https://docs.npmjs.com/requiring-2fa-for-package-publishing-and-settings-modification/)

Never commit account details, recovery codes, security-key identifiers, session material, or access tokens as evidence. A dated pass/fail checklist is sufficient.

## Trusted publishing and provenance

Scope choice does not weaken or replace the release controls. The package must use npm trusted publishing from a specific protected GitHub Actions workflow with `id-token: write`, `contents: read`, a GitHub-hosted runner, and no routine npm token. Trusted publishing requires a current npm CLI and automatically creates provenance for a public package built from a public repository.

The `repository.url` in `package.json` must exactly match the GitHub source repository used by the publishing workflow. The current `NarcoNations/canonkit` URL is therefore retained as the transparent source/provenance host until an explicitly approved repository transfer occurs; it is not the npm package namespace or product-ownership statement.

See [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/) and [npm provenance](https://docs.npmjs.com/generating-provenance-statements/).

## Exact next action

Use Ashley's npm account in the npm website to test whether the `vibelabz` organisation can be created or is already controlled. If control is verified, complete the ownership and recovery checklist above before adding the protected release workflow. If `vibelabz` cannot be claimed, stop and return to this decision with evidence; do not silently fall back to NarcoNations or create `@canonkit/core`.
