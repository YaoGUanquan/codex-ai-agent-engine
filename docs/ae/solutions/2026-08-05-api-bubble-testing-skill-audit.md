# API Bubble Testing Skill External Audit

## Decision

Create a staged proposal for a narrow `ae-test-api` skill. Adapt only independently rewritten, stack-neutral process methods: API-layer-first coverage, contract-focused assertions, deliberate error-path coverage, API-visible write verification, isolated synthetic test data, and conditional risk selection for authentication, authorization, idempotency, concurrency, and external effects.

Do not install, vendor, copy source text from, or execute any external repository, MCP server, CLI, test runner, fixture, or collection.

## Source Freshness And License Evidence

Direct Git freshness checks to GitHub timed out on 2026-08-05. GitHub REST API was reachable, so its default-branch commit endpoint is the bounded `refSource` below. Gitee `git ls-remote` was reachable for the upstream AE repository. These observations prove the observed refs and public metadata at audit time; they do not prove a clone or local runtime compatibility.

| Candidate | sourceUrl | observedCommit | refSource | License | Inspected files | Verdict |
| --- | --- | --- | --- | --- | --- | --- |
| SDET skills | `https://github.com/milosmilicevicsf/sdet-skills` | `f6a14eb7fcd411d7e04dfb2ee130c731a76c7f65` | GitHub REST default-branch commit | MIT | `skills/automation/api-testing/SKILL.md`, `skills/automation/test-data-management/SKILL.md` | Adapt method only. |
| API design skills | `https://github.com/he8um/api-design-skills` | `6e26c5a7426f7dc0a57c2bb5fa2defba8249013a` | GitHub REST default-branch commit | MIT | `references/testing-contract-and-conformance.md`, `references/errors-idempotency-and-concurrency.md` | Adapt method only. |
| Postman agent skills | `https://github.com/Postman-Devrel/agent-skills` | `e48de265f4ae4f513b3ab17a66a5fecb9daa62fd` | GitHub REST default-branch commit | MIT | `skills/postman-api-readiness/SKILL.md`, `references/pillars.md` | Select limited static-contract ideas; reject scoring and MCP runtime. |
| Awesome QA skills | `https://github.com/naodeng/awesome-qa-skills` | `0af56c620e8c9ef3e5b9497959828481a57cc983` | GitHub REST default-branch commit | GPL-3.0 | `skills/en/testing-types/api-testing/SKILL.md`, `output-formats.md` | Reject direct reuse; method overlap is already covered by MIT candidates. |
| Upstream AI Agent Engine | `https://gitee.com/jiangqiang1996/ai-agent-engine` | `c4e5c14ec8b62adabaefc5f98fe267d1188211d5` | Gitee `master`/`HEAD` via `git ls-remote` | GPL-3.0 | `src/assets/skills/ae-api-test/SKILL.md`, `references/auth.md`, `references/collector.md`, `references/templates.md`, `src/assets/agents/testers/api-test-runner.md` | Reject direct reuse and runtime port; independently express a small set of process ideas only. |

## Classification

