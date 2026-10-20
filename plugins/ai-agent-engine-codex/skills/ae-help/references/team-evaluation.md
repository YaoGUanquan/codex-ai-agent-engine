# Team Trial Behavior Acceptance

[team-evaluation.json](team-evaluation.json) specifies five cases, two variants
and two fresh runs per case/variant (20 runs). Its initial `not-run` status must
not be promoted by repository tests, fixture examples or installation smoke.

Use disposable repositories and independently checked expected outcomes.
Freeze the `0.3.55` baseline at the trial's recorded commit, and fingerprint the
candidate plugin. Materialize the same initial fixture for every run. Activate
exactly one variant in a fresh supported Codex conversation; verify installed
metadata, the selected local skill/reference loading path, actual model,
reasoning effort, available tools and host settings. Do not run comparisons
against the user's business repository, global installation or database.

Keep the original prompt outcome identical across variants. Requirements that
need approval must receive the same decision before implementation. The two
approved-plan cases do not require another planning round.

Measure actual timestamps and worker lifecycles rather than inferring overlap
from a proposed wave. Inspect patches and run independent acceptance checks.
Record case, variant, repetition, snapshot/plugin identifiers, actual model and
effort, completion/correctness, overlap, confirmation count, elapsed time, token
usage only when exposed, and proof gaps. Keep summaries sanitized; no private
transcripts, credentials or raw runtime data.

Reject unauthorized writes, overwritten user changes, unbounded data access,
fabricated acceptance or unsupported model substitutions regardless of timing.
Do not claim speed or intelligence improvement from the execution of the current
implementation team alone. If matching controlled hosts, isolated activation,
model access or reliable fixture evidence are missing, record `blocked` or
`not-run` and the prerequisite. A partial run is not the full comparison.
