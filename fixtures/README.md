# Fixtures

All fixtures are synthetic, neutral, and safe to publish. Private or organisation-specific material must never be used here.

`metadata/valid/` contains minimal and complete JSON examples that the public schema must accept. `metadata/invalid/` contains one isolated contract failure for every required field and enum, plus an unsupported schema version. `expectations.json` records the exact validation keyword and location each invalid fixture must trigger.

The JSON fixtures test the metadata contract without introducing Markdown parsing. Repository and frontmatter fixtures will be added with their corresponding Stage 1 tasks.
