# Notice

AI Agent Engine for Codex is a Codex / Agent Skills adaptation inspired by and explicitly referencing the AI Agent Engine project.

Upstream project:
https://gitee.com/jiangqiang1996/ai-agent-engine

This repository references the workflow design, capability categories, and AE naming conventions of that Gitee project while implementing a separate, self-contained skill set. It does not vendor upstream code or copy license-restricted prose.

It also references selected development workflow ideas from:

- https://github.com/obra/superpowers
- https://github.com/openai/plugins

Those repositories are treated as read-only references. This project does not vendor or run their runtimes; relevant ideas are rewritten into local skills where appropriate.

Observed upstream commit during the 0.5.0 alignment pass:
da2ff798584d04f36f2008b4bc022a32ea32c5c9

Upstream may declare `GPL-3.0-or-later`. This repository keeps `GPL-2.0-only` in `package.json` and `LICENSE` and does not unilaterally relicense.

Distributable contents are limited to `skills/`, `LICENSE`, and `NOTICE.md`. Repository validators under `tools/` and tests under `tests/` are development-only and are not part of the npm package file set.
