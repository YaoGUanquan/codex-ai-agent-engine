# Candidate Evaluation

Use this reference when a completed lesson, audit, or repeated task suggests creating, improving, or absorbing a Codex skill. It is a proposal-quality gate, not a runtime optimizer or permission to modify files.

## Candidate Record

- Candidate: concise name for the proposed behavior.
- Source evidence: completed-work path, reviewed diff, validation command, or inspected external source and commit.
- Trigger: the recurring request or condition that should invoke the behavior.
- Scope: repository-specific, cross-project, or explicitly uncertain.
- Expected reuse: concrete future task shape that justifies retaining this guidance.
- Proposed owner: existing skill, new skill, helper script, reference/template, or process artifact.
- Validation: checks that must pass if the proposal is adopted.

## Required Checks

1. Read the source evidence and separate a repeatable pattern from a one-off incident.
2. Run an overlap check against `plugins/ai-agent-engine-codex/skills/`, `.agents/skills/`, and relevant `AGENTS.md`, `docs/08-ai-memory/`, and `docs/ae/` guidance.
3. Apply the Extension Routing Matrix before proposing a new skill; prefer improving an existing owner, a reference/template, or a deterministic helper script when those fit.
4. Confirm the candidate does not require unsupported hooks, automatic session injection, automatic skill generation, unreviewed memory writes, or external runtime installation.
5. Name the exact source/mirror files, metadata impact, and validation commands that adoption would require.

## Verdicts

| Verdict | Use when | Proposed next step |
| --- | --- | --- |
| Create | A distinct repeatable workflow has a clear trigger, no suitable owner, and a validation path. | Draft a new skill proposal with scope, files, metadata, and validation. |
| Improve | An existing skill owns the workflow but needs a bounded behavior or reference update. | Draft an owner-specific change proposal. |
| Absorb | The candidate overlaps an existing skill and can be expressed as a small addition. | Draft the target section and explain why a new skill is unnecessary. |
| Drop | The evidence is one-off, stale, redundant, too broad, or lacks a validation path. | Record the rationale in the current response only unless the user requests a durable artifact. |

## Adoption Boundary

The candidate record and verdict are candidate evidence, not authorization. Do not automatically edit `SKILL.md`, create a skill directory, update memory, register a command, install a runtime, or generate artifacts from this evaluation.

For `Create`, `Improve`, or `Absorb`, present a staged proposal that names the target files, the proposed behavior, non-goals, mirror and metadata impact, and validation. Apply it only after explicit user authorization, then use the normal skill-creation workflow and repository checks.

## Output Format

```markdown
## Candidate Evaluation

- Source evidence: <path, command, or observed external ref>
- Trigger and scope: <recurring condition and reuse boundary>
- Overlap check: <sources inspected and result>
- Proposed owner: <existing skill / new skill / helper / reference / process artifact>
- Validation if adopted: <commands or inspection>

### Verdict: Create | Improve | Absorb | Drop

Rationale: <why this verdict follows from the evidence and routing matrix>
Adoption: <staged proposal only; explicit user authorization required / no change>
```
