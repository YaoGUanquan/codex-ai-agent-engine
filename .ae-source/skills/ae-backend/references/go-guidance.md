# Go Guidance

Apply this guidance only when the repository uses Go for backend services, with net/http, gRPC, or frameworks such as Gin, Echo, Chi, or Fiber.

## Structure And Conventions

1. Follow the existing module layout (`cmd/`, `internal/`, feature packages) instead of introducing a new one.
2. Return concrete types and accept interfaces only where the repository already does; do not add single-implementation interfaces speculatively.
3. Reuse the established router, middleware chain, and dependency wiring instead of adding a second pattern.
4. Keep package names short and behavior-focused, matching the existing tree.

## Common Defect Traps

Check these before claiming a backend change is done:

1. Error handling: wrap with `fmt.Errorf("...: %w", err)` and branch with `errors.Is`/`errors.As`; never discard an error or shadow it in nested blocks.
2. Context propagation: pass `context.Context` through the call chain and honor cancellation and deadlines in database and HTTP calls.
3. Goroutine leaks: every spawned goroutine needs a bounded exit path; guard shared state and confirm with the race detector when tests exist.
4. JSON contract drift: struct tags and `omitempty` silently drop zero values; confirm the serialized shape against the API contract, not the struct definition.
5. Nil semantics: nil maps panic on write while nil slices append fine; check both on paths fed by decoded input.
6. Resource cleanup: `defer Close()` on response bodies, rows, and files; check errors from deferred closes on write paths.

## Concurrency And Service Boundaries

1. Set explicit timeouts on `http.Server`, HTTP clients, and database pools; unbounded defaults hide production failures.
2. Keep database transactions short and resolve them (commit or rollback) on every path, including error returns.
3. Do not smuggle request-scoped values through globals; use context values only for cross-cutting metadata.
4. Regenerate gRPC or other generated code from the contract source instead of hand-editing generated files.

## Error And Response Contract

1. Map internal errors to the repository's HTTP or gRPC error shape at the handler boundary, not deep in services.
2. Keep status codes and error payloads consistent with existing handlers so clients and the frontend keep working.
3. Log the wrapped internal error server-side; return the sanitized contract error to callers.

Validate with `go build ./...`, `go vet ./...`, and the repository's test command, narrowing to touched packages first.
