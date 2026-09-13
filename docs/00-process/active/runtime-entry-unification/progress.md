# Runtime Entry Unification

## Latest Delivery Status

用户管理员终端完整输出：185 pass、0 fail、2 skipped；符号链接安全测试通过，PowerShell 两项跳过。此前代理聚焦测试覆盖这两项。当前无已知功能失败，保留单次完整零跳过验证缺口；本记录维持 active，不伪造全量完成。Cursor 已独立同步 0.3.46 的 40 技能/133 文件，14 技能变更，真实 UI 加载未验证。最新证据见 `docs/ae/experience/2026-09-13-instruction-runtime-delivery.md`；下文是历史执行记录。

- Scope: audit F-004, shared runtime entry resolution and active examples/help.
- Branch: user-approved main; preserve prior 0.3.45 uncommitted changes.
- Plan: `docs/ae/plans/2026-09-13-001-runtime-entry-unification-plan.md`.
- Requirements/document review: confirmed inline; reviewer and architect self-review have no blocking findings.
- U1 complete: standalone read-only resolver and shared bootstrap; local priority, missing/invalid entry and dangling parent covered.
- U2 complete: 13 command-bearing Markdown files and catalog migrated; help binds its actual invocation entry with shell-safe assignments.
- Verified checkpoint: 13 runtime-entry tests passed, including PowerShell and Git Bash execution, consumer install and isolated global install with fake Codex registration. No shell checks skipped in this run.
- U3 implementation complete: 0.3.46 versions and bilingual releases synchronized; 55 focused tests pass, check and standard smoke pass. Full suite is 185 passed / 2 EPERM fixture failures / 0 skipped.
- Final review: `docs/ae/reviews/2026-09-13-runtime-entry-unification-review.md`; no blocking task-diff findings.
- Final gate: `docs/ae/gates/2026-09-13-runtime-entry-unification-final.json`, partial / environment-blocked for full-suite release readiness.
- Current step: implementation delivered with explicit validation gap; retain this active note until the full-suite environment gate is resolved.
- Known boundary: prior full suite had two Windows file-symlink EPERM fixture failures; no real-model metrics or global installation requested.
- Remaining: rerun the full suite in an environment permitting file symlinks. No repeated retries, no security-test edits, no commit or push.

## Permission Recheck: 2026-09-13

- User authorized another full run and conditionally permitted a global install. No global install was performed: the observed failure occurs at Windows file-symlink creation before plugin assertions.
- `whoami /priv` did not list `SeCreateSymbolicLinkPrivilege`; this is current-process evidence, not a claim about every terminal on the PC.
- The two focused failing tests were rerun and both still failed with EPERM. An additional in-project temporary-directory probe was rejected by the execution policy before running; it provides no filesystem result and was not retried through another mechanism.
- WSL reported that Windows Subsystem for Linux is not installed. No system setting, elevated process or alternate runtime was installed.
- `npm.cmd test`, with the existing Git Bash explicitly selected by `AE_TEST_POSIX_SHELL`, completed again: 187 tests, 185 passed, 2 failed, 0 skipped, exit code 1. Both failures remain at `tests/ae-tools.test.mjs:1490` and `tests/ae-tools.test.mjs:1520` during fixture creation.
- Full-suite release gate remains environment-blocked. Next action requires a process with file-symlink capability; conversational authorization did not change the current process privilege list. Source and tests remain unchanged in this recheck.
