# Release Checklist

Use this before publishing a GitHub release.

1. Run syntax checks:

```bash
npm run check
node scripts/ae-tools.mjs help
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
node (Join-Path $tmp 'scripts\set-ae-language.mjs') --lang zh-CN
node (Join-Path $tmp 'scripts\set-ae-language.mjs') --lang en
Remove-Item -Recurse -Force $tmp
```

4. Confirm no reference clone is present:

```bash
ls upstream-ai-agent-engine
```

This should fail or show no directory.

5. Commit and tag:

```bash
git add .
git commit -m "feat: add Codex AI Agent Engine plugin"
git tag v0.1.0
git push origin main --tags
```
