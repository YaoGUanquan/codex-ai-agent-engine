# External Skill Optimization Audit

## Decision

Adapt a small set of portable methods into existing AE skills. Do not install, vendor, or execute any external runtime. The recommended first pass is to improve `ae-review` and `ae-test-browser`, while keeping `ae-lfg`, `ae-work`, `ae-task-loop`, and `ae-skill-creator` as the owning entrypoints for persistence, iterative repair, and skill governance.

The audit is advisory. No skill, plugin, memory, or runtime was changed by this report.

## Source Freshness And License Evidence

Freshness method was attempted with `git ls-remote <repo> HEAD` on 2026-08-03. Direct GitHub access failed with connection timeouts for the candidate repositories, so a full remote commit proof was unavailable. AnySearch was used only to inspect public GitHub pages and exact file URLs; any source without a resolved commit is marked `offline-unverified` below. No popularity or benchmark number is used as an engineering claim.

The requested primary Gitee repository was reachable and freshly checked with `git ls-remote https://gitee.com/jiangqiang1996/ai-agent-engine.git HEAD refs/heads/master refs/heads/main`. It returned `master/HEAD` at `0e58b614846bbac8fd556639e70d9363d271a812` on 2026-08-03. The inspected checkout is a shallow clone at the same commit. Relevant inspected files were `src/assets/agents/testers/api-test-runner.md`, `src/assets/skills/ae-api-test/SKILL.md`, `src/assets/skills/ae-review/SKILL.md`, `src/tools/ae-review-proof.tool.ts`, `src/tools/ae-review-scope-analyze.tool.ts`, and `src/tools/ae-specialist-aggregate.tool.ts`.

The Gitee update adds an API-test runner agent and refactors review/test routing around OpenCode tools and subagent sessions. Portable ideas are bounded API-test responsibility routing and structured review-proof metadata. The agent registry, OpenCode commands, hooks, MCP/tool registration, session orchestration, and automatic aggregation are runtime-specific and are not suitable for direct Codex import. No upstream code or source-derived prose is copied into this project.

The records below use the `ae-skill-audit` provenance fields explicitly: `sourceUrl`, `observedCommit`, `refSource`, and `inspectedFiles`. An unresolved value is evidence of a freshness or source-identity limitation, not a current-source claim.

| Candidate | sourceUrl | observedCommit | refSource | inspectedFiles | License evidence | Freshness/status | Initial verdict |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PlanningwithFiles | `https://github.com/OthmanAdi/planning-with-files` | unresolved | AnySearch repository page, default tree | `README.md`, repository tree, license badge | README exposes MIT badge; exact license text was not independently rechecked | offline-unverified; no commit resolved | ADAPT as a reference only |
| CodeReview | unresolved user-supplied `aiskillstore/marketplace` | unresolved | user-supplied label; repository identity not resolved | none; exact skill path unavailable | unverified | unreachable/ambiguous source identity | REJECT; reopen only with an exact URL |
| CodeSimplifier | `https://github.com/addyosmani/agent-skills` | unresolved | `main` file page via AnySearch | `skills/code-simplification/SKILL.md`, repository README | repository README states MIT | offline-unverified; file page inspected, commit not resolved | ADAPT into existing complexity review |
| WebappTesting | `https://github.com/anthropics/skills` | `da20c92503b2e8ff1cf28ca81a0df4673debdbf7` | exact `skills/webapp-testing/SKILL.md` commit page plus `main`/`HEAD` pages | `skills/webapp-testing/SKILL.md` | skill metadata points to `LICENSE.txt`; SPDX compatibility was not independently verified | commit observed through page extraction; remote freshness not revalidated | ADAPT into existing browser testing guidance |
| RalphLoop | `https://github.com/PageAI-Pro/ralph-loop` | unresolved | AnySearch repository page, default tree | `README.md`, repository tree, `LICENSE` entry | repository exposes a LICENSE file; SPDX text was not independently verified | offline-unverified; no commit resolved | ABSORB only where it improves `ae-task-loop`; no runtime |
| AgentStudio | `https://github.com/oimiragieo/agent-studio` | unresolved | AnySearch repository and exact skill pages | `README.md`, `.claude/skills/qa-workflow/SKILL.md`, `.claude/skills/judge-verification/SKILL.md` | license compatibility not established from inspected evidence | offline-unverified; no commit resolved | ADAPT methods only; reject runtime |
| SkillCreator | `https://github.com/somasays/skill-creator` | unresolved | AnySearch repository page, default tree | `README.md`, `SKILL.md`, `description-examples.md`, `structure-patterns.md`, `skill-template.md` | Apache-2.0 stated in README | offline-unverified; repository page reports two commits, hash not resolved | ADAPT examples into `ae-skill-creator` only if needed |
| UIUXProMax | `https://github.com/nextlevelbuilder/ui-ux-pro-max-skill` | `b484e8338c25b9cea3a25981a992d2817188971a` | exact `.claude/skills/ui-ux-pro-max/SKILL.md` page | `README.md`, `LICENSE`, `.claude/skills/ui-ux-pro-max/SKILL.md` | MIT text inspected | inspected commit is not proven current `main` | DEFER bulk data; consider a small reference/template |
| Cat-tj UIUX fork | `https://github.com/Icattj/ui-ux-pro-max` and `https://github.com/Icattj/openclaw-skill-ui-ux-pro-max` | unresolved | AnySearch repository pages | `README.md` and skill metadata excerpts | MIT stated in search result | offline-unverified; low-signal fork/duplicate | REJECT as duplicate evidence |

## Current AE Fit

The current project already contains equivalents for most proposed ideas:

