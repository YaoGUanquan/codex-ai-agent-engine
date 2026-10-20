---
name: ae-web-forge
description: Use only when explicitly requested as $ae-web-forge or its named AE capability. Scope includes /ae-web-forge or $ae-web-forge, or explicitly requested AE routing of broad or mixed frontend/Web work.
---

# AE Web Forge

Route to one primary implementation owner; preserve existing targets and visual
baselines unless replacement is requested.

1. Inspect the named path/page/route/design and establish whether it exists.
2. For one clear change or an explicitly selected owner, route directly:
   visual-only -> `ae-frontend-design`; state/forms/API/auth -> `ae-web-app`;
   verification-only -> `ae-test-browser`.
3. For mixed or ambiguous work, use Q1 existing target, Q2 design input,
   Q3 backend/API and Q4 preserve/replace baseline. Reuse established answers.
4. Verify UI changes in a real browser when a runnable preview exists.
   Use the [validation contract](../ae-help/references/validation-contract.md);
   stop at acceptance, a real blocker, or a user-specified budget.

## Task References

Read only the row triggered by the task, not the whole table.

| Trigger | Reference |
| --- | --- |
| Mixed intake, visual refinement mode or full routing report | [Mixed routing](references/mixed-routing.md) |

For visual audit/refine/adjust/harden, use [ui-direction-contract](../ae-frontend-design/references/ui-direction-contract.md).
For reusable components/data access, use [component-data-access-contract](../ae-frontend-design/references/component-data-access-contract.md).
For scale-sensitive Web flows, use the [scale contract](../ae-help/references/scale-and-distributed-engineering.md).
Keep a fast-route report to owner, target, acceptance and residual risk. Do not
load all implementation skills for intake, repeat routing, bypass auth/stack
contracts or imply unavailable OpenCode agents/MCP behavior.

## Related Skills

Open the sibling skill that owns the selected route:

- [ae-frontend-design](../ae-frontend-design/SKILL.md) for visual-only UI work
- [ae-web-app](../ae-web-app/SKILL.md) for state, forms, API, or auth flows
- [ae-test-browser](../ae-test-browser/SKILL.md) for browser verification
