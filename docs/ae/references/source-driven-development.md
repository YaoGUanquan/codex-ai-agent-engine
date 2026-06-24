# Source-Driven Development

**Principle:** Framework decisions must check official sources first.

## Definition

Source-driven development is a practice where architectural, design, and integration decisions are informed directly by **official documentation, specifications, and source code** of the frameworks and tools being used, rather than by assumptions, secondhand information, or cargo-culting patterns.

## Core Rules

### 1. **Official First**
- Always consult the **official documentation** of a framework before deciding its capabilities or limitations.
- Check **official GitHub repositories** (README, docs/, examples/) for authoritative guides.
- Review **official type definitions** (.d.ts, JSDoc, interface contracts) to understand exact APIs.
- Never rely on blog posts, Stack Overflow, or community discussions as the source of truth.

### 2. **Specification Over Inference**
- If a framework's behavior is unspecified, **test it first** in the minimal reproducible case.
- Don't assume behavior based on similar frameworks or past experience.
- Document findings in code comments with links to the official source.

### 3. **Version-Aware Decisions**
- Framework capabilities vary by version. Always note the minimum/maximum supported versions.
- Link to the **exact version's documentation** when version-specific behavior matters.
- Example: "Uses [Anthropic Claude API v1](https://docs.anthropic.com/en/) as of June 2026."

### 4. **Verify Integration Points**
- When integrating multiple frameworks (e.g., Claude API + Node.js + MCP), verify each integration point against official specifications.
- Example: MCP compatibility matrix → check [modelcontextprotocol.io](https://modelcontextprotocol.io/)
- Example: Anthropic SDK limits → check [docs.anthropic.com](https://docs.anthropic.com/)

## Application to ph-AI-Agent-Engine

### Skills & Commands
- **Skill contracts** (SKILL.md structure, frontmatter, required sections) are defined in official guides, not assumed.
- **Command boundaries** follow the official AE architecture, not intuition.
- **MCP integration** uses official MCP protocol specs, not guesses about tool signatures.

### Framework Decisions
- **Anthropic Claude API version** → Always reference [https://docs.anthropic.com/](https://docs.anthropic.com/)
- **Node.js runtime features** → Reference official Node.js docs and changelogs
- **npm/package ecosystem** → Check official package registry, type definitions, and READMEs
- **Architecture patterns** → Document against framework best practices, not local conventions

### Quality Standards
- When ae-skill-creator optimizes skill quality, it refers to **official skill-anatomy.md**, not ad-hoc rules.
- When ae-agent-creator defines boundaries, it references **official persona/skill/command** specs.
- When check-skill-contract.mjs validates contracts, it enforces **official requirements**, not inferred ones.

## Implementation Guidelines

### 1. Annotation Pattern
```javascript
// This decision follows Anthropic API v1 specification
// Reference: https://docs.anthropic.com/en/docs/about/models/models-overview
// Version constraint: Claude API >= 2024-06-15
```

### 2. Documentation Links
- Every framework decision should have a comment with a direct link to the official source.
- Format: `// Reference: [official-source-url]`

### 3. Version Pinning
- Lock framework versions with rationale: "Uses Anthropic SDK 1.x to support [official feature]."
- Document when upgrading, with reference to what changed in official changelog.

### 4. Test-First for Ambiguities
- If official docs are unclear, write a minimal test against the official source.
- Document the test result with a comment linking to the test and the official behavior verified.

## When to Use vs. When Not to Use

### ✅ Use source-driven development for:
- Architectural decisions (API structure, MCP integration patterns)
- Framework feature detection (what version supports what)
- Protocol compliance (skill contracts, command signatures)
- Integration boundaries (where official docs define the contract)

### ⚠️ Use with caution for:
- Performance optimization (benchmark against real workloads, not assumptions from docs)
- User experience (docs describe capabilities, not whether end-users find it intuitive)
- Code style (follow official style guides, but team conventions matter too)

### ❌ Don't use source-driven development for:
- Personal coding preferences
- Organizational culture decisions
- Testing strategy (test plan should serve the product, not the framework)

## Maintenance

### Quarterly Review
- Check if framework versions referenced are still current.
- Update links if official documentation has moved.
- Re-verify decisions if framework versions jump significantly.

### When a Decision Is Wrong
- If a source-driven decision turns out to be incorrect, it means:
  1. The official source was misread, or
  2. The official source changed, or
  3. A new official source supersedes the old one.
- Re-read the official source and update the decision with the new understanding.
- Document the correction with dates and links to both old and new official sources.

## Examples

### ✅ Good: Source-driven decision
```javascript
// Claude API supports tool_use blocks in message content.
// Reference: https://docs.anthropic.com/en/docs/build-with-claude/tool-use
// Verified with: Anthropic SDK v0.28.0+
```

### ❌ Bad: Assumption-driven decision
```javascript
// Claude probably supports this feature (we think it does)
// Maybe check the docs sometime
```

## See Also
- [Skill Quality Standards](./skill-quality-standards.md) — quality criteria rooted in framework specs
- [Persona-Skill-Command Boundaries](./persona-skill-command-boundaries.md) — boundary definitions for persona, skill, and command layers
