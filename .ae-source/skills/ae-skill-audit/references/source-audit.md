# Source Audit

Before helper commands, resolve `aeEntry` using the [runtime entry contract](../../ae-help/references/runtime-entry.md).

## Workflow

1. Identify the external source, license, supported harnesses, and primary capability model.
2. Verify source freshness before analysis when network is available:
   - for a tracked source in `docs/ae/references/external-skill-watchlist.json`, run `node "$aeEntry" skill-audit --watch` and treat `current`, `stale`, or `unavailable` as evidence, not as permission to rewrite skills;
   - otherwise run `git ls-remote <repo-url> HEAD` or `git ls-remote <repo-url> <branch-or-tag>`;
   - record `sourceUrl`, `observedCommit`, `refSource`, and `inspectedFiles`;
   - if the user supplied a short hash such as `6d4d686`, resolve it to a full commit in a local clone or mark it `unreachable-short-hash`;
   - if local checkout HEAD differs from the remote ref, record `commitMismatch` before using local files as evidence.
   - `--watch` never writes skills, memory, or the watchlist. A stale HEAD without path evidence reports `stale-impact-unverified` plus `candidateSkills`; only repeated `--changed-path <repo-relative-path>` values matching an adopted row's `upstreamPaths` may populate `affectedSkills` and report `stale-affected`. When multiple sources are registered, explicit `--remote-commit` or `--changed-path` evidence requires `--source <id>` so evidence from one repository cannot be applied to another.
   - Treat `sourceRole: primary-upstream` as the first audit priority and `supplementary-research` as bounded method research; neither role authorizes automatic synchronization.
3. Inspect the repository structure: skills, agents, hooks, commands, MCP, docs, installer scripts, manifests, deterministic engineering mechanisms, and license metadata.
4. Compare the external model with current AE boundaries: `ae-ideate`, `ae-brainstorm`, `ae-plan`, `ae-work`, `ae-review`, `ae-skill-creator`, `ae-agent-creator`, `ae-save-experience`, and `ae-help`.
5. Classify findings using `audit-template.md`, including deterministic engineering patterns and license compatibility before recommending reuse.
6. Recommend one of:
   - improve an existing AE skill,
   - create a new narrowly scoped AE skill,
   - add a reference/template only,
   - reject or defer because the pattern does not fit Codex or AE.
7. If the user asks to implement a recommendation, route to `ae-skill-creator` or `ae-work` and preserve the plugin source plus `.agents/skills` mirror.

## Runtime Boundary Filter

For every external repository, record the source URL, license, observed commit, ref source, inspected files, and freshness method before recommending adaptation. Treat source freshness as evidence: stale examples may still contain useful process ideas, but they should not define current Codex behavior without local verification.

Classify each finding into portable method, local deterministic mechanism, or runtime-specific behavior:

- portable method: planning gates, review contracts, evidence capture, source freshness checks, routing criteria, schema validation, dry-run previews, and bounded tool access that can be rewritten as AE guidance;
- local deterministic mechanism: helper scripts or checks that can run under this repository's `scripts/` and validation model;
- runtime-specific behavior: Claude Code or OpenCode hooks, slash commands, MCP auto-loading, schedulers, permission presets, sounds, status lines, settings, or agent registries that Codex cannot enforce here.

Reject direct ports of runtime-specific behavior unless the current Codex environment has an equivalent enforcement point. If a useful idea comes from such behavior, rewrite only the process contract and note the rejected runtime assumption and license impact.

Freshness failures are audit findings, not blockers by themselves. If `git ls-remote` is unavailable, record `freshnessMethod: unavailable` and the reason. If a requested short hash is not reachable from the inspected ref, record the mismatch and avoid claiming the inspected files are the latest source.

Changed-path input is untrusted evidence. Accept only normalized repository-relative paths, reject absolute paths and `..` traversal, and do not infer affected skills from a changed HEAD alone. `stale-unrelated` means supplied paths did not match adopted mappings; it does not prove the rest of the upstream change is harmless.

## Evidence And Claim Provenance

When an external repository is used to justify an AE change, record claim provenance before recommending adaptation:

- the claim being reused or challenged;
- the inspected source file, commit, and section that supports it;
- whether the proof is direct evidence, a local inference, or an assumption;
- whether the idea needs an AE evidence ledger, review finding, validation command, or integrity note after implementation;
- unsupported runtime assumptions such as hooks, plugin marketplaces, automatic agents, or MCP behavior that Codex cannot enforce here.

Do not present popularity metrics, benchmark numbers, installation support, or runtime behavior as current facts without fresh observation. If a claim cannot be re-derived from the inspected source or a command, label it as unverified.