| Observed pattern | Classification | AE destination | Boundary |
| --- | --- | --- | --- |
| Prefer API-level verification for contract variations; retain UI only for UI wiring | Portable method | `ae-test-api` workflow and `ae-test-browser` routing | Do not make API evidence a substitute for UI acceptance. |
| Assert status, consumer-relied-on fields, error shapes, and schema conformance rather than an entire incidental payload | Portable method | API assertion guidance | Use the target repository's contract and test harness; no default schema tool is added. |
| Verify a write through the API read path where that surface exists | Portable method | API mutation evidence guidance | Use test-safe fixtures and explicit authorization; direct database inspection remains conditional evidence for intentionally hidden effects. |
| Test-owned, isolated synthetic data with cleanup appropriate to the target | Portable method | Test-data boundary | No shared credentials, production data, or automatic data reset service. |
| Contract risk dimensions: method/path/status/schema/auth/error/idempotency/pagination/concurrency/deprecation | Portable method | Risk-scaled selection reference | Conditional by changed contract, not a mandatory scenario count. |
| OpenAPI readiness scoring with 48 checks | Reference-only idea | No first-pass owner | A fixed score is not evidence that post-change behavior passes. |
| Postman MCP discovery, collection generation, mocks, runs, and publication | Runtime-specific behavior | Rejected | Codex does not have this MCP contract and the PRD excludes external runner setup. |
| Playwright `request` fixture examples | Framework-specific example | Rejected | The new skill must reuse the target repository's client and test harness. |
| Large QA catalog, framework-specific API subskills, generated templates, and `skill-up` evaluation flow | License and scope mismatch | Rejected | GPL-3.0 source must not be copied into this GPL-2.0-only distribution; the catalog is also outside the narrow task. |
| Stable endpoint key from method/path/operation reference | Portable process idea | Endpoint selection and record identity guidance | Independently rewrite the concept; do not reuse the upstream collection schema or source text. |
| Classify irreversible effects before live testing | Portable process idea | Risk classification before shared-gate routing | The shared local-runtime smoke gate remains the sole authority for authorization and execution. |
| Run an approved workflow path before endpoint boundary cases | Portable process idea | Risk-scaled verification sequence | Neither generated scripts nor a fixed execution order is required when only a contract test is available. |
| Conditional cleanup and structured result summary | Portable process idea | Record semantics | Use the target repository's cleanup pattern; retain only sanitized evidence, never raw HTTP exchanges or stack traces. |
| OpenCode subagents, generated Node `fetch` scripts, automatic execution/retry, fixed output roots, raw failure bundles | Runtime and data-retention mismatch | Rejected | No OpenCode agent/tool dependency, default client, unattended repair loop, `ae/tests/api`/`ae/reports` ownership, raw payload, or stack-trace retention. |

## Candidate Evaluation

- Source evidence: current local `ae-backend`, `ae-work` local-runtime smoke gate, `ae-test-browser`, the API-bubble PRD, and the four repositories above.
- Trigger and scope: backend work has changed an API contract and the user requests API/interface/bubble verification; scope is endpoint selection, evidence, and safe local checks.
- Overlap check: `ae-backend` owns implementation and narrow tests, but not standalone post-change API evidence; `ae-work` owns live-call safety; `ae-test-browser` owns UI acceptance. No existing entrypoint owns all three API-test concerns without conflating responsibilities.
- Proposed owner: a new `ae-test-api` skill plus a compact reference for risk selection and final evidence.
- Validation if adopted: focused semantic regression, `node scripts/check-skill-mirror.mjs`, `node scripts/check-skill-language-metadata.mjs`, `node scripts/check-skill-contract.mjs`, `node scripts/check-install-smoke.mjs`, `node scripts/check-ae-artifacts.mjs`, `node scripts/check-release-notes.mjs`, `npm.cmd test`, `npm.cmd run check`, and `git diff --check`.

### Verdict: Create

The workflow has a distinct repeatable trigger, an endpoint-selection and evidence-reporting responsibility not owned by existing skills, and a clear validation path. The new skill must link to existing runtime-safety guidance rather than reproduce it. This audit is a staged proposal only and does not authorize skill, metadata, or version changes.

## Implementation Impact If Authorized

- New paired skill directories under `plugins/ai-agent-engine-codex/skills/ae-test-api` and `.agents/skills/ae-test-api`.
- Existing source/mirror metadata, generated language catalog inputs, README/help catalog, install-smoke expectations, focused tests, release notes, and synchronized SemVer manifests.
- No external dependency, repository installation, global configuration, secrets, real API invocation, or target-project modification.

## Upstream AE Compatibility Boundary

The upstream `ae-api-test` confirms that API verification is a distinct workflow in the parent project, but it is not portable as an implementation dependency. Its GPL-3.0 license is incompatible with copying into this GPL-2.0-only distribution, and its OpenCode-specific orchestration assumes subagents, generated scripts, automatic runs, iterative maintenance, and fixed artifact directories that this Codex-native catalog does not expose or need.

The proposed AE adaptation therefore retains only independently authored, stack-neutral decisions: identify endpoints from available contracts, use a stable method/path/operation reference when one exists, classify side effects before choosing a test tier, cover the approved workflow before relevant boundary risks, and write a compact sanitized result. The existing `ae-work` smoke gate remains authoritative for live-call authorization, secret references, and mutation safety.
