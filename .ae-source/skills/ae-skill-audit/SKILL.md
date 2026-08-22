---
name: ae-skill-audit
description: Use when the user asks to audit an external agent, skill, Claude Code, Codex, OpenCode, Cursor, or AI workflow repository and decide what can be adapted into local AE skills without copying external runtime behavior.
---

# AE Skill Audit

Audit external agent and skill repositories, then translate useful patterns into Codex-native AE improvement options.

## Operating Principles

- Treat external repositories as reference input, not implementation to copy.
- Prefer reusable workflow judgment over bulk-importing large skill catalogs.
- Separate platform-specific runtime features from portable methods.
- Keep recommendations compatible with this project's skill mirror, language metadata, help catalog, and Codex approval model.

## Workflow

1. Identify the external source, license, supported harnesses, and primary capability model.
2. Verify source freshness before analysis when network is available:
   - for a tracked source in `docs/ae/references/external-skill-watchlist.json`, run `node scripts/ae-tools.mjs skill-audit --watch` and treat `current`, `stale`, or `unavailable` as evidence, not as permission to rewrite skills;
   - otherwise run `git ls-remote <repo-url> HEAD` or `git ls-remote <repo-url> <branch-or-tag>`;
   - record `sourceUrl`, `observedCommit`, `refSource`, and `inspectedFiles`;
   - if the user supplied a short hash such as `6d4d686`, resolve it to a full commit in a local clone or mark it `unreachable-short-hash`;
   - if local checkout HEAD differs from the remote ref, record `commitMismatch` before using local files as evidence.
   - `--watch` never writes skills, memory, or the watchlist; a `stale` result only names affected AE skills for a later authorized edit.
3. Inspect the repository structure: skills, agents, hooks, commands, MCP, docs, installer scripts, manifests, deterministic engineering mechanisms, and license metadata.
4. Compare the external model with current AE boundaries: `ae-ideate`, `ae-brainstorm`, `ae-plan`, `ae-work`, `ae-review`, `ae-skill-creator`, `ae-agent-creator`, `ae-save-experience`, and `ae-help`.
5. Classify findings using `references/audit-template.md`, including deterministic engineering patterns and license compatibility before recommending reuse.
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

## Evidence And Claim Provenance

When an external repository is used to justify an AE change, record claim provenance before recommending adaptation:

- the claim being reused or challenged;
- the inspected source file, commit, and section that supports it;
- whether the proof is direct evidence, a local inference, or an assumption;
- whether the idea needs an AE evidence ledger, review finding, validation command, or integrity note after implementation;
- unsupported runtime assumptions such as hooks, plugin marketplaces, automatic agents, or MCP behavior that Codex cannot enforce here.

Do not present popularity metrics, benchmark numbers, installation support, or runtime behavior as current facts without fresh observation. If a claim cannot be re-derived from the inspected source or a command, label it as unverified.

## Skill Optimization Pattern Filter

When auditing a framework that claims to optimize, evolve, train, sleep, replay, or self-improve agent skills, evaluate the optimization loop before recommending any AE change:

- trajectory source: record whether examples come from real sessions, synthetic tasks, benchmark splits, user-provided task files, or unverifiable demos;
- bounded edit shape: identify whether candidate updates are add, replace, delete, full rewrite, memory append, or live runtime mutation, and whether an edit budget or protected region limits blast radius;
- validation gate: name the held-out split, replay task, metric, command, or human review signal that decides accept versus reject;
- rejected-update handling: record whether rejected edits become negative evidence, are retried blindly, or disappear without audit history;
- staging and adoption: require a staged proposal plus explicit adoption for live skill or memory changes unless the current AE/Codex runtime provides an equivalent validated safety boundary;
- AE validation mapping: map the proposed adaptation to mirror checks, skill contract checks, claim checks, gate proofs, or a future AE replay suite before calling it safe to adopt.

Treat ungated live mutation, auto-adoption without review, benchmark claims without inspected result files, or optimizer prompts that cannot be separated from runtime-specific harness behavior as blockers for direct adoption. Rewrite useful ideas as an AE process contract, template field, or deferred plan instead.

## Fit Criteria

Good candidates:

- strengthen planning, review, verification, safety, handoff, or skill governance,
- reduce repeated manual judgment across projects,
- can be expressed as Codex skill instructions or local scripts without relying on unavailable hooks,
- have clear trigger conditions and validation expectations.
- expose deterministic engineering patterns such as file selection, schema validation, routing contracts, evidence capture, reflection or filtering passes, dry-run previews, or bounded tool access that can be rewritten as AE guidance.

Poor candidates:

- require copying proprietary or license-incompatible text,
- depend on Claude Code or OpenCode hook behavior that Codex cannot enforce,
- duplicate an existing AE skill without a clear boundary improvement,
- expand the plugin into unrelated business, marketing, or personal productivity catalogs.
- require source-derived templates, prompts, scripts, or assets whose license is missing, unclear, or incompatible with this GPL-2.0-only project.

## Multi-Agent Use

Do not spawn sub-agents unless the user explicitly allows parallel agent work. When allowed, split the audit into independent lanes:

- external repository lane: structure, capabilities, license, and runtime assumptions,
- AE fit lane: current skill overlap, mirror/catalog impact, and validation,
- risk lane: licensing, platform mismatch, duplication, and maintenance cost.

Each lane is read-only unless the user separately asks for implementation.

## Output

Return a concise decision report:

- external repository summary,
- source freshness evidence,
- adaptable patterns,
- deterministic engineering patterns,
- claim provenance and evidence ledger notes,
- classification table for portable method, local deterministic mechanism, and runtime-specific behavior,
- existing AE skills to improve,
- new skill candidates,
- rejected patterns and reasons,
- license compatibility notes,
- implementation impact: files, metadata, validation commands,
- recommended next step.
