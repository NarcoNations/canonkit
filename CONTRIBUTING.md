# Contributing

CanonKit is preparing its first public alpha. Contributions are welcome within the current local-first, deterministic, read-only product boundary.

All participation must follow the [Code of Conduct](./CODE_OF_CONDUCT.md).

Before proposing a change:

1. Keep the core local-first and dependency-light.
2. Preserve deterministic behaviour and explainable results.
3. Use synthetic fixtures only.
4. Do not include private, customer-specific, or proprietary source material.
5. Add focused tests for public-contract, policy, diagnostic, or process changes.
6. Read the [support boundary](./SUPPORT.md) and [maintenance model](./docs/MAINTENANCE.md).

Please use GitHub issues for bugs and bounded proposals. Security issues must follow [SECURITY.md](./SECURITY.md).

## Development

CanonKit requires Node.js 22 or newer:

```sh
npm ci
npm run check
```

Open a focused pull request using the repository template. Explain the observable change, verification performed, compatibility impact, and any contract or security boundary affected. A proposal or accepted issue does not itself change CanonKit's public contract.
