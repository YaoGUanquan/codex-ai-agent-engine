# Deployment Readiness

Before claiming a web-app task is ready to ship, check:

1. Build or type-check commands succeed when they are relevant to the change.
2. Required environment variables or feature flags are identified.
3. Routing, asset loading, and auth redirects work on the changed path.
4. Data schema, seed data, or API contract changes have a rollout note when needed.
5. Browser verification covers the main happy path for the changed feature.
6. Frontend performance is not regressed on the changed path: existing route-level code splitting and lazy loading are preserved, any new heavyweight dependency is justified against what the stack already provides, and new images ship with explicit dimensions and an appropriate format.
