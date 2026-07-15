# AI Agent Engine for OpenCode

`codex/opencode-mode` is the dedicated OpenCode branch. It is maintained independently and is not merged into `main` or `codebuddy`.

## Runtime

This branch carries a project-local OpenCode plugin runtime based on upstream Gitee commit `a144f785579698190635305fe10784b7deca9e03`, with OpenCode plugin/SDK compatibility updated to `1.18.1`.

Included runtime capabilities:

- dynamic commands, agents, skills, rules, MCP registration, and model routing;
- image, audio, and video understanding with media fallback hooks;
- persistent project graph build/query, freshness, sharding, and preview assets;
- browser DevTools MCP, sessions, handoff, API testing, Swagger, SQL, review, and engineering workflows.

Intentionally excluded end to end:

- PDF;
- DOCX;
- XLSX;
- PPTX;
- OfficeCLI.

Excluded capabilities are absent from skills, schemas, tools, services, dependencies, command/help registration, and installed project runtimes.

## Project Install

```powershell
git clone --depth 1 --branch codex/opencode-mode https://github.com/YaoGUanquan/codex-ai-agent-engine.git "$env:TEMP\ae-opencode"
node "$env:TEMP\ae-opencode\scripts\install-project.mjs" --target "D:\codes\your-project"
```

The installer copies source into a target-local staging directory, runs `npm ci --ignore-scripts` and the reviewed build, then activates:

```text
<project>/.opencode/ai-agent-engine
<project>/.opencode/plugins/ae-server.js
```

The bridge is written last. A failed update restores the previous runtime and bridge. The installer does not write global OpenCode configuration and does not execute `git reset`, `git clean`, or `git pull`.

Restart OpenCode after install or update, then run `/ae-help`.

## Verification

```powershell
npm ci --ignore-scripts
npm run build
npm test
npm run test:e2e
npm run check
```

`npm run check` includes project installation, exclusion, activation rollback, and uninstall smoke checks.
