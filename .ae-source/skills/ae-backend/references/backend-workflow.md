# Backend Workflow

Use this sequence for backend implementation work:

1. Detect the backend stack from manifests and build files (`pom.xml`/`build.gradle`, `go.mod`, `pyproject.toml`/`requirements.txt`, `*.csproj`/`*.sln`, `CMakeLists.txt`/`Makefile`, `package.json`) before assuming a language or framework.
2. Confirm the route or entrypoint, request shape, response shape, and auth boundary.
3. Inspect the service and data path end to end before changing anything.
4. Limit edits to the narrowest set of files that owns the behavior.
5. Add or update tests for the changed contract.
6. Validate with the smallest meaningful command, then broader checks if the change touches shared behavior.

Escalate attention when the change touches:

- public API contracts,
- auth or authorization,
- migrations or schema changes,
- shared config,
- background jobs or external integrations,
- serialization shapes consumed by a frontend or another service.
