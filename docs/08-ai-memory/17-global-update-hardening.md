<!-- ae-codex:memory -->
# Global Update Hardening

This repo-specific memory records the 0.3.37 global updater hardening.

## Durable Decisions

- `ae-update` is a user-global operation. It updates the Codex runtime, personal plugin, marketplace registration, and Cursor `~/.cursor/skills/ae-*` copies; it does not update consumer project source or documents.
- The updater clones a selected release into a temporary directory, runs the cloned installer's preview, then applies using the preview operation ID and confirmation.
- Child process failures must propagate through thrown errors so the outer `finally` always removes the temporary clone. Regression fixtures cover both successful preview/apply and installer failure exit-code preservation.
- Release content changes require synchronized root/package and plugin-manifest versions plus bilingual README/CHANGELOG entries. Version `0.3.41` is the current installed release after the local 2026-09-03 update.

## Validation Boundary

- `npm run check`, `npm run check:smoke`, release-note checks, mirror checks, and updater fixture tests passed on 2026-08-30.
- The full suite reached 164 tests with 162 passing. Two symlink-escape fixtures fail before product assertions because this Windows host returns `EPERM` when creating test symlinks; this is an environment limitation, not evidence that the path guards are incorrect.
- Global installation transaction `62805a3a-f18d-4de9-a4b9-22ba2353c50c` completed from the local release worktree. The runtime and personal-plugin manifests report `0.3.39`; 40 Cursor skill copies were published, and the Cursor `ae-init` copy matched the personal-plugin source SHA-256. Already-open Codex or Cursor chats still require a new conversation to reload discovery.
- Global installation transaction `b962e201-414a-415a-bc5b-fc8042951df8` completed from the local `0.3.41` release worktree. The global runtime, personal plugin, and 40 Cursor skill copies were refreshed; help, global smoke, repository checks, and installation checks passed. The full suite remained at 166 passing tests with two Windows symlink-fixture `EPERM` failures before product assertions. Already-open Codex or Cursor chats still require a new conversation to reload discovery.
