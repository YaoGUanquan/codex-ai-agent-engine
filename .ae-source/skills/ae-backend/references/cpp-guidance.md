# C++ Guidance

Apply this guidance only when the repository uses C++ for backend services or APIs (Drogon, Crow, Pistache, gRPC, custom servers) or performance-critical native components.

## Structure And Conventions

1. Follow the existing project structure, namespace layout, and build-system targets (CMake modules) instead of restructuring.
2. Match the repository's error-handling convention: exceptions, `std::expected`/status types, or error codes; do not mix a second convention into the same path.
3. Reuse the established utility, logging, and serialization layers rather than adding parallel dependencies.
4. Keep headers light: forward-declare where the codebase does, and keep logic out of headers unless the repository is header-only.

## Common Defect Traps

Check these before claiming a backend change is done:

1. Ownership: express it with `unique_ptr`, `shared_ptr`, or values per repository convention; rely on RAII so no path leaks on exceptions or early returns.
2. Lifetimes: no dangling `string_view`, `span`, or captured references to temporaries, especially across async handler boundaries and lambda captures.
3. Copies and moves: avoid accidental copies of large payloads on hot paths; never use moved-from objects.
4. Concurrency: guard shared state with the existing primitives, keep lock scope minimal, and check handler-thread data races (TSan when available).
5. Exception safety: invariants must hold if a throw happens mid-operation; mark `noexcept` only when true.
6. Undefined behavior: no out-of-bounds access, uninitialized reads, or invalid casts; run ASan/UBSan builds when the repository supports them.

## Service And Interface Boundaries

1. Validate and bound all external input at the transport boundary before it reaches business logic.
2. Treat ABI stability as part of the contract for shared libraries: signature or layout changes break binary consumers.
3. Resolve every async continuation's object lifetime explicitly (shared ownership or cancellation) before claiming a handler is safe.
4. Regenerate protocol and serialization code (protobuf, FlatBuffers) from the contract source instead of editing generated files.

## Error And Response Contract

1. Translate internal exceptions or status types into the repository's response envelope at the handler layer; do not leak raw exception text to clients.
2. Keep status codes and error payloads consistent with existing handlers so clients and the frontend keep working.
3. Log internal diagnostics with context server-side; return sanitized contract errors.

Validate with the repository's build plus its test framework (GoogleTest, Catch2, doctest), and run sanitizer configurations when configured.
