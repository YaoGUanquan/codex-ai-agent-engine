# UI Direction Contract

Use this compact contract before significant UI implementation or refinement. For a small task, keep it inline in the work summary; for a design artifact, place it in the UI/UX dimension. Mark unknown values `inferred` or `assumed` instead of silently choosing a generic style.

## Precedence

Resolve direction in this order:

1. existing project design system, tokens, components, and measured visual baseline;
2. user-supplied design, brand assets, screenshots, or explicit constraints;
3. target audience, primary job, surface type, and content needs;
4. contextual inference;
5. generic defaults only for unresolved implementation details.

Operational, public-service, regulated, and accessibility-priority surfaces normally favor clarity, stability, scanability, and established patterns. Marketing or editorial surfaces may use stronger expression when it supports the content. Never apply a landing-page aesthetic to every surface.

## Fields

| Field | Record |
| --- | --- |
| Surface and job | surface type, audience, primary task, frequency of use |
| Baseline and assets | existing system, supplied design, brand/content assets, preserve/replace boundary |
| Hierarchy and typography | reading order, emphasis, type roles, content length constraints |
| Palette | existing tokens, semantic colors, contrast constraints, permitted additions |
| Spacing and density | project tokens or contextual `low` / `medium` / `high`; do not use a universal density default |
| Expressiveness | contextual `low` / `medium` / `high`, with a reason tied to audience and job |
| Motion purpose | state, relationship, feedback, or outcome communicated; otherwise `none` |
| Responsive intent | priority content, reflow/collapse behavior, target viewports and input modes |
| Component and data-access reuse | selected tokens/primitives/semantic/feature/route layer; existing transport/service/query owner; explicit exception when reuse is unsafe |
| Avoid list | explicit visual, content, accessibility, performance, or brand violations |
| Confidence and evidence | each material choice marked `verified`, `inferred`, or `assumed`, with its source |

A self-contained static interaction specification may provide route, layout, field, state, responsive, and interaction evidence. It does not replace canonical requirements, security, concurrency, non-functional, production behavior, or source-code verification. When spec and source differ, list the differences and request an authority decision; do not choose a synchronization direction silently.

For dialogs, drawers, lists, tables, forms, styles, API calls, queries, or mutations, also read `component-data-access-contract.md`. This direction contract records the visual/reuse boundary; the component/data-access contract assigns implementation ownership.

## Refinement Modes

| Mode | Typical intent | Primary owner | Verification |
| --- | --- | --- | --- |
| `audit` | diagnose hierarchy, consistency, accessibility, responsiveness, or direction drift | `ae-review` for report-only work; `ae-frontend-design` when fixes are requested | evidence-backed findings, then `ae-test-browser` when runnable |
| `refine` | improve hierarchy, typesetting, layout, palette, motion, and finish without changing product behavior | `ae-frontend-design` | relevant build/tests plus browser evidence |
| `adjust` | make the surface bolder, quieter, distilled, or clearer while preserving its job | `ae-frontend-design` | compare against this contract and the preserved baseline |
| `harden` | complete responsive states, content/i18n fit, performance, accessibility, and production readiness | `ae-web-app` when state/API/runtime behavior is involved; otherwise `ae-frontend-design` | project checks plus `ae-test-browser` |

Modes may compose, but select one primary owner. Do not create a new skill or change product behavior merely because a refinement word was used.

## Evidence Boundary

Review findings must cite this contract, supplied design input, existing tokens/baseline, an accessibility or responsive requirement, or valid browser evidence. Personal preference without one of those anchors is not a defect. Visual acceptance remains `unverified` when captures are blank, cropped, blocked, missing relevant assets, or contradicted by the user.

## Motion implementation hints (runtime-neutral)

When the target project chooses a JavaScript motion runtime, use these portable review cues; they are not a dependency recommendation:

- Prefer transform and opacity changes for movement and visibility; use layout properties only when the layout itself is the product behavior.
- Use one coordinated timeline or state transition for related elements instead of chains of arbitrary delays; every sequence must expose a usable final state.
- Scope animation to the component lifecycle and clean up listeners, timelines, and scroll observers on unmount or route change.
- Recalculate scroll- or layout-dependent positions only after material layout changes, and debounce resize-driven work.
- Treat `prefers-reduced-motion` as a first-class direction choice: reduce distance, duration, or sequencing, or skip decorative motion entirely.
- Verify motion at the lowest supported viewport/device class; a smooth desktop capture is not evidence of mobile performance.
