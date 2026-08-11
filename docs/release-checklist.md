# Release Checklist

Use this before publishing a GitHub release.

1. Run syntax checks:

```bash
npm run check
node scripts/check-release-notes.mjs
node scripts/check-design-contract.mjs
node scripts/ae-tools.mjs help
node scripts/ae-tools.mjs ae-graph-build --root scripts
node scripts/ae-tools.mjs ae-graph-query --root scripts --path ae-tools.mjs
```

2. Validate skills if your local Codex skill validator is available:

```powershell
Get-ChildItem -Directory plugins\ai-agent-engine-codex\skills,.agents\skills | ForEach-Object { python "C:\Users\yaogu\.codex\skills\.system\skill-creator\scripts\quick_validate.py" $_.FullName }
```

3. Run install smoke test in a temporary project:

```powershell
$tmp = Join-Path (Get-Location) '.tmp-install-smoke'
New-Item -ItemType Directory -Force -Path $tmp | Out-Null
node scripts\install-project.mjs --target $tmp
node (Join-Path $tmp 'scripts\ae-tools.mjs') help
node (Join-Path $tmp 'scripts\check-design-contract.mjs')
Get-Content (Join-Path $tmp '.agents\skills\ae-help\agents\openai.yaml') -Encoding UTF8
node (Join-Path $tmp 'scripts\set-ae-language.mjs') --lang zh-CN
node (Join-Path $tmp 'scripts\set-ae-language.mjs') --lang en
node (Join-Path $tmp 'scripts\set-ae-language.mjs') --lang bilingual
Remove-Item -Recurse -Force $tmp
```

The default install should produce bilingual skill-list metadata, for example `AE 帮助 / AE Help`.

Before committing the release, confirm `README.md`, `README.en.md`, `CHANGELOG.md`, and `CHANGELOG.en.md` each contain the current version's level-three heading, ISO date, and change-summary bullets. Keep at most the latest five version entries in each README, move older entries to the matching changelog, and keep the README link to its changelog. `node scripts/check-release-notes.mjs` enforces this mapping but does not prove runtime or deployment acceptance.

4. Verify the multi-agent profile template and default policy:

```bash
node scripts/check-install-smoke.mjs
node --test tests/skill-scripts.test.mjs --test-name-pattern "multi-agent|auto|review_only"
```

The installed template should include `multi_agent.enabled: auto`, `mode: suggest`, `max_workers: 3`, and `allow_write_agents: false`. `enabled: auto` must report analysis and suggested waves only; write-agent auto parallelism requires explicit `mode: auto` and `allow_write_agents: true`.

5. Verify skill governance and Spec Kit-inspired workflow entries:

```bash
node scripts/check-skill-mirror.mjs
node scripts/check-skill-language-metadata.mjs
node scripts/check-design-contract.mjs
node scripts/ae-tools.mjs help constitution
node scripts/ae-tools.mjs help tasks
```

The active catalog should include `ae-constitution` and `ae-tasks`, and should not include removed OfficeCLI skills.

6. Manually verify Codex skill discoverability in a fresh Codex App thread:

```text
Open a fresh Codex thread in a project where AE is installed.
Type `/` and search for `ae-plan` and `ae-prd`.
Verify explicit `$ae-plan` and `$ae-prd` skill invocation guidance remains available.
```

This confirms the active Codex App behavior only. Do not record this as OpenCode `config.command`-style slash command registration.

7. Confirm no reference clone is present:

```bash
ls upstream-ai-agent-engine
```

This should fail or show no directory.

8. Commit and tag:

```bash
git add .
git commit -m "feat: add Codex AI Agent Engine plugin"
git tag v0.1.0
git push origin main --tags
```
