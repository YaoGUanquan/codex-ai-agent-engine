# Release Checklist

Use this before publishing a GitHub release of the skill collection.

1. Install dependencies and run the full local gate:

```bash
npm install
npm test
npm run check
npm run check:smoke
git diff --check
```

`npm run check` already runs `tools/validate.mjs`, `tools/check-repository.mjs`, `tools/check-release-notes.mjs`, and `tools/check-public-content.mjs`.

2. Confirm package contract:

- `package.json` `version` matches the new changelog heading (SemVer).
- `files` whitelist is only `skills/`, `LICENSE`, `NOTICE.md`.
- `skills/` contains exactly: `ae-grill`, `ae-frontend`, `ae-backend`, `ae-unit-test`, `ae-integration-test`, `ae-e2e-test`, `ae-e2e-suite`.
- No retired roots: `plugins/`, `scripts/` installers, `.ae-source`, `.agents/skills` as a distribute source.

3. Confirm docs:

- `README.md` / `README.en.md` each have a level-three `### <version>（date）` / `### <version> (date)` entry and link to their changelog.
- Each README keeps at most five version entries; older entries live only in `CHANGELOG.md` / `CHANGELOG.en.md`.
- `INSTALL.md` / `INSTALL.zh-CN.md`, `AGENTS.md`, `NOTICE.md`, `.cursorrules` describe the skills CLI install path (not legacy installers).
- No personal machine paths in tracked files (`npm run check` / public-content).

4. Optional isolated layout check (also covered by `check:smoke` when implemented):

```bash
# Copy each skills/<name> into a temp dir and confirm SKILL.md + references resolve
# Then install via: npx skills add <path-or-repo> -l
npx skills add YaoGUanquan/codex-ai-agent-engine -l
```

5. CI matrix:

- Keep Windows / Linux / macOS and Node 20 / 22 jobs.
- Keep a stable CI result gate name; do not rename checks casually.

6. Manually spot-check host discovery in a fresh thread (optional, not a CI substitute):

```text
After installing with the skills CLI, open a fresh host thread.
Confirm the seven ae-* skills are listed and that retired plugin skills are absent.
Explicitly invoke one skill (for example $ae-grill) and confirm it loads.
```

7. Confirm no upstream clone directory is tracked:

```bash
ls upstream-ai-agent-engine
```

This should fail or show no directory.

8. Commit, tag, and publish only with explicit human authorization. This checklist is not authorization to push, merge, or release.
