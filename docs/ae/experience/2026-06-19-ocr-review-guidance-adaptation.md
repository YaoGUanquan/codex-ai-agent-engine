# OCR Review Guidance Adaptation

## Context

The project audited `alibaba/open-code-review` to decide whether its review mechanics should improve local AE skills. The useful parts were deterministic review constraints, not the external CLI runtime.

## Problem

`ae-review` already had reviewer lanes, verdict rules, and evidence expectations, but it lacked explicit guidance for common review failure modes:

- findings drifting away from newly changed code in diff reviews,
- line or path positions becoming uncertain,
- uncertain findings being discarded too aggressively,
- file-type review concerns being repeated ad hoc,
- external repository audits not separating deterministic mechanics from runtime-specific behavior.

## Decision

Adapt the method, not the runtime:

- `ae-review` now has `Diff Review Discipline` for diff-like scopes.
- `ae-review` keeps `full` and `full:<path>` scans broad instead of narrowing all reviews to changed lines.
- `ae-review` now asks for a manual position check and contradiction check before finalizing code findings.
- `ae-review` gained `references/code-review-rule-profiles.md` as optional review lenses.
- `ae-skill-audit` now records deterministic engineering patterns and license compatibility.
- `ae-skill-audit/references/audit-template.md` now has `License Compatibility` and `Deterministic Engineering Patterns` sections.

The project intentionally did not import OCR CLI, provider configuration, telemetry/session viewer, GitHub Actions workflow, prompt/rule text, or a new default `ae-open-code-review` skill.

## Prompt Optimization Note

For future external-review adaptation work, use prompts that separate:

- source repository facts,
- portable deterministic engineering patterns,
- platform-specific runtime behavior,
- license compatibility,
- target AE skill boundaries,
- validation commands.

Avoid prompts that ask for wholesale import of skills, commands, or runtime assumptions.

The execution prompt for this change was kept intentionally bounded: it names the plan file, allowed files, required guidance, validation commands, and stop conditions. This makes the prompt reusable for similar documentation-first skill adaptations without implying that Codex should install or run the external tool.

## Validation

Commands used:

```powershell
node scripts/check-skill-mirror.mjs
node scripts/check-ae-artifacts.mjs
npm.cmd test
npm.cmd run check
npm.cmd test -- --test-name-pattern "OCR-inspired review guidance"
```

Final gate proof:

- `docs/ae/gates/20260619T055323Z-work-final.json`

## Reusable Lesson

When an external review tool appears stronger than local skill guidance, identify which parts are deterministic constraints and which parts are runtime. Prefer adding precise review contracts, rule-profile references, and regression tests before introducing new CLIs, providers, hooks, or automation.
