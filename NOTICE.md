# Notice

AI Agent Engine for OpenCode is a project-local adaptation of the AI Agent Engine OpenCode plugin.

Upstream project:
https://gitee.com/jiangqiang1996/ai-agent-engine

This repository selectively adapts upstream behavior through commit `61b777542fb00d2e082af126d17b070318281933` while retaining a project-local installer and excluding PDF, DOCX, XLSX, PPTX, and OfficeCLI capability families.

It also references selected development workflow ideas from:

- https://github.com/obra/superpowers
- https://github.com/openai/plugins

Those repositories are treated as read-only references. This project does not vendor or run their runtimes; it rewrites the relevant ideas into local Codex skills and helper scripts where appropriate.

This repository is distributed under GPL-3.0-or-later. See LICENSE and THIRD-PARTY-NOTICES.
