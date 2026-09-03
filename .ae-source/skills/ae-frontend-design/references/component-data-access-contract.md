# Component And Data-Access Contract

Apply this reference when frontend work creates or materially changes a dialog, drawer, list, table, form, feedback surface, styling pattern, API call, query, or mutation. The target repository remains authoritative for its component library, design tokens, CSS strategy, transport client, state/query library, and directory conventions.

## Discover Before Build

Before adding a component, style, or request path, inspect the nearest existing route, component library, tokens, API client, service, query/mutation helper, and error state. Reuse the established owner when it meets the required behavior. Record a concrete reason when a new owner is necessary; visual preference alone is not enough.

## Ownership Ladder

1. Tokens and primitives own colors, spacing, typography, icons, controls, and accessibility foundations.
2. Shared semantic components own stable interaction and presentation skeletons such as dialogs, drawers, tables, pagers, form fields, empty states, and feedback surfaces.
3. Feature components own domain fields, permissions, feature-specific validation, columns, actions, and composition.
4. Routes compose features, own navigation and page-level orchestration, and do not become a second component or API library.

Do not turn a generic component into a hidden domain workflow. Keep business rules, permission decisions, and feature-specific request sequencing in the feature or route layer.

## Dialog And Drawer Contract

When a target repository has or needs a reusable dialog/drawer pattern, use one that defines title and action regions, open/close ownership, keyboard and focus behavior, responsive sizing, pending/disabled submission, validation and error display, destructive-close confirmation when needed, and cleanup on close or unmount. A feature supplies its fields, permissions, and mutation behavior rather than cloning the shell and its styles.

## List And Table Contract

When a target repository has or needs a reusable list/table pattern, use the established component or helper for row identity, loading, empty, error, retry, filter/sort, pagination or cursor state, row/batch actions, density, and responsive degradation. Feature code supplies domain columns, query parameters, permissions, and action handlers. Do not copy page-local table styles and paging/error behavior when the existing owner can be configured.

## Form Contract

Reuse the target repository's field, layout, and validation presentation pattern. It should expose accessible labels, validation feedback where the user can act, disabled/pending state, reset/cancel, duplicate-submission prevention, and server-error mapping. Keep domain validation, multi-step workflows, and mutation sequencing in feature code unless the repository already owns a reusable feature-level form abstraction.

## Data-Access Contract

Preserve three distinct owners when the repository provides them:

1. Transport client: base URL, auth transport, interceptors, retries, cancellation, envelope parsing, and low-level errors.
2. Domain service or query/mutation owner: endpoint selection, request/response types, field transforms, pagination/cursor decoding, cache invalidation, and normalized outcomes.
3. Rendering component: invokes the selected service/query/mutation owner and presents loading, success, empty, field-error, and retryable-error states.

Do not introduce ad-hoc raw HTTP calls in rendering components, or duplicate auth, envelope parsing, field transforms, pagination decoding, cancellation, retry, or error normalization, when an established local owner exists. Framework route loaders, server components, and SSR boundaries follow their established repository pattern instead of being forced into a client-side abstraction.

## Reuse Trigger And Exceptions

Before a third independently implemented equivalent dialog, drawer, list/table, form, feedback surface, or API-access pattern, perform an extraction review. Reuse or extract a shared semantic owner when the stable behavior is the same. A legitimate exception must name the incompatible behavior, accessibility, authorization, lifecycle, data contract, or performance boundary; different labels or colors alone are not enough.

## Verification

Verify the selected component and data-access boundaries with the target repository's focused tests and browser flow when a runnable UI is changed. Static guidance or a build does not prove target-project API behavior, browser acceptance, or visual consistency.
