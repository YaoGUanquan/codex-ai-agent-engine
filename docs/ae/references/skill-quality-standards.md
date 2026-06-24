---
type: design
status: active
date: 2026-06-24
topic: skill-quality-standards
derived-from: skill-anatomy.md, agent-skills audit
---

# Skill Quality Standards (Portable Method)

This document defines reusable quality criteria for all AI agent skills, derived from proven patterns in production engineering workflows.

## Core Principles

1. **Process Over Prose** — Concrete checklists and verification steps before narrative explanation
2. **Verification Gates** — Require observable evidence (test output, logs, artifacts) not claims
3. **Anti-Rationalization** — Document excuses to skip steps with explicit counter-arguments
4. **Progressive Disclosure** — Defer token-heavy reference material; keep guidance focused
5. **Role Clarity** — Distinct personas (creator, reviewer, implementer) with clear responsibility boundaries

---

## SKILL.md Contract (Deterministic Validation)

Every SKILL.md file MUST include:

### Frontmatter (required)
```yaml
---
type: skill
status: [active|draft|deprecated]
date: YYYY-MM-DD
topic: [topic]
---
```

### Anatomy Sections (in order, required)
1. **Description** (max 200 chars) — one-line trigger intent, no preamble
2. **When to Use** — process checklist of conditions, not prose narrative
3. **When NOT to Use** — explicit anti-patterns with counter-arguments for each
4. **How to Invoke** — concrete example with required arguments
5. **Key Patterns** — reusable methods this skill enables (with token costs)
6. **Common Mistakes** — rationalization table: excuse → why invalid → correction
7. **Verification Checklist** — observable proof before claiming completion

### Cross-Skill References
- Format: `[other-skill](../../path/to/SKILL.md)` — relative paths only
- Validation: script must verify all links exist and reference correct type
- Intent: each skill states its dependencies and complements explicitly

---

## Verification Gates by Lifecycle

### Definition Phase
- [ ] Skill frontmatter is valid YAML
- [ ] Description ≤ 200 characters
- [ ] When to Use section lists process, not prose
- [ ] All cross-skill references resolve

### Implementation Phase
- [ ] Code artifact exists and runs without errors
- [ ] Unit tests pass (if applicable)
- [ ] Integration test shows skill invoked correctly

### Review Phase
- [ ] Token cost estimates provided for common workflows
- [ ] No placeholder prose ("this skill helps you...")
- [ ] Anti-rationalization table is populated (≥3 excuses with rebuttals)
- [ ] Progressive disclosure: guide ≤1000 tokens before references

### Ship Phase
- [ ] Deterministic check-skill-contract.mjs passes
- [ ] All documentation links verified
- [ ] Skill categorized in skills registry

---

## Anti-Rationalization Table (Template)

| Excuse to Skip | Counter-Argument | Correction |
|---|---|---|
| "Description is prose, easier to read" | Triggers are pattern-matched; prose drowns key signals | Rewrite as process checklist |
| "This skill doesn't need verification" | Unverified claims create cascading failures in multi-agent workflows | Add observable proof (test output, logs) |
| "Can defer progressive disclosure for now" | Token waste scales with every agent; users pay in real money | Move reference material to appendix |

---

## Progressive Disclosure Pattern

**Initial guidance** (≤500 tokens):
- When to use (process checklist)
- Basic invocation example
- 1–2 key patterns

**Supporting reference** (on-demand):
- Token cost estimates
- Error recovery procedures
- Edge cases and anti-patterns

**Deep dives** (external links):
- Framework docs (official sources only)
- Multi-agent orchestration considerations
- Advanced patterns (delegation, composition)

---

## Expert Role Clarity

### Skill Creator Role
- Writes deterministic, testable skill definition
- Owns anti-rationalization table
- Ensures all verification gates pass

### Skill Reviewer Role
- Validates frontmatter and anatomy
- Checks cross-skill reference integrity
- Confirms progressive disclosure applied

### Skill Implementer Role (Agent)
- Invokes skill only per documented "When to Use"
- Captures observable evidence (logs, test output)
- Reports back through verification checklist

---

## Token Budget Awareness

Every skill MUST document estimated cost:

```yaml
# In SKILL.md frontmatter extension (if applicable)
costs:
  minimal-invocation: "~500 tokens"
  full-workflow: "~2000 tokens"
  with-verification: "~3500 tokens"
```

Multi-agent workflows MUST aggregate and warn if total exceeds user budget.

---

## Validation Automation

See `scripts/check-skill-contract.mjs` for deterministic checks:
- Frontmatter YAML validity
- Required section presence
- Description length enforcement
- Cross-skill reference integrity
- Anatomy section ordering

Run: `npm run check`

---

## Examples of Quality Skills

Well-formed skills exhibit:
1. ✓ Explicit "when NOT to use" with rebuttals
2. ✓ Verification section with observable proof requirements
3. ✓ Token cost estimates
4. ✓ Process checklists (not prose)
5. ✓ All cross-references verified

Poorly-formed skills have:
- ✗ Narrative description ("This skill helps you...")
- ✗ No verification gates
- ✗ Hidden cross-skill dependencies
- ✗ Deferred or missing progressive disclosure
- ✗ Prose-heavy "when to use" section

---

## Related Documents

- External audit source: `addyosmani/agent-skills` skill anatomy patterns
- [check-skill-contract.mjs](../../../scripts/check-skill-contract.mjs) — Automated validation
- [ae-skill-creator](../../../plugins/ai-agent-engine-codex/skills/ae-skill-creator/SKILL.md) — Skill creation workflow
