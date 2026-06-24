---
type: design
status: active
date: 2026-06-24
topic: agent-architecture-boundaries
derived-from: ae-skill-creator, ae-agent-creator, ae-review audit
---

# Three-Layer Boundary: Persona / Skill / Command

This document defines strict separation of concerns across three architectural layers in AI agent systems. Enforced in skill/agent delegation and code review.

---

## Layer Definitions

### Layer 1: Persona
**Owner of**: User intent, context, long-term memory, identity representation

**Responsibility**:
- Holds user profile, preferences, decision history
- Articulates high-level goals
- Does NOT invoke other personas
- Does NOT directly orchestrate skills

**Example**:
- User persona "product-manager": context includes roadmap, team, timeline
- User persona "engineer": context includes codebase, tools, architecture

**Anti-Pattern** (forbidden):
```
persona-A calls persona-B directly
persona calls skill without command coordination
```

---

### Layer 2: Skill
**Owner of**: Deterministic process, verification gates, domain expertise

**Responsibility**:
- Executes single, well-defined workflow
- Publishes "when to use" / "when NOT to use" checklist
- Returns observable evidence (logs, artifacts, test output)
- Does NOT decide when it should run
- Does NOT call other skills (unless composition explicitly designed)
- Does NOT mutate user state

**Example**:
- Skill `check-skill-contract`: validates SKILL.md files
- Skill `pdf-reading`: extracts text from PDF

**Anti-Pattern** (forbidden):
```
skill makes strategic decision ("should we use approach A or B?")
skill calls another skill without explicit composition signature
skill returns narrative instead of evidence
```

---

### Layer 3: Command
**Owner of**: Orchestration, delegation logic, when-to-invoke decisions

**Responsibility**:
- Routes persona intent to appropriate skills
- Decides skill composition and sequence
- Monitors skill success/failure, decides recovery
- Holds temporary workflow state
- Reports back to persona
- Does NOT implement domain logic itself (delegates to skills)

**Example**:
- Command `create-skill`: calls skill-creator, then check-skill-contract, then review
- Command `audit-codebase`: dispatches readers to different file types, aggregates results

**Anti-Pattern** (forbidden):
```
command directly executes code instead of delegating to skill
command ignores skill failure and continues
command makes persona-level decisions (changes user preferences)
```

---

## Boundary Enforcement Rules

### Persona → Skill (Direct Invocation Forbidden)
```
❌ WRONG:
user requests "validate all skills" 
→ directly invoke validation logic

✅ CORRECT:
user requests "validate all skills"
→ command decides which checker (check-skill-contract)
→ command invokes skill with persona context
```

### Skill → Skill (Composition Only)
```
❌ WRONG:
skill-A needs output from skill-B
→ calls skill-B directly in its code

✅ CORRECT:
command recognizes skill-A needs skill-B output
→ calls skill-B first
→ passes result to skill-A
→ OR: document explicit composition signature
```

### Command → Persona (State Isolation)
```
❌ WRONG:
command calls another persona function during workflow
command modifies user preferences mid-execution

✅ CORRECT:
command operates within current persona context
command reports results; persona decides next action
```

---

## Verification Checklist for Skill Design

When writing a SKILL.md:

- [ ] "When to Use" is a process checklist, not a persona-level decision
- [ ] Skill does NOT invoke other skills without explicit documentation
- [ ] Skill returns observable evidence (logs, artifacts, test output)
- [ ] Skill does NOT modify user state or preferences
- [ ] "When NOT to Use" includes anti-patterns (what commands should prevent)
- [ ] All external invocations documented in "How to Invoke" section

Example template:
```markdown
## When to Use
- [ ] Skill condition 1 met
- [ ] Skill condition 2 met
- [ ] Command has verified these conditions before invoking

## When NOT to Use
- ❌ Do NOT call if command is still in decision phase
- ❌ Do NOT call for persona-level state mutations
- ❌ Do NOT invoke other skills; let command handle composition

## How to Invoke
```
command → skill(input, context)
returns → {success, evidence, nextStepsForCommand}
```
```

---

## Verification Checklist for Command Design

When orchestrating a workflow:

- [ ] All persona-level decisions delegated properly (not assumed in command)
- [ ] Skill invocation sequence documented
- [ ] Skill failure/timeout handling defined
- [ ] Recovery path for each failure mode documented
- [ ] Results aggregated and returned to persona context

