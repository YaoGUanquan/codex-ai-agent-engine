You are assisting Codex with a read-only code/document review.

Scope:
- Review the current Git diff in this repository only.
- Focus on these changed areas: PRD/plan artifact contract guidance, `scripts/check-ae-artifacts.mjs`, `tests/skill-scripts.test.mjs`, `ae-skill-audit`, capability catalog source commit, and related docs/memory.
- The implementation follows `docs/ae/plans/2026-06-24-001-upstream-ae-skill-optimization-plan.md`.
- Optional graph skill promotion G1 is deliberately deferred; do not require new graph skills.

Forbidden:
- Do not write files.
- Do not run destructive commands.
- Do not suggest vendoring upstream OpenCode runtime behavior.
- Do not assume strict artifact mode must pass existing legacy artifacts; compatibility mode is the default gate.

Validation already observed by Codex:
- `npm.cmd test`: 49 tests pass.
- `npm.cmd run check`: pass.
- `node scripts/check-skill-mirror.mjs`: pass.
- `node scripts/check-skill-language-metadata.mjs`: pass.
- `node scripts/check-install-smoke.mjs`: pass.
- `node scripts/check-ae-artifacts.mjs`: pass.
- `node scripts/check-ae-artifacts.mjs --strict`: fails on legacy PRD/plan files missing `format` and `sharded`, expected migration signal.
- `git diff --check`: pass.
- `git ls-remote https://gitee.com/jiangqiang1996/ai-agent-engine HEAD`: `b50ca004a6b4300f4ad5d8d281bcb17d4be1b392`.

Return:
1. Findings with severity, file/path, evidence, impact, and concrete fix.
2. False-positive or no-issue notes if relevant.
3. Additional validation commands worth running.
