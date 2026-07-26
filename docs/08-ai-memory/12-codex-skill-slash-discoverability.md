# Codex Skill Slash Discoverability

## Stable Decision

AE for Codex should improve entrypoint discoverability through supported Codex skill metadata and descriptions, not by claiming OpenCode `config.command`-style slash command registration.

Use this phrasing in future docs and plans:

- Supported direction: "Codex skill-backed discoverability" or "enabled skills may be discoverable through Codex skill or slash search surfaces."
- Unsupported claim: "AE automatically registers Codex slash commands" unless a verified Codex API exists in the active runtime.

## Source Artifacts

- PRD: `docs/ae/prds/2026-07-07-002-codex-skill-slash-discoverability-prd.md`
- Plan: `docs/ae/plans/2026-07-07-006-codex-skill-slash-discoverability-plan.md`
- Port analysis note: `docs/codex-port-analysis.md`

## 2026-07-07 Documentation Update

README, release checklist, `ae-help`, and capability catalog wording now describe the supported boundary:

- reliable invocation remains explicit skill naming, `$ae-*`, or natural-language requests;
- enabled skills may appear in `/` or skill search surfaces depending on the active Codex App;
- runtime slash-list behavior requires manual fresh-thread verification;
- the project still does not implement OpenCode `config.command` parity.

Regression coverage lives in `tests/skill-scripts.test.mjs` under the Codex skill discoverability boundary test.

## 2026-07-07 Trigger Metadata Completion

Final implementation landed on `main` at `67896d0 feat: strengthen AE skill trigger metadata`.

The six core workflow entrypoints now carry stable trigger signals in both source and mirror forms:

- `ae-brainstorm`
- `ae-lfg`
- `ae-plan`
- `ae-prd`
- `ae-review`
- `ae-work`

For these skills:

- `SKILL.md` frontmatter includes `ae-*`, `/ae-*`, `$ae-*`, and `use ae-*` trigger forms.
- `agents/openai.yaml` display names and short descriptions include the stable `ae-*` skill name.
- `plugins/ai-agent-engine-codex/scripts/skill-language-metadata.mjs` remains the canonical generator source for language metadata.
- `tests/skill-scripts.test.mjs` includes regression coverage named `core AE workflow metadata carries stable skill trigger signals`.

Final validation before push:

```powershell
npm test
npm run check
git diff --check
```

All passed on 2026-07-07.

## Reusable Workflow

When optimizing AE skill entrypoints:

1. Treat `plugins/ai-agent-engine-codex/scripts/skill-language-metadata.mjs` as the metadata source.
2. Keep plugin source and `.agents/skills` mirror synchronized.
3. Update README/help/catalog wording with claim boundaries.
4. Add regression tests for metadata wording and unsupported runtime claims.
5. Validate with `node scripts/check-skill-mirror.mjs`, `node scripts/check-skill-language-metadata.mjs`, `node scripts/check-skill-contract.mjs`, `node scripts/check-install-smoke.mjs`, and `node scripts/check-ae-artifacts.mjs`.
6. Record manual fresh Codex thread verification separately because local file checks cannot prove the current app slash UI behavior.

## 2026-07-07 Installed Command Contract Patch

External testing after an AE update found that `ae-tools help` advertised `node scripts/check-ae-artifacts.mjs [--target <project>]`, but installed target projects did not receive that wrapper. Direct execution failed with `MODULE_NOT_FOUND`.

Durable rule: a command advertised in `plugins/ai-agent-engine-codex/skills/ae-help/references/capability-catalog.json` as `node scripts/<name>.mjs` must be installable and executable from a target project. The minimum proof is `scripts/check-install-smoke.mjs` asserting the installed path and executing the target-project wrapper.

For standalone helper scripts, use this distribution pattern:

1. Keep packaged implementation under `plugins/ai-agent-engine-codex/scripts/<name>.mjs`.
2. Keep root `scripts/<name>.mjs` as a wrapper importing the packaged implementation.
3. Have `scripts/install-project.mjs` generate the same wrapper in target projects.
4. Add the command to `scripts/check-install-smoke.mjs` `expectedPaths`, execute it from the installed target root, and include it in `verifiedCommands`.
5. Add plugin script syntax coverage to `npm run check`.

## Boundary

Do not implement deprecated prompt shims as the primary path for AE workflow entrypoints. Do not add MCP auto-loading, hooks, global config propagation, or always-on agent registries to simulate command registration.

## Archive

- PRD: `docs/ae/prds/2026-07-07-002-codex-skill-slash-discoverability-prd.md`
- Plan: `docs/ae/plans/2026-07-07-006-codex-skill-slash-discoverability-plan.md`
- Experience: `docs/ae/experience/2026-07-07-codex-skill-slash-discoverability.md`
- Installed command wrapper experience: `docs/ae/experience/2026-07-07-check-ae-artifacts-install-wrapper.md`
- Process archive: `docs/00-process/archive/2026-07/codex-skill-slash-discoverability/progress.md`
- Installed command wrapper archive: `docs/00-process/archive/2026-07/check-ae-artifacts-install-wrapper/progress.md`
