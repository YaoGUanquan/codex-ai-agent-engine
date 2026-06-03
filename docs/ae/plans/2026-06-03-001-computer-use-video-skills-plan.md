---
type: plan
status: ready
date: 2026-06-03
title: computer-use-video-skills
origin: inline user requirements from 2026-06-03 conversation
originFingerprint: n/a
---

# Plan: Computer Use Video Skills

## Source

The user wants three Codex skills for stable desktop automation and video production:

- A strict guard skill for Codex App `Computer Use`, especially when requests pass through a low-resource 2G/4-core upstream or relay server that can be rate-limited or blocked by oversized screenshot/context payloads.
- An image generation prompt skill that turns simple user requests into controlled image-generation prompts and supports video storyboard asset creation.
- A desktop video editing skill that uses local tools and generated assets first, then uses `Computer Use` only for required GUI operations in Windows editing software such as Jianying/CapCut, Premiere Pro, or DaVinci Resolve.

The design must default to a beginner-safe mode so users with no experience can use it reliably, while allowing experienced users to configure profiles for stronger servers.

## Scope

In scope:

- Add three skills:
  - `ae-computer-use-guard`
  - `ae-imagegen-prompt`
  - `ae-video-edit-computer`
- Add profile-based configuration guidance for user mode and server capacity.
- Add one shared beginner/expert profile contract used by all three skills.
- Add an optional runtime configuration convention at `.codex/ae-skill-profiles.yaml`.
- Add an example configuration template at `docs/ae/templates/ae-skill-profiles.example.yaml`.
- Mirror skill files in both project-local and plugin-packaged skill trees.
- Add concise references for budgets, profile rules, and video workflow stages.
- Add UI metadata in `agents/openai.yaml`.
- Update user-facing help or skill listings if the project keeps an explicit skill inventory.
- Validate structure and mirror consistency with existing project scripts.

Out of scope:

- Implement a real MCP server.
- Modify the Codex `Computer Use` plugin internals.
- Add hooks that enforce request body limits at runtime.
- Add full FFmpeg wrappers, Resolve/Premiere/CapCut adapters, or GUI automation scripts.
- Guarantee upstream anti-abuse behavior. The skills reduce risk through behavior constraints, but hard API limits require server-side enforcement.

## Readiness

- Goal: create an implementation-ready plan for three new AE skills that make `Computer Use` safer and usable for beginner video-editing workflows.
- Acceptance criteria:
  - The plan defines exact files to create or modify.
  - The plan defines beginner, standard, expert user modes and low-resource, standard, high-capacity server profiles.
  - The plan preserves global hard limits that cannot be bypassed by higher server capacity.
  - The plan explains how `ae-video-edit-computer` depends on `ae-computer-use-guard` and `ae-imagegen-prompt`.
  - The plan includes validation commands and review gates.
- Non-goals:
  - No code or skill implementation in this planning step.
  - No external MCP installation.
  - No server deployment changes.
- Affected areas:
  - `.agents/skills`
  - `plugins/ai-agent-engine-codex/skills`
  - `docs/ae/templates`
  - possibly `README.md`, `README.en.md`, or `.codex-plugin/plugin.json` if skill inventory is manually maintained.
- Validation surface:
  - File presence.
  - Skill frontmatter shape.
  - OpenAI metadata shape.
  - Existing project checks: `npm run check` and `npm test`.
  - Manual review of trigger descriptions and cross-skill dependency wording.
- Open questions: none blocking. The first implementation uses `.codex/ae-skill-profiles.yaml` as an optional runtime config path and ships `docs/ae/templates/ae-skill-profiles.example.yaml` as the editable example.
- Readiness result: ready for implementation. The shared profile contract, three skill units, file ownership, validation commands, rollback signals, and deferred runtime enforcement are all defined.

## Assumptions

- The current project mirrors skills between `.agents/skills` and `plugins/ai-agent-engine-codex/skills`.
- The existing `scripts/check-skill-mirror.mjs` and `scripts/check-skill-language-metadata.mjs` should catch mirror or metadata drift.
- The first implementation should be instruction-first and avoid introducing runtime dependencies.
- The safest default must assume an unknown or low-resource relay server.
- If `.codex/ae-skill-profiles.yaml` is missing, invalid, or exceeds hard limits, the skills must continue with safe defaults instead of failing.

## Alternatives Considered

