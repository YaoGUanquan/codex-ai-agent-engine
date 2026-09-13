# Routing Regression Examples

Use these cases to evaluate routing changes, not as a keyword classifier. Explicit user scope and repository evidence take precedence. Load this reference for routing ambiguity or evaluation, not every implementation.

| Case | Request | Primary owner | Do not select | Acceptance boundary |
| --- | --- | --- | --- | --- |
| visual-only | Match the existing dashboard spacing and typography to this screenshot; preserve data behavior. | ae-frontend-design | ae-web-app | Desktop/mobile visual and browser checks; no API changes. |
| api-flow | Connect the existing form to the API, including loading and validation errors; preserve styling. | ae-web-app | ae-frontend-design | Exercise request, response, and error states; browser evidence separate from authenticated API proof. |
| existing-route | Fix the existing route query and pagination state; keep the layout. | ae-web-app | ae-web-forge | Inspect current route first; verify navigation and state without repeating intake. |
| mixed-intake | Build an admin workspace; first determine whether mock UI or persistent workflows are required. | ae-web-forge | ae-frontend-design | Resolve the material scope question, then select one implementation owner. |
| browser-only | Verify the existing page at desktop and mobile widths without editing code. | ae-test-browser | ae-web-app | Report observed browser findings; do not start implementation. |
| explicit-owner | Use $ae-frontend-design to adjust this dialog's visual hierarchy only. | ae-frontend-design | ae-web-forge | Honor explicit scope, preserve behavior, and avoid redundant routing. |

For a real model/host evaluation, run the same cases against the same repository fixture before and after the change. Record model/provider and supported settings, selected owner, extra skill loads, unnecessary clarification, task outcome, validation tier, elapsed time, and token usage only when the host exposes it. Do not invent unavailable measurements. Include authorization-sensitive and ambiguous variants; reduced loading must not remove safety or acceptance checks.

Static tests establish that these boundaries remain documented. They do not execute a model router or prove routing accuracy, lower token usage, faster execution, or GPT-6 Astra compatibility.
