# Frontend Design Quality Replay

Use these scenario cards to review changes to the UI Direction Contract. Record the generated direction fields, compare them with the expected signals and negative assertions, and keep user-perceived quality `unverified` unless real target-project evidence exists.

## Replay Record

- Skill/ref version:
- Reviewer:
- Date:
- Result: passed | failed | unverified
- Evidence paths:

## Scenario 1 - Marketing Launch Page

- Input: a new public product launch page with approved brand assets, a clear conversion goal, editorial photography, and no existing page baseline.
- Expected direction: marketing surface; prospective buyer; strong product/offer hierarchy; brand palette and real assets; medium/high expressiveness when justified; motion only for product relationship or feedback; mobile content priority stated.
- Must not trigger: dashboard density, generic gradient decoration, invented brand colors, motion without purpose, or a split hero that hides the product.
- Verification signal: every field has evidence/confidence; asset and brand constraints outrank generic defaults; browser evidence covers desktop/mobile framing.

## Scenario 2 - Dense Operational Console

- Input: an existing support operations console used all day, with established tokens, tabular comparison, keyboard workflows, and audit requirements.
- Expected direction: operational surface; frequent expert use; high information density; calm hierarchy; existing tokens; low expressiveness; minimal state-feedback motion; scanning, focus, and stable layout prioritized.
- Must not trigger: oversized hero type, decorative card bands, low-density marketing composition, novelty navigation, or animation that delays task completion.
- Verification signal: existing baseline wins; primary actions and data remain scannable at desktop and constrained widths; visual findings cite workflow/accessibility evidence.

## Scenario 3 - Preserve-Style Redesign

- Input: improve an existing account settings flow while preserving its recognizable brand, component library, spacing scale, and information architecture.
- Expected direction: product settings surface; current users; preserve tokens/components/navigation; refine hierarchy and content fit; replace only explicitly deficient elements; expressiveness and motion remain at baseline.
- Must not trigger: full visual reset, new type system, new palette, unrelated component abstraction, or removal of familiar navigation.
- Verification signal: preserve/replace boundary is explicit; before/after evidence uses the same route, state, and viewport; changes outside the boundary are findings.

## Scenario 4 - Mobile Responsive Adaptation

- Input: adapt a desktop booking form to narrow touch devices with long localized labels, validation errors, asynchronous availability, and a fixed design system.
- Expected direction: task-focused transactional surface; priority fields and actions preserved; single-column or deliberate reflow; usable touch targets; reserved error/loading space; low/medium density based on content; motion limited to state feedback.
- Must not trigger: desktop scaled down as-is, clipped labels, horizontal form overflow, hover-only affordances, hidden errors, or layout shifts when async content arrives.
- Verification signal: mobile viewport frames the complete critical task, longest supported content fits, loading/error states do not occlude controls, and keyboard/touch flow is exercised.

## Review Checklist

- The four scenarios produce materially different density, expressiveness, motion, and preserve/replace decisions.
- Existing systems and supplied designs override inferred choices.
- Operational, regulated, and accessibility constraints override novelty.
- Refinement words map to one existing owning skill and verification path.
- Blank, cropped, blocked, asset-failed, or contradicted captures remain invalid, rerun, or unverified.
- No result is described as measured design-quality improvement without real project evidence.
