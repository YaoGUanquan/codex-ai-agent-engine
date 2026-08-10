# Global AE Install Contract

## Boundaries

- The official user-level discovery location used by this distribution is `$HOME/.agents/skills`.
- The private runtime is `$HOME/.agents/ai-agent-engine-codex`; it stores distribution code, operation journals, and backups only.
- Project `AGENTS.md`, `docs/**`, memory registries, graphs, and archives remain in each project root. They are neither copied nor removed by migration.
- Each operating-system user runs the installer against their own home directory and explicitly supplies or confirms their own project manifest. The installer never scans another user's home directory.

## Lifecycle

1. `preview` inspects a manifest without writing files and emits a confirmation digest.
2. `apply --apply --operation <uuid> --confirm <digest>` revalidates all paths and fingerprints, stages the runtime, cleans only verified consumer components, then activates user skills last.
3. A failure reverses the complete batch. An interrupted operation must be recovered before a later apply.
4. Terminal-operation backups and journals remain available. `purge --operation <uuid>` is preview-only unless it also receives `--apply`.

## First Batch

- Consumers: `ph-92wailian`, `ph-AionUi`, `ph-centent`, `ph-fromour`, `ph-Lingcard`, `ph-tranform`, `ph-uumit`.
- Distribution source: the installer's own repository root, dynamically derived at runtime. Its plugin source and `.agents/skills` mirror are never cleanup candidates.
- Deferred: `D:\codes\work` for the current first batch.

The manifest's path and role are caller input, not authority. Apply derives source/deferred exclusions again and only permits exact AE plugin, wrapper, skill, and marketplace-entry targets under a verified consumer root.
