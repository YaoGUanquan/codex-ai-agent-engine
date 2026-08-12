# API Contract Checklist

Before finishing a backend change, verify:

1. Request fields, required values, and validation limits are accurate.
2. Response fields and error shapes still match the intended contract.
3. Auth or permission behavior is explicit.
4. Validation and edge cases are covered by tests or documented as unverified.
5. Data writes, migrations, or deletes have verification and rollback notes.
6. Breaking changes are named explicitly with their affected consumers: renamed or removed fields, changed types, tightened validation, or changed status codes.

## Frontend-Backend Alignment

When a frontend or another client consumes the changed API, also verify:

1. Field naming and casing match the shared contract (camelCase versus snake_case), and any transform layer is applied consistently in both directions.
2. The error envelope (shape, error codes, field-level validation details) matches what frontend error and form states parse.
3. Status codes keep their client-visible meaning: authentication failures distinguishable from authorization failures, validation failures from server errors.
4. Auth transport is explicit: cookie versus bearer header, expiry and refresh behavior, and the CORS or dev-proxy implications for browsers.
5. Pagination, sorting, and filtering parameters plus response metadata (total, cursor, page size) match what the UI consumes.
6. Dates and times use an explicit format and zone (prefer UTC ISO 8601); numbers beyond safe JavaScript integer precision (64-bit IDs, money) travel as strings or an agreed decimal convention.
7. File upload and download contracts state size limits, accepted content types, and failure behavior.
8. The OpenAPI/Swagger source or shared type definitions are updated in the same change; use `ae-swagger-parser` to inspect the contract and `ae-test-api` to verify the changed surface.
