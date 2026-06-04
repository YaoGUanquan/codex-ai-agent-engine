---
name: ae-swagger-parser
description: Use when the user asks to inspect, summarize, filter, or explain Swagger/OpenAPI JSON or YAML, or uses /ae-swagger-parser, Swagger, OpenAPI, interface summary, API contract summary, method:, path:, tag:, keyword:, or mode:detail.
---

# AE Swagger Parser

Summarize or inspect Swagger/OpenAPI specs without calling business APIs.

## Workflow

1. Parse arguments: source path or URL, optional `method:`, `path:`, `tag:`, `keyword:`, `mode:overview|detail`.
2. For local files, run:

```powershell
node scripts/ae-tools.mjs swagger <source> method:POST keyword:login mode:detail
```

3. For remote URLs, use Codex network/browsing approval rules. Do not fetch remote specs with shell unless authorized.
4. Return endpoint overview or detail summary. Do not call business endpoints.

## Boundaries

- Local JSON, YAML, and YML specs are supported without extra dependencies.
- Local internal JSON Pointer `$ref` values such as `#/components/schemas/User` are resolved for summary output.
- Remote URLs still follow Codex network/browsing approval rules. Do not fetch remote specs with shell unless authorized.
- Swagger UI HTML pages are not specs. Ask for the actual JSON/YAML URL.
- Do not generate SDKs, tests, or client code unless separately requested.