- Persistent execution evidence: `ae-lfg` and `ae-work` use `docs/00-process/active/<task>/progress.md`, `ledger.jsonl`, and handoff records; `ae-tools.mjs recovery` rehydrates recent artifacts.
- Iterative repair: `ae-task-loop` locks success criteria, limits no-progress rounds, and requires a candidate success review.
- Simplification: `ae-work` has a minimality and cleanup gate; `ae-review` has a complexity lane with `delete`, `stdlib`, `native`, `yagni`, and `shrink` findings; `ae-refactor` protects behavior and rollback.
- Browser validation: `ae-test-browser` requires real interaction, responsive checks, console/network evidence, and explicit unverified areas.
- Skill governance: `ae-skill-creator` already requires candidate evaluation, overlap checks, explicit adoption, source/mirror parity, and validation.
- Claim and runtime boundaries: `ae-skill-audit` and `ae-review` already reject unsupported hooks, slash commands, MCP auto-loading, and unverified capability claims.

## Portable Patterns Worth Adapting

| Pattern | Source | Classification | AE destination | Boundary |
| --- | --- | --- | --- | --- |
| Three-file persistent state: plan, findings, progress | PlanningwithFiles | portable method | Existing `ae-lfg`/`ae-work` evidence contract | Do not add duplicate root-level files; map to existing AE artifact paths |
| Completion gate after every objective criterion | PlanningwithFiles, RalphLoop | portable method | `ae-task-loop`, `ae-work`, final gate | Gate must use actual commands and review evidence, not a promise token alone |
| Chesterton's Fence, behavior-preserving simplification, and scoped cleanup | CodeSimplifier | portable method | `ae-review` complexity lane and `ae-refactor` | Keep current security, accessibility, and trust-boundary exceptions |
| Reconnaissance then action; wait for `networkidle`; black-box helper scripts | WebappTesting | portable method | `ae-test-browser` | Use Codex Browser/Playwright already available; do not require Anthropic helpers |
| Must-haves, deviation records, verification-gap reports | AgentStudio | portable method | PRD/plan/task and review evidence templates | No automatic hooks, memory evolution, or independent model judge is implied |
| Pushy but bounded trigger descriptions and structural templates | SkillCreator | portable method | `ae-skill-creator` candidate evaluation | Must retain narrow exclusions and avoid trigger hijacking |
| Master plus page-specific design overrides | UIUXProMax | portable method | Optional future design reference | Do not vendor its database or CLI without a separate license, size, and sync decision |

## Platform-Specific Patterns To Reject

- Claude/OpenCode hooks, slash-command registration, background heartbeats, Telegram daemons, automatic skill evolution, and memory marketplace behavior.
- Docker sandbox orchestration as a default execution path for Codex.
- External MCP auto-registration, agent registries, or model-specific tool declarations.
- Bulk import of UI/UX CSV databases, copied prompts, benchmark claims, or source-derived scripts.
- Any automatic live mutation of skills or memory without a staged proposal and explicit adoption.

## Optimization Loop Assessment

- Trajectory source: public README and skill files, not authenticated task traces.
- Candidate edit shape: guidance/reference adaptation only; no live mutation.
- Validation gate: local mirror, language metadata, skill contract, artifact, package, and focused tests.
- Held-out replay metric: unavailable in the current Codex runtime; no external benchmark is promoted.
- Rejected-update handling: preserve as an audit finding or residual risk; do not silently adopt.
- Safe AE rewrite: convert useful ideas into existing skill rules, templates, or deterministic checks.

## Recommended Order

1. Improve `ae-test-browser` with a concise reconnaissance-then-action rule and explicit helper-script black-box guidance.
2. Improve `ae-review` complexity guidance with the reason-for-existence/behavior baseline check before `delete` or `shrink` findings.
3. Add a small `must-haves` and deviation vocabulary to requirements/plan/review templates only if a concrete cross-artifact gap remains.
4. Add no new skill, no background loop, and no UI/UX data bundle in the first pass.

## Implementation Impact If Authorized

- Likely plugin source and `.agents/skills` mirrors: `ae-test-browser`, `ae-review`, and possibly `ae-prd`/`ae-plan` references.
- Likely validation: `node scripts/check-skill-mirror.mjs`, `node scripts/check-skill-language-metadata.mjs`, `node scripts/check-skill-contract.mjs`, `node scripts/check-ae-artifacts.mjs`, `npm test`, `npm run check`, and `git diff --check`.
- Distribution version: increment root `package.json` and `plugins/ai-agent-engine-codex/.codex-plugin/plugin.json` together only if skill files are changed.
- Authorization boundary: this audit does not authorize editing skills, changing memory, installing dependencies, or changing plugin metadata.

## Verdict

`ADAPT`: two high-value low-risk guidance improvements are justified; the remaining candidates are already covered, runtime-specific, duplicate, unverified, or too large for the current project boundary.

## Evidence Notes

- Local equivalents: `.agents/skills/ae-lfg/SKILL.md`, `.agents/skills/ae-work/SKILL.md`, `.agents/skills/ae-task-loop/SKILL.md`, `.agents/skills/ae-review/SKILL.md`, `.agents/skills/ae-test-browser/SKILL.md`, `.agents/skills/ae-skill-creator/SKILL.md`.
- Local deterministic checks: `scripts/check-skill-mirror.mjs`, `scripts/check-skill-contract.mjs`, `scripts/check-ae-artifacts.mjs`, and `package.json`.
- External evidence was collected through AnySearch URL extraction on 2026-08-03 after direct `git ls-remote` connection failures. Claims above are intentionally bounded to inspected public pages and files.
