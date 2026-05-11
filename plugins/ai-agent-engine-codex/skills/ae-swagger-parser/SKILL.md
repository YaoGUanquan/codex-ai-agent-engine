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

- JSON is supported with no dependencies.
- YAML support depends on a local `yaml` package. If unavailable, ask for JSON or install only with user approval.
- Swagger UI HTML pages are not specs. Ask for the actual JSON/YAML URL.
- Do not generate SDKs, tests, or client code unless separately requested.
