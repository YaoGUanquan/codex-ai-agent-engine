# Vue Guidance

Apply this guidance only when the repository uses Vue-compatible tooling such as Vue 3, Nuxt, or Vite Vue.

## Structure And Conventions

1. Match the repository's existing API style: Composition API with `<script setup>` or Options API. Do not mix a new style into existing modules.
2. Follow the existing routing, layout, and directory conventions such as Vue Router modules or Nuxt pages and layouts before adding new structure.
3. Reuse the established state layer such as Pinia stores, shared composables, or provide/inject instead of introducing a second pattern.
4. Extend the component library already in use, such as Element Plus, Ant Design Vue, Naive UI, or local components, consistently.

## Common Defect Traps

Check these before claiming an interactive change is done:

1. Reactivity loss: do not destructure reactive objects without `toRefs`, and use `storeToRefs` when pulling state out of a Pinia store.
2. Derived state: prefer `computed` over a `watch` that copies values into extra state.
3. Watch discipline: give `watch` explicit sources and cleanup; use `watchEffect` only when implicit dependency tracking is genuinely wanted.
4. List keys: use stable identifiers for `v-for`, and do not combine `v-if` with `v-for` on the same node.
5. Props flow: keep one-way data flow; emit events instead of mutating props, and follow the `v-model` or `defineModel` contracts the repository already uses.
6. Async races: guard fetches driven by route params or inputs against out-of-order responses, and handle route param changes when a routed component instance is reused.

## Nuxt And SSR Boundaries

When the repository uses Nuxt or another SSR setup:

1. Keep server-only code such as secrets and database access in server routes or server utilities, never in client bundles.
2. Use the repository's data-fetching pattern such as `useFetch`, `useAsyncData`, or its query library instead of raw lifecycle-hook fetches.
3. Guard hydration-sensitive rendering such as dates, locale, random values, and browser-only APIs so server and client output match.

## User-Facing States

1. Handle loading, empty, error, and mutation feedback in the user-facing route.
2. Show mutation results where the user acts: pending state on the triggering control and a clear failure message with a retry path.

Validate both build correctness and browser behavior for interactive changes.
