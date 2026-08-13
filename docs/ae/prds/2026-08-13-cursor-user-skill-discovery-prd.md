---
type: prd
status: review-passed
date: 2026-08-13
topic: cursor-user-skill-discovery
format: human-readable-requirements
sharded: false
---

# Cursor User-Level AE Skill Discovery

## AI Parse Contract

- canonicalKind: requirements
- humanEquivalent: true
- stableIdsRequired: true
- noImplicitScope: true

## Problem Frame

The current-user global installer publishes `ai-agent-engine-codex@personal` for Codex. Cursor does not load that Codex plugin. After source-repository skills moved from `.agents/skills` to `.ae-source/skills`, Cursor also lost its previous project-local discovery path. The required outcome is one global apply that leaves Codex and Cursor both able to invoke the same AE skills for the current operating-system user, without restoring a Codex-visible skill mirror that would duplicate the personal plugin.

## Requirements

**Dual-client discovery**

- R1. A completed global apply for the current user shall leave Codex discovering AE skills through the existing personal marketplace plugin and shall not recreate `$HOME/.agents/skills/ae-*` or restore the distribution-source `.agents/skills` mirror.
  Acceptance: after apply, `codex plugin list` still reports `ai-agent-engine-codex@personal` installed and enabled; `$HOME/.agents/skills` contains no installer-created `ae-*` directories; the distribution source keeps `.ae-source/skills`.
- R2. The same apply shall publish a Cursor user-level discovery surface at `$HOME/.cursor/skills/<skill-name>` for every current-release `ae-*` skill.
  Acceptance: an isolated-home fixture contains one managed entry per current plugin skill directory, and a new Cursor chat in an arbitrary project can resolve those skills. File checks prove the filesystem surface; slash-UI listing requires a manual fresh Cursor thread.
- R3. Each Cursor skill entry shall be a directory junction on Windows or a directory symbolic link on other platforms whose resolved target is exactly `$HOME/plugins/ai-agent-engine-codex/skills/<skill-name>`. The installer shall not copy skill file contents into the Cursor skill tree.
  Acceptance: `realpath` of each managed Cursor skill equals the matching personal-plugin skill directory; the Cursor tree contains no duplicated `SKILL.md` payload owned as a separate copy.

**Installer contract**

- R4. Preview shall classify each current-release Cursor skill entry as current-release verified, historical-release verified, modified, missing, or excluded, and the confirmation digest shall bind that classification plus any `--retire-modified` authorization.
  Acceptance: a fixture with matching links, missing links, and one modified `ae-*` entry is distinguishable in preview JSON without writes.
- R5. Apply shall create, replace, or remove only installer-owned `ae-*` entries under `$HOME/.cursor/skills`, and only after the personal plugin source for that release is in place. Skill names that leave the release shall be removed only when they are installer-owned.
  Acceptance: a fixture that upgrades from a smaller skill set to the current set adds new links, removes retired installer-owned `ae-*` links, and leaves non-`ae-*` Cursor skills unchanged.
- R6. A modified, unknown, or unlisted `ae-*` path under `$HOME/.cursor/skills` shall block apply unless `--retire-modified` is present and bound by the confirmation digest. Unrelated Cursor skills shall never be backed up, replaced, or deleted.
  Acceptance: an altered `ae-*` fixture fails preflight with no home mutation; a neighboring `~/.cursor/skills/other-skill` hash is unchanged on both blocked and successful apply.
- R7. Cursor skill-link publication shall share the existing installer-owned transaction. File-system failure or Codex CLI registration failure shall roll back the Cursor links together with other installer-owned files.
  Acceptance: injected failure after link creation and injected Codex CLI failure both restore the pre-apply Cursor skill state recorded in the journal.

## Non-Functional Requirements

- NFR1. The installer shall never scan, modify, or infer another user's home directory, and shall never write `$HOME/.cursor/skills-cursor`.
  Acceptance: a foreign-home fixture fails before writes; a skills-cursor fixture hash is unchanged.
- NFR2. Default behavior remains preview-only; apply still requires `--apply`, an operation id, and a confirmation digest.
  Acceptance: invocation without all apply confirmations does not create Cursor links.
- NFR3. Plugin source trees continue to reject symbolic links as managed content. Cursor skill entries are the only installer-created links, and each target must stay inside the current user's personal plugin skill directory.
  Acceptance: a link whose target escapes the personal plugin skill root is rejected before writes.
