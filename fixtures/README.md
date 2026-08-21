# Fixtures

All fixtures are synthetic, neutral, and safe to publish. Private or organisation-specific material must never be used here.

`metadata/valid/` contains minimal and complete JSON examples that the public schema must accept. `metadata/invalid/` contains one isolated contract failure for every required field and enum, plus an unsupported schema version. `expectations.json` records the exact validation keyword and location each invalid fixture must trigger.

The JSON fixtures test the metadata contract independently from Markdown parsing. Repository fixtures will be added with the discovery task.

`frontmatter/valid/` contains bounded Markdown examples for the minimal and complete contracts. `frontmatter/invalid/` covers missing, malformed, repeated, and unsupported-version envelopes. All document bodies are synthetic and are treated as untrusted content by parser tests.

`repository/` contains an inert synthetic directory tree for discovery tests. Tests copy it into a temporary Git boundary and add runtime-only symlink and nested-repository cases. Dependency and generated-output folders verify the default exclusions.

`collection/` combines valid and independently invalid Markdown neighbours. It proves that a scan returns every valid normalised document while preserving diagnostics for missing, malformed, and unsupported metadata.

`policy/` proves document-level ownership, review, authority, and visibility rules. `relationships/` contains one valid supersession chain and isolated failures for missing targets, self-supersession, cycles, invalid lifecycle state, and multiple active versions.

`graph/` is a validated neutral repository used to prove deterministic document, version, subject, supersession, relation, and eligibility indexes without exposing Markdown bodies.
