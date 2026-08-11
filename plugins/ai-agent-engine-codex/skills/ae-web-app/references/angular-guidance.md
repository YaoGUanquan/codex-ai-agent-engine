# Angular Guidance

Apply this guidance only when the repository uses Angular tooling.

## Structure And Conventions

1. Match the repository's component style: standalone components or NgModules. Do not mix a new style into existing modules.
2. Follow the existing routing, lazy-loading, and dependency-injection conventions before adding new structure.
3. Reuse the established state pattern such as services with signals or RxJS, or the store library already in use, instead of introducing a second one.
4. Extend the component library already in use, such as Angular Material or local components, consistently.

## Common Defect Traps

Check these before claiming an interactive change is done:

1. Subscription hygiene: prefer the async pipe or `takeUntilDestroyed` over manual `subscribe`; never leave a manual subscription without teardown.
2. Derived state: prefer `computed` signals over an `effect` that copies values into extra state; keep `effect` for real side effects.
3. Change detection: with OnPush, make updates visible by replacing objects and arrays or using signals instead of mutating in place.
4. List identity: provide a track expression in `@for`, or `trackBy` in `*ngFor`, when the list can reorder, insert, or delete.
5. Forms: follow the repository's choice of typed reactive forms or template-driven forms, and surface validation errors where the user acts.
6. Async races: cancel stale param-driven requests with a `switchMap`-style operator or the repository's query pattern.

## SSR Boundaries

When server-side rendering or hydration is enabled:

1. Guard browser-only APIs such as `window`, `document`, and storage so server rendering and hydration stay consistent.
2. Keep server-only code out of client bundles.

## User-Facing States

1. Handle loading, empty, error, and mutation feedback in the user-facing route.
2. Show mutation results where the user acts: pending state on the triggering control and a clear failure message with a retry path.

Validate both build correctness and browser behavior for interactive changes.
