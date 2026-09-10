---
type: review
status: blocked
date: 2026-09-04
topic: codex-context-continuity
scope: codex-desktop-current-session
---

# Codex Context Continuity Capability Audit

## Result

unavailable for automatic context rotation in the current Codex Desktop session. U1 is complete. U2 through U4 remain blocked and must not be implemented from this evidence.

## Audit Boundary

The required lifecycle is:

impending-context signal -> safe-point coordinator invocation -> checkpoint -> create successor -> inject continuation -> verify successor acknowledgement -> archive source

This audit accepts only an active, callable Codex Desktop interface plus current official OpenAI documentation as proof. A local package declaration, a general OpenAI API endpoint, a skill instruction, or AGENTS.md is not sufficient proof for a Codex Desktop lifecycle operation.

## Evidence Matrix

| Required capability | Evidence | Status | Boundary |
| --- | --- | --- | --- |
| Impending-context signal | The current tool surface exposes no context-capacity or near-limit event. The local bundled declaration also contains no signal configuration. | unverified | No provider-safe trigger can be implemented. |
| Safe-point coordinator invocation | No current-session host callback or lifecycle hook is exposed to invoke AE after terminal work. | unavailable | A per-turn estimator, polling loop, or forced interruption would violate the approved requirements. |
| Create successor | The bundled desktop-mcp.json declares create_thread, but the current session does not expose it as callable. | unverified | A bundled descriptor is not an active-session or supported-contract guarantee. |
| Inject continuation | The same local descriptor declares send_message_to_thread, but it is not callable in this session. No acknowledgement contract was established. | unverified | Sending a prompt would not prove that a successor accepted the checkpoint. |
| Verify successor acknowledgement | No supported readback, acknowledgement, or lifecycle-completion interface was found for a successor thread. | unavailable | Cannot satisfy successor-before-source-archive ordering. |
| Archive source | The current session exposes an internal set_thread_archived capability, but no official documentation or isolated lifecycle result established retry, retention, or recoverability semantics. | unverified | It cannot be used as the final automatic-rotation step. |
## Local Interface Observations

1. The bundled desktop-mcp.json lists create_thread, send_message_to_thread, fork_thread, and handoff_thread with prompt approval. This confirms only that the installed bundle declares those names.
2. The active tool surface available to this task does not provide callable equivalents of those four operations. It provides limited Codex application utilities, including thread navigation and thread archival, but no near-context event or automatic safe-point callback.
3. The local declaration has no operation named for context-capacity inspection, context-limit threshold events, successor acknowledgement, or idempotent lifecycle retry.
4. A bundled Visualize skill contains a compaction-summary instruction. That is a prompt-continuation convention, not a callable thread-lifecycle API.

## Official Documentation Boundary

Current official OpenAI documentation for the Responses API documents context compaction through responses/compact: it produces encrypted items for a follow-up API request. This is an API conversation primitive, not documentation for controlling the active Codex Desktop thread, creating a Desktop successor, waiting for acknowledgement, or archiving the source Desktop thread. It therefore does not satisfy R1, R6, R10, or NFR3.

No current official OpenAI documentation located in this audit establishes a Codex Desktop interface that provides every required lifecycle operation or defines source-thread archive retry and retention semantics.

## Decision

- Keep automatic context rotation default-off and unavailable.
- Do not add a provider adapter, per-turn token estimator, polling/daemon, UI automation, forced interruption, or skill text claiming automatic behavior.
- Preserve existing manual recovery: ae-handoff, active-task progress.md, and ledger.jsonl remain the supported continuity path.
- Re-run U1 only after an active Codex Desktop session exposes a documented lifecycle interface that proves the missing operations and archive semantics.

## Requirements Impact

| Requirement | Audit outcome |
| --- | --- |
| R1 | Not met: no verified impending-context signal or complete callable lifecycle. |
| R6 | Not met: successor acknowledgement and source archive semantics are unverified. |
| R10 | Not met: no callable safe-point host lifecycle entry point. |
| NFR3 | Enforced: no general API or local declaration is promoted to Desktop lifecycle proof. |

## Validation Performed

```powershell
Get-Content -Raw C:\Users\yaogu\.codex\plugins\cache\openai-bundled\codex-app-tools\0.1.3\desktop-mcp.json
rg -n -S "create_thread|send_message_to_thread|fork_thread|handoff_thread|set_thread_archived|context" <bundled Codex paths>
```

The audit also inspected the current task's exposed tool inventory and current official OpenAI documentation search results. No real thread mutation was attempted.
