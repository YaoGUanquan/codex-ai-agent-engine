# Local Runtime Smoke Gate

Use this gate only when the user explicitly asks to start, execute, automatically run, smoke test, bubble test, or locally integrate a changed local API or UI surface. It does not make a live request mandatory for documentation-only work, isolated unit-test work, or a target that has no runnable local surface.

## Preconditions

1. Confirm that the running target can contain the change. Follow a target project's restart or hot-reload rule; do not infer this from a completed build or passing unit tests.
2. Identify the target route or page, expected signal, request fixture, and whether the operation is read-only or state-changing. A POST is not automatically safe; use only a preview or query path whose contract proves it does not write state.
3. For an authenticated request, require a user-controlled local secret reference, such as an ignored curl config file or an environment variable already set by the user. If one is missing, proactively create a token-free request template at a verified ignored project path or in the operating system temporary directory. The template may contain the bounded route, method, non-secret fixture settings, and one clearly marked credential placeholder; report its absolute path and wait for the user to populate it locally and confirm readiness. A raw credential supplied in chat must not be copied into command text, patches, logs, agent-written files, or tool stdin. After handoff, the agent must not open, read, write, print, or validate the populated reference; it may only pass its absolute path to a client option that consumes the reference without echoing its contents.
4. For a state-changing request, obtain explicit authorization for the exact target and state effect. Prefer a read-only representative request when it proves the requested behavior.

If a precondition is missing, report the exact missing item once and leave runtime validation blocked. Do not repeatedly ask for a prerequisite that the user already confirmed.

## Execute And Record

When the preconditions for a read-only smoke are met, run the bounded request once by referencing the populated secret path or environment variable. Do not inspect the reference before or after the request. Record only the route or page, operation classification, expected signal, actual signal, response status, and unverified scope. Never echo credentials, headers, request configuration contents, or private response data. Archive only this sanitized execution evidence; never archive, commit, relocate, or expose a secret reference, and do not delete a user-populated reference without explicit authorization.

Treat a 4xx, 5xx, transport failure, or business error as a blocked smoke. Preserve the sanitized response evidence, use available target logs when authorized, and request the smallest missing evidence before retrying. Do not claim a pass until the request reaches the intended behavior and its expected signal is observed.

## Capability Boundary

This gate is a process contract, not a secret manager, server-lifecycle controller, browser registration mechanism, production-access grant, or unattended test runner. Use only tools and local access already available in the current Codex session.
