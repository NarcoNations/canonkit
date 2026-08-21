---
schema_version: "1.1"
id: canon/example-service
kind: canon
title: Example service v2
status: active
authority: canonical
owner: product
version: "2.0"
visibility: public
scope: products/example
subjects:
  - products/example-service
relations:
  - type: part_of
    target: ecosystems/example
  - type: decided_by
    target: decisions/example-direction
supersedes:
  - canon/example-service@1.0
---
# Example service v2
