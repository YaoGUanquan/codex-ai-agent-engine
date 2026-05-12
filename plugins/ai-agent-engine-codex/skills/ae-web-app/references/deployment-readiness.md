# Deployment Readiness

Before claiming a web-app task is ready to ship, check:

1. Build or type-check commands succeed when they are relevant to the change.
2. Required environment variables or feature flags are identified.
3. Routing, asset loading, and auth redirects work on the changed path.
4. Data schema, seed data, or API contract changes have a rollout note when needed.
5. Browser verification covers the main happy path for the changed feature.
