# Model-Adaptation Contract

Use this contract for AE orchestration and instruction design. It is model-neutral: observable task behavior and active runtime capabilities are the control surface, not a model name, assumed context size, private reasoning behavior, or a hard-coded reasoning-effort value.

## Capability-Driven Execution

- Read the active tool schema and current repository state before choosing an execution path. Never infer that a tool, lifecycle hook, sub-agent mode, browser feature, or approval behavior exists from a model label or documentation for another host.
- Treat provider model catalogs and supported reasoning levels as runtime metadata. When they disagree with the outgoing request or backend response, report a provider/catalog defect instead of compensating in skill text.
- Scale analysis, artifacts, and validation to task class, risk, acceptance criteria, and evidence boundary. Do not make a workflow heavier or lighter only because the selected model is newer, larger, or described as more capable.
- Use the [adaptive team contract](team-execution.md) for approved multi-unit work.
  Keep authorization, privacy, user work, business invariants and evidence hard;
  choose roles, concurrency, process depth and supported effort from the task.
  Unrelated dirty work is not a blanket delegation blocker.

## Task-Size Gate

Classify the request before loading references or choosing a workflow:

- `micro`: one question, one command, one named file, or a deterministic text/config change;
- `small`: a bounded bug or review touching a few named files with no new public contract, persistence, security boundary, or deployment requirement;
- `standard`: multiple modules, a new contract, or a user-requested plan/design artifact;
- `high-risk`: data migration, authorization, external side effect, distributed/async behavior, deployment, or an explicit production/evidence gate.

For `micro` and `small` requests, use the smallest applicable path by default: inspect only the named entry points, make only the requested change, run one focused validation, and stop when the stated acceptance condition is met. Do not create a PRD/plan/design/review package, load unrelated references, scan the whole repository, spawn sub-agents, or write durable artifacts unless the user asks for them or the task crosses a higher-risk boundary.

If the user names files, a defect, or an explicit scope, that scope is a hard boundary. Do not reinterpret a checklist, neighboring feature, or “complete” workflow as a new requirement. Expand only when current evidence proves the requested behavior cannot be handled within scope; state the trigger and the newly required files before expanding.

Use the user's explicit budget when provided; do not invent fixed inspection, tool-call, test or retry limits. Continue authorized work until acceptance, a real blocker, or that explicit budget is reached. After failure, use new diagnostic evidence to change the next step rather than repeat an unchanged failing path.

For ordinary development, inspect relevant evidence, implement, validate and review the scoped diff. Multiple files or modules alone do not require a full pipeline. Load planning, documentation and specialist gates only for a concrete risk, applicable project rule or explicit request; reuse an approved plan rather than planning again. Apply the [validation contract](validation-contract.md) for test selection and evidence reuse.

## Instruction Economy

- Apply system, developer, user, nearest `AGENTS.md`, and selected skill instructions in precedence order. Do not restate effective higher-priority rules in generated artifacts or chat unless the restatement resolves a concrete ambiguity.
- Load only references triggered by the current task. Prefer one canonical contract over duplicated copies across skills.
- Express prompts and handoffs through outcome, scope, constraints, evidence, current state, and stop conditions. Avoid scripts of private reasoning steps or exhaustive ceremony that does not change observable work.

## Autonomy And Clarification

- Proceed with a stated low-risk assumption when repository evidence makes one path materially more likely and rollback is straightforward.
- Existing unrelated work or the default branch alone is not a reason to interrupt authorized reversible edits. Inspect overlapping changes, preserve the user's work, and ask only when safe coexistence or an actual decision cannot be resolved. Git writes and other protected actions retain their authorization requirements.
- Ask one focused question only when the answer changes product behavior, architecture, data shape, security posture, irreversible action, or the required validation tier.
- Do not repeatedly ask whether to continue through an already-approved workflow. Pause only for an actual decision, missing credential, external side effect, blocking contradiction, or P0/P1 risk.

## Tools, Context, And Completion

- Use tools through their current schema, inspect returned evidence, and adapt after failures. Do not fabricate success, silently skip a required action, or repeatedly retry an unchanged failing path.
- For long S4 work, preserve compact task state in approved repository artifacts: goal, decisions, current unit, changed files, completed and pending validation, blockers, and next action. Do not persist transcripts or private reasoning.
- After interruption or compaction, re-read the smallest canonical artifact set and reconcile it with the worktree before continuing. Do not restart completed work from memory alone.
- Stop when the requested acceptance criteria and applicable evidence boundary are satisfied. Do not keep searching, refactoring, or proposing adjacent work merely because more context or capability remains.

## Proof Boundary

Static checks can prove instruction, mirror, parser, and distribution contracts only. They do not prove identical behavior across every model, provider, reasoning configuration, Codex host, authenticated runtime, browser, or deployment.