- Recommended: implement three skills with one strict guard foundation and documented profile configuration.
- Alternative: implement five skills by splitting task decomposition and memory cleaning into separate skills.
- Rejected because: separate memory/task-decomposition skills duplicate the same safety mechanism and create ambiguous trigger ordering for beginners.
- Alternative: make MCP/FFmpeg the primary deliverable first.
- Rejected because: the user's immediate risk is unsafe `Computer Use` behavior and request size. MCP can reduce GUI use later, but it does not constrain `Computer Use` by itself.

## Decision Drivers

- Driver 1: Beginner users should not need to understand token budgets, screenshot compression, or upstream risk to get safe behavior.
- Driver 2: Low-resource relay servers require conservative defaults, but higher-capacity servers need configurable profiles.
- Driver 3: `Computer Use` should be the final GUI operation layer, not the media processing or planning layer.

## Decisions

### ADR-1 - Use three skills, not five

- Decision: Create `ae-computer-use-guard`, `ae-imagegen-prompt`, and `ae-video-edit-computer`.
- Drivers: simple trigger model, clear dependencies, beginner-safe default behavior.
- Alternatives: separate `task-decomposition` and `memory-cleaner` skills.
- Why chosen: task decomposition and memory cleaning are not independent user goals here; they are guard behavior inside `ae-computer-use-guard`.
- Consequences: `ae-computer-use-guard` must include strict stage checkpoints, screenshot budget, context summary, and stop conditions.
- Follow-ups: hooks or server middleware can later enforce the same limits outside skill instructions.

### ADR-2 - Default to beginner + low-resource profile

- Decision: The default mode is `user_mode: beginner` and `server_profile: low_resource`.
- Drivers: unknown user experience, unknown server capacity, high risk of screenshot/context payload growth.
- Alternatives: auto-detect server capacity or default to standard.
- Why chosen: skill text cannot reliably detect relay capacity; conservative defaults avoid the most dangerous failure mode.
- Consequences: first-run tasks may be slower and more segmented, but more stable.
- Follow-ups: expert users can opt into standard or high-capacity profiles inside documented hard limits.

### ADR-3 - Keep global hard limits across all profiles

- Decision: Some limits cannot be bypassed by expert mode or high-capacity servers.
- Drivers: upstream policy/rate-limit risk, model context cost, repeated screenshot failure patterns.
- Alternatives: allow high-capacity mode to remove all limits.
- Why chosen: stronger servers reduce local resource pressure but do not remove upstream request-size or anti-abuse risk.
- Consequences: high-capacity mode improves image size and stage length modestly, but still requires one image per request, no old screenshots, checkpoints, and failure stops.
- Follow-ups: if server middleware is added, skill hard limits should align with middleware rejection thresholds.

### ADR-4 - Make video editing depend on local tooling first

- Decision: `ae-video-edit-computer` routes file inspection, video analysis, preprocessing, generated assets, and validation to local tools before using `Computer Use`.
- Drivers: reduce screenshots, reduce context, avoid using GUI for deterministic file/media work.
- Alternatives: let `Computer Use` perform the whole editing workflow.
- Why chosen: GUI observation is the token-heavy path; local tools return compact structured output.
- Consequences: the skill should include phase boundaries and exact examples of what not to do through `Computer Use`.
- Follow-ups: later add optional FFmpeg/MCP/Resolve/CapCut adapters.

### ADR-5 - Use one shared profile contract for all three skills

- Decision: All three skills must support the same `user_mode`, `server_profile`, override, validation, and fallback semantics.
- Drivers: beginners need consistent defaults, experts need one predictable configuration file, and duplicated profile rules create drift.
- Alternatives: define profiles independently inside each skill.
- Why chosen: a shared contract prevents `ae-imagegen-prompt` and `ae-video-edit-computer` from becoming less safe or less configurable than `ae-computer-use-guard`.
- Consequences: implementation starts with a shared profile unit before individual skill units.
- Follow-ups: later hooks or middleware can consume the same config shape.

## Risks

- Users may expect the skill to technically resize screenshots. In the first implementation, it can only instruct and constrain behavior unless paired with a tool or hook.
- Beginner mode may feel slow because it pauses after small stages.
- Expert profile may be misread as permission to bypass upstream risk unless global hard limits are clear.
- The video skill may overpromise if it names software-specific APIs before adapters exist.
- The three skills may drift if each copies profile rules manually without a shared reference and validation checklist.

## Pre-Mortem

- Failure scenario 1: A beginner asks for "make a full video" and the agent enters `Computer Use` immediately with repeated screenshots.
  - Mitigation: `ae-video-edit-computer` must require local planning and `ae-computer-use-guard` before any GUI stage.
