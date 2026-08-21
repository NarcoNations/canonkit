# Repository discovery contract

Stage 1.4 exposes `discoverMarkdownFiles(startPath, options)` from the package root. It discovers eligible Markdown paths only; reading and parsing those documents into a collection belongs to Stage 1.5.

```ts
import { discoverMarkdownFiles } from '@narconations/canonkit';

const result = await discoverMarkdownFiles('./docs', {
  includePaths: ['docs', 'decisions'],
  excludePaths: ['docs/archive'],
  maxDocuments: 10_000,
});

if (result.ok) {
  console.log(result.repositoryRoot);
  console.log(result.files);
} else {
  console.error(result.diagnostics);
}
```

## Boundary and eligibility

- The explicit start path must exist inside a Git repository.
- The nearest ancestor with a `.git` file or directory becomes the repository boundary.
- Without `includePaths`, discovery scans the explicit file or directory only.
- `includePaths` and `excludePaths` are repository-relative and may not escape with absolute or parent paths.
- Eligible filenames end in `.md` or `.markdown`, case-insensitively.
- Results include canonical absolute paths and portable repository-relative paths.
- Results and scan roots use deterministic ordinal ordering.
- Overlapping include roots are deduplicated.

The default document limit is 10,000. Exceeding it fails without returning a partial collection. Invalid limits and malformed excluded-directory names are caller configuration errors and throw `RangeError` or `TypeError`.

## Exclusions and symlinks

These directory names are always excluded wherever they appear:

```text
.git  .next  .vercel  build  coverage  dist  node_modules  vendor
```

Callers may add directory names with `excludedDirectoryNames` and repository-relative subtrees with `excludePaths`. Default exclusions cannot be removed.

Directory traversal never follows symbolic-link entries, including links whose target remains inside the repository. Explicit configured paths are canonicalised and must resolve inside the same repository. Nested Git repositories and submodules are not traversed.

## Diagnostic codes

| Code | Meaning |
| --- | --- |
| `CKD001_START_PATH_NOT_FOUND` | The start or configured include path does not exist |
| `CKD002_REPOSITORY_NOT_FOUND` | No Git repository boundary was found |
| `CKD003_PATH_OUTSIDE_REPOSITORY` | A configured path is absolute or escapes the boundary |
| `CKD004_IO_ERROR` | A filesystem operation failed |
| `CKD005_DOCUMENT_LIMIT_EXCEEDED` | More eligible documents were found than allowed |

Discovery performs no writes, network requests, document parsing, authority inference, or policy evaluation.
