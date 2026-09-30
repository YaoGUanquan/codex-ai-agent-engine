---
name: ae-skill-audit
description: Use when the user requests an external agent, skill or AI workflow repository audit for possible AE adaptation.
---

# AE Skill Audit

Inspect external methods, not an external runtime to copy. Establish source,
license, observed commit, inspected paths and freshness before recommending
reuse. Separate observed evidence, inference and unverified claims.

1. Bound the source inventory and compare it with current AE owners.
2. Classify each candidate as a portable method, local deterministic mechanism,
   or runtime-specific behavior.
3. Recommend improvement, narrow new skill, reference-only, rejection or
   deferral. Use [audit-template](references/audit-template.md).
4. Keep the audit read-only. Implementation, network writes and live adoption
   are separate authorized work.

## Task References

Read only the row triggered by the task, not the whole table.

| Trigger | Reference |
| --- | --- |
| Source discovery, freshness or provenance | [Source audit](references/source-audit.md) |
| Optimizer/self-improvement claims or adoption recommendation | [Optimization and fit](references/optimization-fit.md) |

Before helper commands, use [runtime-entry](../ae-help/references/runtime-entry.md).
For broad inventories, use the [scale contract](../ae-help/references/scale-and-distributed-engineering.md).
Never infer affected skills from a changed HEAD alone, import incompatible
licensed text, assume hooks/MCP/automatic agents, or delegate without explicit
user authorization. Recommendations must fit plugin source, maintenance mirror,
metadata and validation contracts.