- Failure scenario 2: A high-capacity server profile allows too many images or old screenshots and still triggers upstream risk controls.
  - Mitigation: keep `max_images_per_request: 1` and `keep_old_screenshots: false` as global hard limits.
- Failure scenario 3: Skill text becomes too long and increases context by itself.
  - Mitigation: keep `SKILL.md` concise and move profile tables/workflow templates into `references/`.
- Failure scenario 4: `ae-imagegen-prompt` or `ae-video-edit-computer` omits beginner/expert behavior while `ae-computer-use-guard` includes it.
  - Mitigation: add U0 shared profile contract and require each skill unit to reference it explicitly.

## Implementation Units

### U0 - Create shared beginner/expert profile contract

- Goal: Define one configuration contract that all three skills use by default.
- Requirements covered:
  - All skills default to a mode usable by people with no experience.
  - All skills allow expert users to configure behavior safely.
  - Missing, invalid, or excessive config cannot make a skill unsafe.
- Acceptance criteria covered:
  - The optional config path is fixed as `.codex/ae-skill-profiles.yaml`.
  - The default is `user_mode: beginner` and `server_profile: low_resource`.
  - Every configurable field is whitelisted per skill.
  - Every override is clamped to global or skill-specific hard limits.
- Depends on: none.
- Files:
  - Create `docs/ae/templates/ae-skill-profiles.example.yaml`
  - Create `.agents/skills/ae-computer-use-guard/references/shared-profile-contract.md`
  - Create `.agents/skills/ae-imagegen-prompt/references/shared-profile-contract.md`
  - Create `.agents/skills/ae-video-edit-computer/references/shared-profile-contract.md`
  - Mirror the three skill reference files under `plugins/ai-agent-engine-codex/skills/*/references/shared-profile-contract.md`
- Approach:
  - Define the shared config shape:
    - `user_mode: beginner | standard | expert`
    - `server_profile: low_resource | standard | high_capacity`
    - `skill_overrides.ae-computer-use-guard`
    - `skill_overrides.ae-imagegen-prompt`
    - `skill_overrides.ae-video-edit-computer`
  - Define fallback behavior:
    - missing config: use beginner + low_resource,
    - invalid YAML or unknown fields: ignore invalid values and warn,
    - values above hard limits: clamp and report the effective value,
    - unsafe combinations: downgrade the risky field only, not the whole task.
  - Define beginner behavior:
    - ask minimal questions,
    - choose safe defaults automatically,
    - explain only the current step,
    - hide advanced options unless the user asks.
  - Define expert behavior:
    - read optional config,
    - show effective config before risky work,
    - allow only whitelisted overrides,
    - never bypass global hard limits.
  - Define a shared "effective config" report that every skill can emit in one compact block.
- Tests:
  - Inspect the example YAML for all three skill override sections.
  - Inspect each new skill plan unit to confirm it references the shared contract.
  - Validate mirror check passes after implementation.
- Validation:
  - `npm run check`
  - `npm test`
- Rollback signals:
  - Example config encourages unsafe values.
  - Shared profile contract contradicts a skill-specific hard limit.
  - Unknown config behavior is ambiguous.
- Deferred to implementation:
  - Runtime YAML parsing helper.
  - Hook or middleware integration that enforces the same config shape outside skill instructions.

### U1 - Create `ae-computer-use-guard`

- Goal: Add the strict guard skill that controls use of Codex `Computer Use`.
- Requirements covered:
  - Beginner-safe default mode.
  - Configurable user/server profiles.
  - Strong screenshot and context controls.
  - Stop conditions for unsafe or unstable GUI automation.
- Acceptance criteria covered:
  - The skill can be triggered by `Computer Use`, `@Computer`, desktop control, Windows app control, GUI automation, or editing software operation.
  - The skill requires an execution contract before GUI control.
  - The skill defines global hard limits that survive all profiles.
- Depends on:
  - U0 shared beginner/expert profile contract.
- Files:
  - Create `.agents/skills/ae-computer-use-guard/SKILL.md`
  - Create `.agents/skills/ae-computer-use-guard/agents/openai.yaml`
  - Create `.agents/skills/ae-computer-use-guard/references/profiles.md`
  - Create `.agents/skills/ae-computer-use-guard/references/execution-contract.md`
  - Create `.agents/skills/ae-computer-use-guard/references/shared-profile-contract.md`
  - Mirror the same files under `plugins/ai-agent-engine-codex/skills/ae-computer-use-guard/`
