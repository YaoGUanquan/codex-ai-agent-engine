# C Guidance

Apply this guidance only when the repository uses C for backend services, daemons, embedded HTTP handlers, or native modules called by other backend code.

## Structure And Conventions

1. Follow the existing module layout, naming, and header discipline; keep declarations in headers and ownership notes where the repository records them.
2. Reuse the repository's existing allocator wrappers, logging channel, and error-code conventions instead of introducing new ones.
3. Match the existing build system (Make, CMake, Meson) and register new sources in it explicitly.
4. Keep functions small with explicit input and output parameters; avoid hidden global state.

## Common Defect Traps

Check these before claiming a backend change is done:

1. Buffer safety: bound every copy and format (`snprintf`, explicit lengths); never trust request-supplied lengths or offsets without validation.
2. Integer safety: check overflow and signedness in size arithmetic before allocations, loops, and index math.
3. Ownership and lifetime: document who allocates and who frees; free exactly once on every path, including early error returns.
4. Error handling: check every fallible call (allocation, IO, parse) and propagate error codes through the repository's cleanup pattern (`goto cleanup` or equivalent).
5. Concurrency: protect shared state with the existing primitives; watch thread-unsafe library calls, `errno` handling, and static buffers on request paths.
6. Undefined behavior: no use-after-free, out-of-bounds access, or unaligned reads; run sanitizer or valgrind builds when the repository supports them.

## Resource And Boundary Discipline

1. Validate all external input (network payloads, headers, file contents) at the entry boundary before use.
2. Release descriptors, handles, and memory on all exit paths; verify with the repository's leak tooling when available.
3. Keep wire-format parsing explicit about endianness, alignment, and string termination.
4. Never place secrets in fixed debug buffers, logs, or core-dump-visible state beyond what the repository already accepts.

## Error And Response Contract

1. Map internal error codes to the protocol response (HTTP status, exit code, errno-style contract) at the boundary layer only.
2. Keep the exported error-code set stable for callers; extend it instead of renumbering.
3. Emit diagnostics through the existing logging channel with enough context to reproduce, without leaking sensitive payloads.

Validate with the repository's build plus its test harness (Unity, CMocka, custom runners), and run sanitizer configurations when configured.
