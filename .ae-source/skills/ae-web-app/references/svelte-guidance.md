# Svelte Guidance

Apply this guidance only when the repository uses Svelte-compatible tooling such as Svelte 5, SvelteKit, or Vite Svelte.

## Structure And Conventions

1. Match the repository's existing reactivity style: Svelte 5 runes (`$state`, `$derived`, `$effect`) or legacy stores and reactive statements. Do not mix a new style into existing modules.
2. Follow SvelteKit file conventions such as `+page`, `+layout`, `+server`, and `$lib` when present instead of inventing parallel structure.
3. Reuse the existing shared-state pattern such as stores, context, or runes in shared modules instead of introducing a second one.

## Common Defect Traps

Check these before claiming an interactive change is done:

1. Derived state: prefer `$derived` or derived stores over an `$effect` that copies values into extra state.
2. Effect discipline: keep `$effect` for real side effects and return cleanup functions for subscriptions, timers, and listeners.
3. List keys: key `{#each}` blocks with a stable identifier when the list can reorder, insert, or delete.
4. Async races: prefer the repository's load-function pattern over component-mount fetches, and guard param-driven fetching against out-of-order responses.
5. Props flow: use `$bindable` props or component events per the repository contract instead of mutating parent state implicitly.

## Svelte 4 Counterparts

When the repository is on Svelte 4 or store-based patterns, apply the same traps with legacy syntax:

1. Derived state: use `derived` stores or `$:` reactive declarations instead of copying values through subscriptions; runes such as `$derived` do not exist in Svelte 4.
2. Effect discipline: side effects live in `$:` statements or `onMount`; register cleanup in `onDestroy` or the `onMount` return for subscriptions, timers, and listeners.
3. Store hygiene: prefer `$store` auto-subscriptions over manual `subscribe`; never leave a manual `subscribe` without its `unsubscribe`.
4. Props flow: use `export let` props with `createEventDispatcher` events instead of `$bindable` or callback props.
5. Do not mix runes syntax into a Svelte 4 repository; keep the existing store and reactive-statement style.

## SvelteKit And SSR Boundaries

1. Keep server-only code in `+server` routes, `+page.server` files, or `$lib/server`, never imported into client components.
2. Use the repository's load functions for data and respect what can be serialized between server and client.
3. Guard browser-only APIs behind the environment check so server-rendered output stays consistent.

## User-Facing States

1. Handle loading, empty, error, and mutation feedback in the user-facing route.
2. When the repository uses form actions, keep progressive enhancement working and surface failures where the user acts.

Validate both build correctness and browser behavior for interactive changes.
