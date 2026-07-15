<!-- ae-codex:memory -->
# OpenCode Runtime Parity Memory

## Stable Decision

- The `codex/opencode-mode` branch is an OpenCode-only, project-local runtime distribution based on upstream commit `a144f785579698190635305fe10784b7deca9e03`.
- PDF, DOCX, XLSX, PPTX, and OfficeCLI remain end-to-end exclusions. Do not reintroduce their skills, tools, services, helpers, fixtures, dependencies, catalog entries, or help references without an explicit scope change.

## Installation Boundary

- Install only beneath `<target>/.opencode/ai-agent-engine` and activate through `<target>/.opencode/plugins/ae-server.js`.
- Treat `.ae-install-owner.json` and the exact managed bridge contents as ownership proof. Refuse to replace or delete foreign runtime directories and bridges.
- Build staging must pass `npm ci --ignore-scripts`, `npm run build`, and default-plugin import validation before activation.
- Uninstall moves an owned runtime aside before bridge removal. A bridge-removal failure restores the untouched runtime; a post-commit cleanup failure is reported as `cleanupPending` rather than attempting to restore partial data.

## Verification Boundary

- The parity manifest under `docs/ae/parity/` is the local contract for retained roots, excluded fragments, plugin hooks, and tools.
- Required delivery checks are `npm test`, `npm run test:e2e`, `npm run test:slow`, `npm run check`, a fixed-upstream comparison, and `git diff --check`.
- Legacy Codex tests are not a delivery gate for this branch when their expectations contradict OpenCode-native runtime behavior; maintain them separately as compatibility signals.