- Approach:
  - Keep `SKILL.md` short: trigger, workflow, hard rules, final reporting.
  - Require the skill to load or summarize `references/shared-profile-contract.md` before using any configured override.
  - Put detailed profile matrices in `references/profiles.md`.
  - Put the required pre-Computer-Use contract template in `references/execution-contract.md`.
  - Include default `beginner + low_resource` behavior.
  - Include server profiles:
    - `low_resource`: 960x540, quality 45, one screenshot per stage, 3 actions per stage.
    - `standard`: 1280x720, quality 55, two screenshots per stage, 5 actions per stage.
    - `high_capacity`: 1600x900, quality 65, three screenshots per stage, 8 actions per stage.
  - Include global hard limits:
    - one image per request,
    - no old screenshots,
    - no raw video upload,
    - no unbounded context,
    - checkpoint required,
    - repeated failure stop required.
  - Include expert-configurable whitelist:
    - `user_mode`,
    - `server_profile`,
    - `max_screenshots_per_stage`,
    - `max_actions_per_stage`,
    - `max_image_width`,
    - `max_image_height`,
    - `image_quality`,
    - `max_stage_minutes`,
    - `max_failures_per_stage`.
  - Include non-configurable fields:
    - `max_images_per_request`,
    - `keep_old_screenshots`,
    - `allow_raw_video_upload`,
    - `allow_unbounded_context`,
    - `require_stage_checkpoint`.
- Tests:
  - Validate frontmatter uses only `name` and `description`.
  - Validate metadata exists in `agents/openai.yaml`.
  - Validate mirror check passes.
- Validation:
  - `npm run check`
  - `npm test`
- Rollback signals:
  - Skill mirror check fails.
  - Metadata check fails.
  - Trigger wording hijacks unrelated tasks such as normal shell commands.
- Deferred to implementation:
  - Optional Codex hooks for `PreToolUse` and `PreCompact`.
  - Server middleware body-size enforcement.

### U2 - Create `ae-imagegen-prompt`

- Goal: Add a dedicated image generation prompt skill for single images, edits, style references, and video storyboard assets.
- Requirements covered:
  - User can provide a short phrase and get an optimized image prompt.
  - Skill supports full, partial, or absent visual assets for later video creation.
  - Skill labels reference image roles.
  - Beginner users get safe defaults without knowing image-generation terminology.
  - Expert users can tune allowed prompt and output controls.
- Acceptance criteria covered:
  - The skill can output structured image prompt fields and a concise user-facing summary.
  - The skill can create prompts suitable for 9:16, 16:9, 1:1, and common asset uses.
- Depends on:
  - U0 shared beginner/expert profile contract.
- Files:
  - Create `.agents/skills/ae-imagegen-prompt/SKILL.md`
  - Create `.agents/skills/ae-imagegen-prompt/agents/openai.yaml`
  - Create `.agents/skills/ae-imagegen-prompt/references/prompt-templates.md`
  - Create `.agents/skills/ae-imagegen-prompt/references/reference-image-roles.md`
  - Create `.agents/skills/ae-imagegen-prompt/references/shared-profile-contract.md`
  - Mirror the same files under `plugins/ai-agent-engine-codex/skills/ae-imagegen-prompt/`
- Approach:
  - Keep `SKILL.md` focused on classification, required fields, prompt expansion, provider controls, verification, and retry limits.
  - In beginner mode:
    - infer aspect ratio from use case,
    - ask at most one clarification if the output use is unclear,
    - use conservative default output count,
    - avoid exposing style weights or negative prompt tuning unless needed.
  - In expert mode:
    - read allowed overrides from `.codex/ae-skill-profiles.yaml`,
    - show effective config before batch generation or video storyboard output,
    - clamp output counts and style/negative prompt controls to hard limits.
  - Include reference roles:
    - edit target,
    - style reference,
    - subject identity reference,
    - composition reference,
    - composite source.
  - Include aspect inference:
    - short video: 9:16,
    - landscape video: 16:9,
    - avatar/icon: 1:1,
    - cover/social: user-specified or conservative default.
  - Include video storyboard output shape that `ae-video-edit-computer` can consume.
  - Include expert-configurable whitelist:
    - `default_aspect_ratio`,
    - `output_count`,
    - `style_strength`,
    - `prompt_language`,
    - `negative_prompt_level`,
    - `video_storyboard_mode`,
    - `reference_fidelity`,
    - `ask_before_generation`.
  - Include hard limits:
    - `max_output_count: 4`,
    - `require_reference_image_roles: true`,
    - `must_preserve_user_intent: true`,
    - `no_unrequested_sensitive_style_transfer: true`.
