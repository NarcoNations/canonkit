# Examples

`basic/` contains the smallest useful synthetic CanonKit document. Run it from the repository root:

```sh
npm run build
node dist/cli.js validate examples/basic
node dist/cli.js list examples/basic
node dist/cli.js resolve products/example-service examples/basic
node dist/cli.js pack examples/basic
```

The commands are read-only. `pack` emits the Markdown body, marked as untrusted content; the other commands operate on validated governance metadata.

`github-actions/canonkit.yml` is an inactive, public-only validation template for use after the scoped alpha is published. See [`docs/QUICKSTART.md`](../docs/QUICKSTART.md) before copying it into a repository.
