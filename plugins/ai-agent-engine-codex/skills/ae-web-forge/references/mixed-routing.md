# Mixed Routing

## Four-Question Routing

Answer the questions in order and record the result in the work summary:

Reuse answers already established by the request or repository. Keep one primary implementation owner; do not load all implementation skills for intake or send an unchanged task back through routing. An explicit skill request stays with that skill unless a concrete missing responsibility requires a handoff. See [routing examples](routing-examples.md) for positive and negative boundaries.

| Question | Meaning | Codex-native route |
| --- | --- | --- |
| Q1 existing route or second-development? | Does the task modify an existing page, route, component, HTML file, or user-provided target? | Read the current implementation first and preserve structure unless replacement is requested. |
| Q2 design input? | Is there no design input, a screenshot, a Figma URL, a written visual spec, or an existing visual baseline? | Use `ae-frontend-design` for focused UI creation or visual matching. Preserve design input as a constraint and inspect `component-data-access-contract.md` for reusable interaction shells. |
| Q3 backend or API interaction? | Does the task need state, forms, API calls, auth, persistence, or error handling? | Use `ae-web-app`; inspect `component-data-access-contract.md`, coordinate `ae-backend` or `ae-sql` when server or data contracts change, and hold both sides to the API contract checklist in `ae-backend`. |
| Q4 visual baseline? | For Q1=yes, should current visuals be preserved or intentionally replaced? | Preserve by default; redesign only when requested or required by the goal. |

### Fast Route

If the request names one existing target and one concrete change, or explicitly selects an owner, run only the target existence check and route directly. Do not repeat Q1-Q4 intake, load every frontend skill, or produce a full routing summary. Use the four questions only when the request is mixed, ambiguous, or replacement versus modification could materially change behavior, data integrity, or acceptance.

Typical outcomes:

- New UI only: `ae-frontend-design` -> `ae-test-browser`.
- New UI plus interaction/API: `ae-web-app` -> `ae-test-browser`.
- Existing route logic change: `ae-web-app`, preserving Q4 baseline -> `ae-test-browser`.
- Visual implementation from screenshot/Figma: `ae-frontend-design` with the provided design input -> `ae-test-browser`.
- Verification only: `ae-test-browser`.

For visual audit, polish/refine, bolder/quieter/distill/clarify, adapt, or optimize requests, read `../../ae-frontend-design/references/ui-direction-contract.md` and map the intent to its `audit`, `refine`, `adjust`, or `harden` mode. Preserve Q1-Q4; this vocabulary selects an existing owner and does not create another public skill. Record the resulting direction contract before implementation when the request changes visual direction.

## Report Format

Include this summary when the skill drives work:

```markdown
