<!-- ae-codex:experience -->
# Frontend Legacy Counterparts And Contract Map Experience (0.3.26)

## Context

Governance batch four deferred roadmap items 7 (legacy frontend stack adaptation) and 10 (frontend quality-contract cross-consistency) behind observable triggers. A 2026-08-11 re-check confirmed no trigger had fired (125/125 tests, three contract files, no attributable legacy-stack miss). The user then explicitly chose early completion over continued dormancy, executing each item's prescribed action ahead of its trigger.

## What shipped (0.3.26)

| Item | Delivery |
| --- | --- |
| Svelte | `svelte-guidance.md` + mirror: `## Svelte 4 Counterparts` (stores, `$:` statements, `onMount`/`onDestroy` cleanup, `export let` + `createEventDispatcher`, no runes mixing) |
| Angular | `angular-guidance.md` + mirror: `## NgModule-Era Counterparts` (module ownership, async pipe or repo teardown pattern, RxJS derivation, OnPush reference updates, `*ngFor trackBy`, `loadChildren`) |
| Vue | `vue-guidance.md` + mirror: `## Options API Counterparts` (`computed:` over copying watchers, watch discipline, v-model era contracts, store helper bindings, Vue 2 reactivity limits, no `<script setup>` mixing) |
| Contract map | `docs/ae/references/frontend-quality-contract-map.md`: five correspondence groups, two coverage gaps (lens has no motion check; acceptance has no dedicated a11y item beyond keyboard), existing test locks; descriptive only, no checker |
| Locks | New test `legacy frontend stack counterparts are present in source and mirror skills` (red first, then green) |

Boundaries kept: stack-conditional first lines and the "match existing repository style" fallback unchanged; the `ae-review` Frontend Components / Styles lens untouched (version-agnostic); `react-guidance.md` out of scope (item 7 named no React legacy stack).

## Reusable lessons

- **A dormant, trigger-gated roadmap item can be closed early by user decision, but the override belongs in the decision log as a new entry, not a rewrite of the deferral.** The original trigger conditions become the new entry's re-evaluate conditions in adapted form.
- **Legacy counterpart sections work as trap-by-trap mappings, not parallel guides.** Six relative statements per framework ("when the repository has not adopted X, use Y") avoid API-availability claims that rot; the only safe absolute claim was that runes do not exist in Svelte 4.
- **A descriptive map beats a checker while the contract surface is small.** The map names exact item numbers plus short quotes so it survives renumbering, and its Maintenance Expectation section tells editors to walk the groups by hand.

## Verification

- `npm run check` — ok at 0.3.26 (release-notes four-file contract, 114 artifacts, 44 registry relations, mirror 126 files)
- `npm test` — 126/126 (new counterpart lock red-to-green)
- `npm run check:smoke` — install + global smoke ok, `verifiedPluginVersion` 0.3.26

Proof boundary: skill docs, mirror, and distribution contracts; not runtime acceptance of Svelte 4 / NgModule / Options API stacks in any target project (the original trigger — a real legacy-stack defect — has still never occurred).