- NFR4. Distribution checks shall cover link creation, target confinement, unrelated-skill preservation, modified-entry blocking, and rollback. They shall not claim that a specific Cursor app slash palette refreshed without a manual fresh thread.
  Acceptance: automated tests use an isolated home; README/CHANGELOG state the Cursor-thread verification boundary.

## Must-Haves

- Requirement ID: R2
  Must-have completion condition: after apply, `$HOME/.cursor/skills` contains a managed entry for every current `ae-*` skill.
- Requirement ID: R3
  Must-have completion condition: those entries resolve to the personal plugin skill directories and are not content copies.
- Requirement ID: R1
  Must-have completion condition: Codex personal-plugin discovery remains the only Codex skill surface created by apply.
- Requirement ID: R6
  Must-have completion condition: unknown or modified Cursor `ae-*` entries cannot be silently replaced.

## Success Criteria

- One current-user global apply makes AE skills available to a newly opened Codex task and a newly opened Cursor chat on that machine.
- Cursor discovery does not require a project-local `.agents/skills` or `.cursor/skills` tree in consumer repositories.
- Codex does not list a second copy of AE skills from `$HOME/.agents/skills` or the distribution-source maintenance mirror.
- A later apply upgrades Cursor links to the new personal-plugin skill set without deleting unrelated user Cursor skills.

## Scope Boundary

### In Scope

- Extending the current-user global installer and its contract, journals, backups, preview classification, rollback, tests, and user-facing install documentation.

### Out Of Scope

- Publishing a Cursor marketplace plugin or a second plugin manifest format.
- Restoring `.agents/skills` in the distribution source repository.
- Recreating `$HOME/.agents/skills` as a shared Codex/Cursor discovery tree.
- Per-project Cursor skill installation for consumer repositories.
- Writing Codex or Cursor private caches.
- Changing skill bodies except as required to describe the dual discovery surface.

### Constraints

- Existing foreign-home, confirmation-digest, `--retire-modified`, and recovery-failed protections remain mandatory.
- Windows link creation must use a directory junction that does not require administrator rights when Node's `junction` type is available.
- Skill discovery in both clients is evaluated at session start; already-open chats are outside automated proof.

## Key Decisions

- D1. Keep Codex on the personal marketplace plugin and add a Cursor-only user skill surface.
  Reason: Cursor does not load Codex plugins; restoring `.agents/skills` would duplicate Codex discovery.
- D2. Use junctions or directory symlinks to the personal plugin skills, not a third content copy.
  Reason: the user selected this to avoid another hashed skill tree; upgrades follow the personal plugin content.
- D3. Own only `ae-*` names under `$HOME/.cursor/skills`.
  Reason: users may already have unrelated personal Cursor skills.
- D4. Reuse `--retire-modified` for unknown or changed Cursor `ae-*` entries.
  Reason: the global installer already uses that authorization for other user-owned AE components.

## Dependencies And Assumptions

### Dependencies

- Cursor discovers user skills from `$HOME/.cursor/skills/<name>/SKILL.md`.
- Node can create a Windows directory junction without administrator rights.

### Assumptions

- A new Cursor chat after apply is sufficient for the user to observe `/ae-*`; an already-open Cursor session may keep its startup catalog.
- Consumer projects migrated off project-local AE skills remain without `.agents/skills`; this change does not reintroduce those copies.

## Open Questions

### Must Resolve Before Planning

- None. The user selected user-level Cursor discovery, junctions instead of copies, and the existing `--retire-modified` gate.

### Deferred To Planning

- None.

## Evidence Notes

- Codex personal plugin is already installed and enabled at 0.3.28 -> Evidence: `codex plugin list` on 2026-08-13.
- This Cursor session has no `ae-*` skills in its discovery list -> Evidence: current agent skill catalog in the 2026-08-13 Cursor thread.
- Distribution source no longer has `.agents/skills` -> Evidence: commit `28a8a6e` and `docs/08-ai-memory/04-known-pitfalls.md`.
- Cursor's documented personal skill root is `~/.cursor/skills/` and `~/.cursor/skills-cursor/` is reserved -> Evidence: Cursor create-skill guidance.

## Consistency Check

- requirementsCount: 7
- nonFunctionalRequirementsCount: 4
- decisionsCount: 4
- openQuestionsCount: 0
