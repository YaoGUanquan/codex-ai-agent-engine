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

## NgModule-Era Counterparts

When the repository uses NgModules without signals, apply the same traps with the legacy APIs:

1. Declare components, directives, and pipes in the owning NgModule and respect existing shared or feature module boundaries instead of converting files to standalone.
2. Subscription hygiene: prefer the async pipe; otherwise use the repository's teardown pattern such as `takeUntil(destroy$)` or collected `Subscription` teardown in `ngOnDestroy`.
3. Derived state: derive values with RxJS operators or pure pipes instead of `computed` signals; keep recomputation out of template method calls.
4. Change detection: with OnPush, emit new object and array references through observables and the async pipe instead of relying on signal invalidation.
5. List identity: use `*ngFor` with `trackBy` when the repository has not adopted the `@for` block.
6. Lazy loading: follow the existing `loadChildren` module routes instead of introducing `loadComponent` alongside them.

## SSR Boundaries

When server-side rendering or hydration is enabled:

1. Guard browser-only APIs such as `window`, `document`, and storage so server rendering and hydration stay consistent.
2. Keep server-only code out of client bundles.

## User-Facing States

1. Handle loading, empty, error, and mutation feedback in the user-facing route.
2. Show mutation results where the user acts: pending state on the triggering control and a clear failure message with a retry path.

Validate both build correctness and browser behavior for interactive changes.
