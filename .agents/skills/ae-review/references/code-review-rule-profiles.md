# Code Review Rule Profiles

Use these profiles as optional review lenses when the reviewed scope contains matching files. They do not replace project requirements, reviewer personas, or evidence-backed findings. Do not report an issue only because a profile exists; report it when the scoped code provides concrete evidence and impact.

## How To Use

- Select only profiles relevant to files in the current review scope.
- For diff-like scopes, keep the finding subject on newly added or modified code unless the user requested a wider scan.
- Use unchanged code, deleted code, or neighboring files only as supporting context.
- Prefer precise, fixable findings over broad style commentary.

## General Diff Review

Check for:

- changed logic that no longer satisfies the stated requirement or public contract,
- missing edge handling for new inputs, empty states, errors, or permission outcomes,
- new error paths that hide failures, fabricate defaults, or make rollback harder,
- tests that do not exercise the changed behavior or only assert implementation details,
- new security-sensitive boundaries such as auth, file IO, network calls, secrets, or user-controlled input.

Evidence should name the changed path, the behavior at risk, and the smallest practical fix.

## Java / JVM

Check for:

- nullability assumptions introduced by new method calls, DTO fields, map lookups, or framework injection points,
- concurrency evidence before reporting thread-safety issues, especially shared mutable state, check-then-act sequences, unsafe lazy initialization, or non-atomic compound updates,
- transaction boundaries that no longer cover all writes or external side effects,
- data access inside loops that may create N+1 behavior or avoidable repeated queries,
- streams, files, HTTP clients, or database resources that need deterministic closure.

Do not flag local variables as thread-unsafe without evidence of shared access.

## TypeScript / JavaScript / React

Check for:

- new `any` usage without a clear boundary reason,
- loose equality, unsafe coercion, or implicit truthiness where the changed behavior depends on exact values,
- hooks called conditionally or outside React function/component rules,
- effects missing dependencies, cleanup, or cancellation when new async work is introduced,
- render-time side effects such as network calls, storage writes, or direct DOM mutation,
- user-controlled content reaching HTML injection, dynamic code execution, or string-based timers.

Do not require memoization unless the change creates measurable or structurally obvious render cost.

## package.json

Check for:

- newly added dependencies using floating versions such as `latest` or `*`,
- the same package declared in both runtime and development dependency groups,
- scripts that invoke tools not declared in dependencies, devDependencies, workspace tooling, or documented environment requirements,
- changed scripts that weaken validation, build, or release safety without an explicit plan reason.

Do not report existing dependency choices unless the current diff changes or relies on them.

## JSON / YAML / Config

Check for:

- schema-sensitive keys that look misspelled or placed under the wrong parent,
- duplicated or conflicting entries where only one value can take effect,
- environment-specific values committed into shared defaults,
- accidental secret material, tokens, private endpoints, or credentials,
- changes that make local, CI, and production behavior diverge without documentation.

Prefer parser/schema validation evidence when available.

## SQL

Check for:

- user-controlled values interpolated into SQL text instead of parameterized,
- changed transaction or rollback behavior around multi-step writes,
- migrations without a clear recovery or compatibility path,
- new queries that can multiply by row count, skip pagination, or lock broad ranges,
- changed constraints or defaults that break existing rows.

When reviewing migrations, identify both forward behavior and rollback or recovery signals.