Example template:
```markdown
## Orchestration Steps
1. Command receives persona request
2. Command validates preconditions (not skill's responsibility)
3. Skill 1 → skill 2 → skill 3 (sequence and dependencies)
4. If skill X fails: try recovery Y
5. Return aggregate result to persona
```

---

## Red Flags in Code Review

When reviewing skill or command code:

| Red Flag | Why Wrong | Fix |
|----------|-----------|-----|
| `persona.updatePreferences()` called from skill/command | Violates state isolation | Move to persona layer; skill returns recommendation only |
| `skillA.invoke(...)` inside skillB code | Skills shouldn't know about each other | Document composition in command; command orchestrates sequence |
| Skill makes if/else decision on "which approach is better" | Skill has no context for strategic choice | Return evidence; let command/persona decide |
| No observable evidence returned (only boolean success) | Command can't handle failure intelligently | Return logs, artifacts, test output |
| Command modifies persona state without persona approval | Violates autonomy | Command returns results; persona decides what to change |

---

## Example: Correct Delegation

### Wrong (all layers tangled):
```javascript
persona.validateAllSkills = async () => {
  const files = await findSkillFiles();  // should be skill
  const results = files.map(f => validateFrontmatter(f));  // should be skill
  await persona.updatePreferences({lastCheck: now});  // skill never does this
  return results;
}
```

### Correct (clean boundaries):
```javascript
// PERSONA: holds user identity and preferences
class ProductManager {
  constructor(context) {
    this.context = context;  // roadmap, team, decisions
  }
  
  async request(intent) {
    // Persona says WHAT, not HOW
    return await command.execute(intent, this.context);
  }
}

// COMMAND: decides orchestration
command.execute = async (intent, personaContext) => {
  if (intent === "validate all skills") {
    const skillFiles = await skillFinder.findAll();  // or skill wrapper
    const validationResults = await skillValidator.validate(skillFiles);
    // Command decides what to do with results
    return {
      results: validationResults,
      nextAction: "???"  // depends on persona decision
    };
  }
}

// SKILL: does deterministic work, returns evidence
skillValidator.validate = async (files) => {
  return {
    passed: [...],
    failed: [...],
    evidence: {
      logs: [...],
      artifacts: [...]
    }
  };
}
```

---

## Anti-Rationalization: "But This Is Simpler If..."

| "Simpler If" Excuse | Counter-Argument | Correct Pattern |
|---|---|---|
| "Skill calls another skill directly" | Creates hidden dependencies; breaks composability; command can't handle partial failure | Command orchestrates; skill is stateless |
| "Persona modifies state during skill execution" | Command must be able to rollback; concurrent workflows collide | Skill returns evidence; persona decides state change after command reports |
| "Command makes domain decisions" | Command layer is dumb orchestration; decisions belong to skill (with evidence) or persona (with intent) | Skill: "here's the evidence"; Persona: "I decide based on that"; Command: "route that decision" |
| "Skip evidence; just return true/false" | Command can't implement intelligent recovery; debugging is blind | Always return logs, artifacts, test output; caller decides interpretation |

---

## Integration: AE-Agent-Creator & AE-Review

### AE-Agent-Creator SKILL.md (What It Creates)
Should document:
- ✓ How agent templates enforce persona/skill/command separation
- ✓ Anti-patterns to flag during review
- ✓ Verification steps: does resulting agent respect all three layers?

### AE-Review SKILL.md (What It Validates)
Should enforce:
- ✓ Red flags from delegation table above
- ✓ Skill return types (must include evidence)
- ✓ Command orchestration logic (proper sequencing, error handling)
- ✓ No cross-layer invocations

---

## Related Documents

- [Skill Quality Standards](./skill-quality-standards.md) — Verification gates and process-over-prose rules
- [Source-Driven Development](./source-driven-development.md) — Official-source-first decisions
- [ae-skill-creator](../../../plugins/ai-agent-engine-codex/skills/ae-skill-creator/SKILL.md) — Skill creation workflow
- [ae-agent-creator](../../../plugins/ai-agent-engine-codex/skills/ae-agent-creator/SKILL.md) — Agent prompt and delegation template workflow
- [ae-review](../../../plugins/ai-agent-engine-codex/skills/ae-review/SKILL.md) — Review workflow for boundary violations
