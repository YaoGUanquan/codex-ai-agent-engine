# Notice

AI Agent Engine for Codex is a Codex-native adaptation inspired by and explicitly referencing the AI Agent Engine OpenCode plugin.

Upstream project:
https://gitee.com/jiangqiang1996/ai-agent-engine

This repository references the workflow design, capability categories, and AE naming conventions of that Gitee project while implementing a separate Codex-native MVP.

It also references selected development workflow ideas from:

- https://github.com/obra/superpowers
- https://github.com/openai/plugins
- https://github.com/iOfficeAI/OfficeCLI

Those repositories are treated as read-only references. This project does not vendor or run their runtimes; it rewrites the relevant ideas into local Codex skills and helper scripts where appropriate.

Observed upstream commit during the initial analysis:
597b409eb3a53f78aa86861783e282ae6ffedcb5

The upstream project is licensed as GPL-2.0. This repository keeps `GPL-2.0-only` in the plugin manifest and repository license metadata.

This repository does not vendor the upstream OpenCode runtime plugin. It reimplements a small Codex-native MVP around explicit Codex skills and local scripts.
