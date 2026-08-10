# Global AE Install Contract

## Boundaries

- The private dispatcher is `$HOME/.agents/ai-agent-engine-codex`; it stores distribution code, operation journals, and backups only.
- The Codex-visible plugin source is `$HOME/plugins/ai-agent-engine-codex`, and the default personal marketplace is `$HOME/.agents/plugins/marketplace.json`.
- The installer explicitly registers the current user's `$HOME` marketplace root through `codex plugin marketplace add $HOME --json`; Codex resolves the managed `$HOME/.agents/plugins/marketplace.json` from that root, then publishes the personal plugin through `codex plugin add ai-agent-engine-codex@personal --json`. It never writes the private Codex cache.
- A `recovery-failed` operation retains its journal and backup and cannot be purged. It must first be recovered to `rolled-back`.
- Project `AGENTS.md`, `docs/**`, memory registries, graphs, and archives remain in each project root. They are neither copied nor removed by migration.
- Each operating-system user runs the installer against their own home directory and explicitly supplies or confirms their own project manifest. The installer never scans another user's home directory.

## Lifecycle

1. `preview` inspects a manifest without writing files and emits a confirmation digest.
2. `apply --apply --operation <uuid> --confirm <digest>` revalidates all paths and fingerprints, stages the runtime, cleans only verified consumer components, publishes the personal plugin, then asks Codex to install it. `--retire-modified` is a separate authorization to back up and retire modified or unknown AE components; the confirmation digest binds that authorization.
3. A file-system stage failure reverses the complete installer-owned batch. If the Codex CLI registration command fails, the installer rolls back its published files and preserves the journal, but only Codex owns any client-side registration state. An interrupted operation must be recovered before a later apply.
4. Terminal-operation backups and journals remain available. `purge --operation <uuid>` is preview-only unless it also receives `--apply`.

## Portable Manifest

- The default preview contains only the distribution-source exclusion. It never infers consumers from local drive letters or directory names.
- Each user supplies a manifest whose `projects` entries declare consumer roots. The installer still derives the distribution-source exclusion and rejects another user's home directory.

The manifest's path and role are caller input, not authority. Apply only permits exact AE plugin, wrapper, skill, and marketplace-entry targets under a verified consumer root. A runtime and personal plugin source created by a completed installer journal are eligible for transactionally staged upgrades.

## Discovery Surfaces

- `$HOME/.agents/skills` is the official user-level skill discovery location used by the dispatcher contract.
- `$HOME/plugins/ai-agent-engine-codex` is the personal marketplace plugin source shown by the Codex plugin surface; it is not a second project-local installation.
- The distribution source repository intentionally keeps its local `.agents/skills` and `plugins/` mirror for development. Seeing both that local source and the personal plugin while working in the source repository is expected. A consumer project has no local AE plugin, wrapper, AE skill mirror, or AE marketplace entry after migration.
- A new Codex desktop task may need to be reopened after installation because skill discovery is evaluated at task startup; `codex plugin list` confirms registration, while a dispatcher smoke confirms project-root routing.
