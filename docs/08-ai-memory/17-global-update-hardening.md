<!-- ae-codex:memory -->
# Global Update Hardening

This repo-specific memory records the 0.3.37 global updater hardening.

## Durable Decisions

- `ae-update` is a user-global operation. It updates the Codex runtime, personal plugin, marketplace registration, and Cursor `~/.cursor/skills/ae-*` copies; it does not update consumer project source or documents.
- The updater clones a selected release into a temporary directory, runs the cloned installer's preview, then applies using the preview operation ID and confirmation.
- Child process failures must propagate through thrown errors so the outer `finally` always removes the temporary clone. Regression fixtures cover both successful preview/apply and installer failure exit-code preservation.
- Release content changes require synchronized root/package and plugin-manifest versions plus bilingual README/CHANGELOG entries. Version `0.3.37` is the current installed release.

## Validation Boundary

- `npm run check`, `npm run check:smoke`, release-note checks, mirror checks, and updater fixture tests passed on 2026-08-30.
- The full suite reached 164 tests with 162 passing. Two symlink-escape fixtures fail before product assertions because this Windows host returns `EPERM` when creating test symlinks; this is an environment limitation, not evidence that the path guards are incorrect.
- Global installation transaction `9234cc16-851d-40ca-8d0a-40da987eb2e3` completed, and installed Codex/Cursor copies report `0.3.37`.
