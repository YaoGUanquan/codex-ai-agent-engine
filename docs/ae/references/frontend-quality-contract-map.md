<!-- ae-codex:reference -->
# Frontend Quality Contract Map

This is a **descriptive maintainer map**, not a fourth contract surface and not a checked schema. It records how the three frontend quality contracts correspond so that a maintainer editing one file can check the counterparts by hand. No validation script enforces this map (decision: 2026-08-11 early completion of roadmap items 7/10 in `docs/08-ai-memory/05-decision-log.md`).

## The Three Contract Files

| Key | File | Role |
| --- | --- | --- |
| A | `plugins/ai-agent-engine-codex/skills/ae-frontend-design/references/web-ui-quality.md` | Implementation/review checklist (15 items) |
| B | `plugins/ai-agent-engine-codex/skills/ae-review/references/code-review-rule-profiles.md` § Frontend Components / Styles | Diff-review lens (6 checks) |
| C | `plugins/ai-agent-engine-codex/skills/ae-test-browser/references/browser-acceptance.md` | Browser acceptance evidence (7 minimum items + Material Motion Evidence) |

Each file also has a byte-identical maintenance mirror under `.ae-source/skills/`, locked by `check-skill-mirror` and `tests/skills-docs.test.mjs`.

## Correspondence Groups

1. **Keyboard and focus reachability** — A#8 (keyboard reachability with visible focus) ↔ B#3 (click handlers on non-interactive elements without keyboard and focus equivalents) ↔ C#7 (keyboard operability of the primary control).
2. **Accessibility affordances** (labels, roles, alt text, contrast) — A#8 (semantic structure, labeled controls, contrast, alt text) ↔ B#4 (affordances removed or weakened by the diff). Gap: C has no dedicated item beyond keyboard; coverage arrives indirectly through the exercised acceptance flow.
3. **Responsive behavior and touch targets** — A#9 (breakpoints the layout actually uses, usable touch targets) ↔ B#5 (hardcoded dimensions that break existing responsive behavior) ↔ C#6 (desktop and mobile checks when responsive behavior is relevant).
4. **Layout and interaction-target stability** — A#7 (interactive elements stable when async data changes) and A#10 (reserved space for late-arriving content) ↔ B#2 (stable keys or track expressions) and B#5 (style changes with global side effects) ↔ C#3 (interaction targets confirmed in the snapshot) and C#5 (screenshot when layout matters).
5. **Material motion and reduced motion** — A#12-14 (motion purpose, static default, `prefers-reduced-motion` alternative with a usable completion state) plus A#15 (decorative-effects boundary) ↔ C § Material Motion Evidence (trigger exercised, completion state without animation, reduced-motion exercised or reported `unverified`). Gap: B has no motion check. Test lock: `tests/skills-docs.test.mjs` test `frontend motion governance is reflected in source and mirror skills` pins the motion/reduced-motion/completion-state keywords in A and C and their mirrors.

## Adjacent Surface

The per-framework guidance files (`react/vue/svelte/angular-guidance.md` under `ae-web-app/references/`, including their legacy counterpart sections added in 0.3.26) overlap B#1 (framework reactivity mistakes) and B#2 (list identity). The lens stays framework-version-agnostic; framework- and era-specific detail lives only in the guidance files. Test lock: `legacy frontend stack counterparts are present in source and mirror skills`.

## Maintenance Expectation

When editing A, B, or C, walk the five groups above and adjust counterparts or record an intentional divergence in the editing batch's notes. Revisit turning this map into a checked contract only if a real drift defect occurs or the contract surface grows beyond these three files; the standing decision prefers this descriptive map over a checker.
