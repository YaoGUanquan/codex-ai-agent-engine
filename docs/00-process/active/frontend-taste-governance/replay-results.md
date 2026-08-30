# Frontend Taste Governance Replay Results

- Date: 2026-08-30
- Skill/ref version: 0.3.35 working tree
- Input: `docs/ae/templates/frontend-design-quality-replay.md`
- Method: manual guidance replay against the four scenario cards
- Overall result: passed for direction differentiation and negative assertions
- Evidence boundary: this replay proves the written contract yields distinct, inspectable direction records. It does not prove browser rendering, pixel fidelity, user preference, or measured design-quality improvement; those remain `unverified` because no stable target-product UI fixture was available.

## Scenario 1 - Marketing Launch Page

- Surface, audience, job: public marketing surface; prospective buyers; understand the offer and convert.
- Baseline/assets: approved brand system, editorial photography, and real product assets are authoritative; no existing page layout to preserve.
- Hierarchy/type/palette: product and offer lead; expressive brand typography within approved families; brand palette with accessible contrast.
- Spacing/density/expressiveness: editorial spacing, medium density, medium/high expressiveness where product evidence supports it.
- Motion/responsive/content: motion only explains product relationships or feedback; mobile preserves product, offer, proof, and primary action order; use supplied photography rather than decoration.
- Preserve/replace/avoid: preserve brand assets and tokens; create the page composition; avoid dashboard density, invented gradients/colors, purposeless motion, and a split hero that obscures the product.
- Confidence/evidence: high for brand/assets and conversion priority from the brief; medium for final composition pending browser evidence.
- Result: passed. None of the negative assertions was selected by the derived direction.

## Scenario 2 - Dense Operational Console

- Surface, audience, job: operational console; expert support staff; scan, compare, and act repeatedly with auditability.
- Baseline/assets: existing tokens, table patterns, keyboard workflows, and audit requirements are authoritative.
- Hierarchy/type/palette: task and data hierarchy over visual novelty; compact readable type; calm existing palette with state colors reserved for meaning.
- Spacing/density/expressiveness: high information density, stable alignment, low expressiveness.
- Motion/responsive/content: motion limited to immediate state feedback; constrained widths preserve primary actions and comparison context; data and audit content outrank decoration.
- Preserve/replace/avoid: preserve navigation, tokens, table behavior, and keyboard flow; refine scanability only; avoid hero typography, decorative card bands, marketing composition, novelty navigation, and delaying animation.
- Confidence/evidence: high from the established system and workflow constraints; browser scan/focus behavior remains unverified.
- Result: passed. Direction is materially distinct from the marketing scenario and excludes every listed negative trigger.

## Scenario 3 - Preserve-Style Redesign

- Surface, audience, job: account settings; current users; complete familiar configuration tasks with less friction.
- Baseline/assets: brand, component library, spacing scale, and information architecture must remain recognizable.
- Hierarchy/type/palette: clarify grouping and labels inside the existing type and color systems.
- Spacing/density/expressiveness: retain baseline density and expressiveness; change spacing only where hierarchy or content fit is deficient.
- Motion/responsive/content: retain baseline motion unless state feedback is missing; preserve route and content order across supported widths.
- Preserve/replace/avoid: preserve tokens, components, navigation, and mental model; replace only evidenced deficiencies; avoid a visual reset, new type system/palette, unrelated abstractions, or familiar-navigation removal.
- Confidence/evidence: high for preserve boundaries from the brief; before/after quality remains unverified without same-state screenshots.
- Result: passed. Preserve/replace boundaries are explicit and all negative assertions remain excluded.

## Scenario 4 - Mobile Responsive Adaptation

- Surface, audience, job: transactional booking form; touch-device users; complete booking despite localization, validation, and async availability.
- Baseline/assets: fixed design system and desktop field semantics remain authoritative; desktop layout is not authoritative at narrow widths.
- Hierarchy/type/palette: critical fields, errors, availability, and submit action lead; existing type/palette continue with readable localized labels.
- Spacing/density/expressiveness: deliberate single-column/reflow layout, touch-safe spacing, low/medium density, restrained expressiveness.
- Motion/responsive/content: motion only communicates async state; reserve loading/error space; longest supported labels and complete critical task must fit without horizontal overflow.
- Preserve/replace/avoid: preserve field meaning, action priority, and design tokens; replace desktop-only layout/hover assumptions; avoid scaled-down desktop layout, clipping, hover-only affordances, hidden errors, and async layout shifts.
- Confidence/evidence: high for responsive constraints from the brief; keyboard/touch and viewport behavior remain unverified without a runnable fixture.
- Result: passed. Derived direction covers localized, loading, error, touch, and layout-stability constraints without triggering prohibited behavior.

## Cross-Scenario Result

- Density differs: marketing medium, console high, preserve-style baseline, mobile low/medium.
- Expressiveness differs: marketing medium/high, console low, preserve-style baseline, mobile restrained.
- Motion differs by purpose and never becomes decoration.
- Existing systems override inference in the three scenarios that provide a baseline.
- Negative assertions are explicit and scenario-specific.
- Browser acceptance: `unverified`; no stable product fixture was available, so no screenshots or Playwright claims are recorded.
