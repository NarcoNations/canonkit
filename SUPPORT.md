# Support

CanonKit is an unreleased alpha candidate maintained on a best-effort basis. There is currently no service-level agreement, guaranteed response time, hosted service, or paid support channel.

## Where to ask

- Reproducible bugs: use the GitHub bug-report form.
- Bounded product proposals: use the feature-request form.
- Security vulnerabilities: report privately through GitHub's **Report a vulnerability** flow as described in [SECURITY.md](./SECURITY.md).
- General implementation questions: open a public issue only when the question and reproduction contain no sensitive material.

## What maintainers can investigate

Provide the exact CanonKit version or commit, operating system, Node.js version, command, expected result, actual result, and a minimal synthetic or public reproduction.

Maintainers cannot safely investigate reports that require private repository access, customer documents, credentials, unrestricted context packs, or confidential logs. Reduce the issue to neutral material before sharing it publicly.

## Compatibility boundary

The supported runtime target for the alpha is Node.js 22 and 24 on Ubuntu and macOS. Windows and other Node.js versions may work but are not currently asserted release targets. Versioned schemas and output envelopes document compatibility; breaking changes may still occur before `1.0.0` and will be recorded in the changelog and release notes.