- Tests:
  - Validate skill frontmatter and metadata.
  - Validate reference files are present and concise.
  - Validate mirror check passes.
- Validation:
  - `npm run check`
  - `npm test`
- Rollback signals:
  - The skill duplicates `ae-prompt-optimize` without image-specific controls.
  - The skill implies it can generate images when only prompt optimization is requested.
- Deferred to implementation:
  - Actual image generation calls.
  - Contact sheet or visual QA scripts.

### U3 - Create `ae-video-edit-computer`

- Goal: Add the video editing orchestration skill that uses local tools and generated assets first, then constrained `Computer Use` for GUI operations.
- Requirements covered:
  - Supports all images provided, partial images provided, or no images provided.
  - Works with beginner users by decomposing the task automatically.
  - Uses `ae-computer-use-guard` before any GUI operation.
  - Uses `ae-imagegen-prompt` when image assets are missing or need generation.
  - Expert users can configure editor preferences, output settings, and stage budgets within hard limits.
- Acceptance criteria covered:
  - The skill defines stages from asset inventory to export validation.
  - The skill names what must not be done through `Computer Use`.
  - The skill includes local validation examples such as file existence, ffprobe, and frame sampling.
- Depends on:
  - U0 shared beginner/expert profile contract.
  - U1 `ae-computer-use-guard`
  - U2 `ae-imagegen-prompt`
- Files:
  - Create `.agents/skills/ae-video-edit-computer/SKILL.md`
  - Create `.agents/skills/ae-video-edit-computer/agents/openai.yaml`
  - Create `.agents/skills/ae-video-edit-computer/references/workflow-stages.md`
  - Create `.agents/skills/ae-video-edit-computer/references/asset-modes.md`
  - Create `.agents/skills/ae-video-edit-computer/references/local-tool-routing.md`
  - Create `.agents/skills/ae-video-edit-computer/references/shared-profile-contract.md`
  - Mirror the same files under `plugins/ai-agent-engine-codex/skills/ae-video-edit-computer/`
- Approach:
  - In beginner mode:
    - ask only for the required output target when missing,
    - choose a safe short-video workflow by default,
    - inventory assets before opening any GUI,
    - split the workflow into small stages automatically,
    - stop and summarize after each GUI stage.
  - In expert mode:
    - read editor, platform, output, and stage overrides from `.codex/ae-skill-profiles.yaml`,
    - show effective config before using `Computer Use`,
    - preserve hard dependencies on local inventory and `ae-computer-use-guard`.
  - Stage 0: clarify output format, duration, target platform, and available assets.
  - Stage 1: inventory assets using filesystem or shell, not GUI screenshots.
  - Stage 2: create script/timeline plan.
  - Stage 3: route missing image assets to `ae-imagegen-prompt`.
  - Stage 4: preprocess and validate media locally where possible.
  - Stage 5: invoke `ae-computer-use-guard` and use `Computer Use` only for GUI-required steps.
  - Stage 6: export and validate output locally.
  - Include editor-specific notes for Jianying/CapCut, Premiere Pro, and DaVinci Resolve without claiming adapters exist.
  - Include expert-configurable whitelist:
    - `target_editor`,
    - `default_platform`,
    - `output_resolution`,
    - `output_fps`,
    - `max_stage_duration_minutes`,
    - `local_tool_preference`,
    - `use_generated_images_when_missing`,
    - `subtitle_mode`,
    - `bgm_mode`.
  - Include hard limits:
    - `must_use_ae_computer_use_guard_before_gui: true`,
    - `must_inventory_assets_before_gui: true`,
    - `allow_raw_video_upload: false`,
    - `allow_historical_screenshots: false`,
    - `must_validate_export_locally: true`.
- Tests:
  - Validate skill frontmatter and metadata.
  - Validate references explain all three asset modes.
  - Validate mirror check passes.
- Validation:
  - `npm run check`
  - `npm test`
- Rollback signals:
  - The skill enters GUI automation before local inventory and planning.
  - The skill suggests uploading raw videos or carrying historical screenshots.
- Deferred to implementation:
  - FFmpeg wrapper scripts.
  - Resolve/Premiere/CapCut adapters.
  - End-to-end sample project.

### U4 - Update skill inventory and plugin metadata if required

