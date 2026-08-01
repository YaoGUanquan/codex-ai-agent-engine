# Self-Hosted Provider Handoff

Use this protocol only when the user explicitly selects a self-hosted provider that they own or are authorized to operate.

## Opaque Launcher Boundary

The user maintains a launcher outside the target repository and provides its path. The launcher may read the user's Codex provider configuration or another user-owned secret reference, set `OPENAI_API_KEY`, append one `--model <declared-model>`, pass the compatible `openai_base_url` through the CLI's Windows-safe `--codex openai_base_url='...'` override, and cap the isolated session at five delegated workers with `--codex features.multi_agent_v2.max_concurrent_threads_per_session=6` (the parent thread consumes one slot). Setting `OPENAI_BASE_URL` or `CODEX_MODEL` alone is not sufficient for the isolated Security CLI runtime.

AE must never open, parse, inspect, validate, copy, or edit the populated launcher, `config.toml`, `auth.json`, `.env*`, or secret reference. Do not use shell commands that print their contents. Passing the launcher path to the operating system is not permission to inspect it.

## Directory-Based Launcher Bootstrap

When the user explicitly asks to initialize a self-hosted launcher and supplies a user-owned external directory instead of a launcher file, use the following workflow:

1. Derive the fixed output path `<launcher-directory>/codex-security-newapi-launcher.ps1`.
2. Check only that the supplied path is an existing directory and that this exact output path does not already exist. Do not enumerate the directory or open, read, inspect, validate, copy, or overwrite an existing file.
3. If the directory is missing or the output file already exists, stop and report the path-level condition. The user chooses a different directory or handles the existing launcher themselves; AE does not alter an existing launcher.
4. If the output path is absent, create it from [the distributed placeholder template](../templates/self-hosted-provider-launcher.ps1), substituting only `REPLACE_WITH_TARGET_PROJECT_ROOT` with the approved target repository root. The template contains placeholders, never real provider URLs or credentials.
5. Tell the user to manually fill `NewApiBaseUrl`, `NewApiKey`, and `DeclaredModel`. The distributed template appends the model and `--codex openai_base_url` override, so callers must not duplicate `--model` or that `--codex` key. Do not invoke the launcher, inspect its contents, or scan source until the normal source-sharing and named-provider approvals are complete.

Once the user has edited the file, it is a populated launcher and the Opaque Launcher Boundary applies in full. The initializer creates no repository files, secrets, authentication state, or scan artifacts.

## Required Confirmation

Before invocation, record all of the following without sensitive values:

1. The target and scan kind, plus Git baseline when applicable.
2. The provider label chosen by the user and explicit approval for that provider to receive the target source scope.
3. The launcher path and confirmation that it uses the approved project-local CLI.
4. The model declaration: an explicit model ID or `launcher-managed`. `launcher-managed` means the user asserts it matches their intended Codex configuration; AE does not discover the active desktop-session model.
5. The local source-size/token estimate, pricing basis or explicit monetary-estimate uncertainty, and the user's one-scan choice of `no cap` or a concrete USD cap. Never infer or reuse a cap; `$5` is not a default.
6. The external output directory, or the user-authorized `docs/ae/security-scans/.private/<scan-id>/` directory after Git-ignore verification, and the deep-scan acknowledgement when applicable.

## Compatibility And Failure Handling

Treat compatibility as unverified until a non-sensitive Canary completes with CLI exit code `0`, required artifacts, and `coverage.completeness = complete`. A compatible Responses API is required; do not suggest a `chat` wire protocol fallback. A launcher failure, nonzero CLI exit, missing artifacts, incomplete coverage, or provider response failure is an inconclusive scan, not a clean result.

The launcher is not part of the plugin distribution and must not be committed, copied into `docs/`, or presented as an automatically inherited Codex configuration.
