# Optimization Fit

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
