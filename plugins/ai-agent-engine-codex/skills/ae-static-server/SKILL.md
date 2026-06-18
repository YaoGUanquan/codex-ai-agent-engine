---
name: ae-static-server
description: Use when the user asks to preview, serve, or open a local static HTML file or static asset directory from the workspace. Provides a lightweight local HTTP server entrypoint and dry-run URL planning.
---

# AE Static Server

Serve a local static file or directory for browser preview.

## Workflow

1. Confirm the target file or directory is inside the current workspace.
2. For URL planning without starting a long-running process, run:

```powershell
node scripts/ae-tools.mjs static-server <file-or-directory> --port 4173 --dry-run
```

3. To start a preview server, run without `--dry-run`:

```powershell
node scripts/ae-tools.mjs static-server <file-or-directory> --port 4173
```

4. Keep the process running only when the user needs a live preview. If browser validation is required, route to `ae-test-browser` after the server URL is available.

## Boundaries

- Local workspace paths only.
- Static file serving only; no API proxy, live reload, TLS, auth, or production hosting.
- Prefer existing project dev servers for framework apps. Use this skill for simple HTML/static artifacts.
- Do not leave background server processes running after validation unless the user explicitly wants the preview to remain available.