- Goal: Ensure new skills are discoverable in the same way existing AE skills are discoverable.
- Requirements covered:
  - Users can trigger the new skills by name and natural language.
  - Plugin packaged skills include the new folders.
- Acceptance criteria covered:
  - Any manually maintained README/help list mentions the three new skills.
  - Plugin metadata remains valid.
- Depends on:
  - U0
  - U1
  - U2
  - U3
- Files:
  - Inspect and modify only if necessary:
    - `README.md`
    - `README.en.md`
    - `plugins/ai-agent-engine-codex/.codex-plugin/plugin.json`
    - `plugins/ai-agent-engine-codex/scripts/skill-language-metadata.mjs`
    - `scripts/check-skill-language-metadata.mjs`
- Approach:
  - Search for explicit lists of skills.
  - Add concise entries for the new skills only where the project currently maintains explicit lists.
  - Preserve existing bilingual style and encoding.
- Tests:
  - Run language metadata and mirror validation through `npm run check`.
- Validation:
  - `npm run check`
  - `npm test`
- Rollback signals:
  - README/plugin metadata encoding becomes corrupted.
  - Metadata script fails because new skill names are missing expected labels.
- Deferred to implementation:
  - Marketplace screenshots or extended marketing descriptions.

## Validation Plan

- Unit:
  - Inspect `docs/ae/templates/ae-skill-profiles.example.yaml` for `user_mode`, `server_profile`, and all three skill override sections.
  - Inspect each skill for `beginner` default behavior and `expert` configurable behavior.
  - Inspect each skill for hard limits that cannot be overridden.
  - Inspect each `SKILL.md` frontmatter for only `name` and `description`.
  - Inspect each `agents/openai.yaml` for display name, short description, default prompt, and implicit invocation policy.
- Integration:
  - `npm run check`
  - `npm test`
  - Confirm `.agents/skills/ae-computer-use-guard` and `plugins/ai-agent-engine-codex/skills/ae-computer-use-guard` match.
  - Confirm `.agents/skills/ae-imagegen-prompt` and `plugins/ai-agent-engine-codex/skills/ae-imagegen-prompt` match.
  - Confirm `.agents/skills/ae-video-edit-computer` and `plugins/ai-agent-engine-codex/skills/ae-video-edit-computer` match.
- User flow:
  - Dry-run trigger wording:
    - "Use Computer Use to control Jianying."
    - "Optimize this sentence into an image prompt."
    - "Use Codex to edit a video from these images."
    - "Use expert mode with `.codex/ae-skill-profiles.yaml`."
  - Confirm expected skill routing:
    - `ae-computer-use-guard` for desktop control.
    - `ae-imagegen-prompt` for image generation prompt work.
    - `ae-video-edit-computer` for video editing workflows.
- Data / operations:
  - No generated video/image assets are required for this implementation.
  - No external MCP or server config is changed.
- Observability:
  - Final delivery should report validation commands and any unverified runtime behavior.

## Rollback / Recovery

- If validation fails because mirror checks reject new skill folders, compare file trees under `.agents/skills` and `plugins/ai-agent-engine-codex/skills`.
- If metadata checks fail, inspect `agents/openai.yaml` for every new skill and any project metadata script expectations.
- If README or plugin metadata editing creates encoding problems, revert only those documentation edits and keep skill directories intact.
- If trigger descriptions are too broad, narrow descriptions rather than deleting the skill.

## Plan Self-Review

- Placeholder scan: no placeholders remain.
- Consistency check: the three-skill structure, dependency order, and validation steps are consistent.
- Scope check: the plan is limited to skill documentation/metadata and does not implement runtime MCP or server changes.
- Acceptance coverage: each requested behavior maps to U0, U1, U2, U3, or U4.
- Validation gaps: runtime `Computer Use` screenshot compression cannot be verified without actual plugin execution or hooks; recorded as deferred.
- Alternatives and ADR check: three material decisions are recorded with rejected alternatives.
- High-risk pre-mortem check: includes oversized screenshot/context, beginner misuse, and overlong skill text failure scenarios.

## Handoff

Recommended execution order:

1. Implement U0 shared beginner/expert profile contract and example config.
2. Implement U1 `ae-computer-use-guard`.
3. Review U0 and U1 as documents before creating dependent video skill.
4. Implement U2 `ae-imagegen-prompt`.
5. Implement U3 `ae-video-edit-computer`.
6. Implement U4 only if repository inventory files require updates.
7. Run `npm run check` and `npm test`.
8. Run `ae-review domain:document` or `ae-review domain:code` depending on whether only skill docs or scripts were changed.
