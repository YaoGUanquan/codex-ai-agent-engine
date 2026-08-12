# React Guidance

Apply this guidance only when the repository uses React-compatible tooling such as React, Next.js, Remix, or Vite React.

## Structure And Conventions

1. Follow the existing file and routing structure before adding new abstractions.
2. Keep component state local unless the repository already uses a shared state layer.
3. Reuse established data-fetching and mutation patterns instead of inventing a new one.
4. When shadcn or another component system is present, extend it consistently.

## Common Defect Traps

Check these before claiming an interactive change is done:

1. Derived state: compute derivable values during render instead of syncing them into extra state with an effect.
2. Effect discipline: reserve `useEffect` for real side effects such as subscriptions, DOM access, or external systems; declare the actual dependencies and clean up subscriptions, timers, and listeners.
3. List keys: use stable identifiers, not array indexes, when the list can reorder, insert, or delete.
4. Async races: when a route param or input drives fetching, guard against out-of-order responses with abort, a stale-result guard, or the repository's query library.
5. Controlled inputs: keep an input either controlled or uncontrolled for its whole lifetime; initialize form state from props only intentionally.
6. Memoization: add `useMemo`, `useCallback`, or `memo` for a demonstrated re-render or referential-identity problem, not by default.

## Next.js And Server Boundaries

When the repository uses server components or SSR:

1. Keep components server-rendered by default; add `"use client"` only where event handlers, state, or browser APIs are needed.
2. Never import server-only modules such as secrets or database clients into client components.
3. Respect the repository's data-fetching pattern: server-side fetching, route handlers, or the client query library already in use.
4. Confirm hydration-sensitive rendering such as dates, locale, and random values produces the same markup on server and client.

## User-Facing States

1. Handle loading, empty, error, and mutation feedback in the user-facing route.
2. Show mutation results where the user acts: pending state on the triggering control and a clear failure message with a retry path.
3. Use error boundaries or the framework's error routes for render failures instead of leaving a blank screen.

Validate both build correctness and browser behavior for interactive changes.
