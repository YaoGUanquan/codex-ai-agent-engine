export const supportedLanguages = new Set(['en', 'zh-CN', 'bilingual'])

export const skillMetadata = {
  'ae-agent-creator': {
    display: { en: 'AE Agent Creator', zh: 'AE 创建代理' },
    en: 'Create Codex-compatible agent prompts and delegation templates',
    zh: '创建 Codex 可用的代理提示、审查 persona 或委派模板',
    promptEn: 'Use $ae-agent-creator to design a reusable agent prompt.',
    promptZh: '使用 $ae-agent-creator 帮我设计一个可复用的代理提示。',
  },
  'ae-backend': {
    display: { en: 'AE Backend', zh: 'AE 后端实现' },
    en: 'Implement backend behavior using repository API, service, and data contracts',
    zh: '基于仓库中的接口、服务和数据契约实现后端行为',
    promptEn: 'Use $ae-backend to implement this backend change.',
    promptZh: '使用 $ae-backend 实现这个后端改动。',
  },
  'ae-brainstorm': {
    display: { en: 'AE Brainstorm', zh: 'AE 需求澄清' },
    en: 'Clarify requirements and capture acceptance criteria',
    zh: '澄清需求并沉淀验收标准',
    promptEn: 'Use $ae-brainstorm to clarify this feature idea before planning.',
    promptZh: '使用 $ae-brainstorm 在计划前澄清这个功能想法。',
  },
  'ae-debug': {
    display: { en: 'AE Debug', zh: 'AE 调试排障' },
    en: 'Investigate failures systematically before changing code',
    zh: '在修改代码前系统化定位故障原因',
    promptEn: 'Use $ae-debug to investigate this failure.',
    promptZh: '使用 $ae-debug 排查这个故障。',
  },
  'ae-doc-humanize': {
    display: { en: 'AE Doc Humanize', zh: 'AE 文档人读化' },
    en: 'Rewrite structured or stiff content into readable documents',
    zh: '把结构化或生硬内容改写成更易读的文档',
    promptEn: 'Use $ae-doc-humanize to make this document easier to read.',
    promptZh: '使用 $ae-doc-humanize 把这份内容改写成人更容易读的版本。',
  },
  'ae-doc-structure': {
    display: { en: 'AE Doc Structure', zh: 'AE 文档结构化' },
    en: 'Structure messy notes into requirements, plans, handoffs, or checklists',
    zh: '把散乱内容整理成需求、计划、交接或检查清单',
    promptEn: 'Use $ae-doc-structure to turn these notes into a structured artifact.',
    promptZh: '使用 $ae-doc-structure 把这些内容整理成结构化文档。',
  },
  'ae-frontend-design': {
    display: { en: 'AE Frontend Design', zh: 'AE 前端初版' },
    en: 'Build a usable first frontend version with browser validation',
    zh: '按现有前端栈交付可用的首版界面体验',
    promptEn: 'Use $ae-frontend-design to build a usable first frontend version.',
    promptZh: '使用 $ae-frontend-design 为这个功能做一个可用的前端初版。',
  },
  'ae-handoff': {
    display: { en: 'AE Handoff', zh: 'AE 会话交接' },
    en: 'Capture current task state, validation, blockers, and next steps',
    zh: '沉淀当前任务状态、验证、阻塞点和下一步',
    promptEn: 'Use $ae-handoff to create a continuation handoff for this task.',
    promptZh: '使用 $ae-handoff 为当前任务生成一个可继续的交接说明。',
  },
  'ae-help': {
    display: { en: 'AE Help', zh: 'AE 帮助' },
    en: 'List AE workflow capabilities for Codex',
    zh: '查看 Codex 中可用的 AE 工作流能力',
    promptEn: 'Use $ae-help to show which AE workflow entrypoint I should use.',
    promptZh: '使用 $ae-help 查看我应该使用哪个 AE 工作流入口。',
  },
  'ae-ideate': {
    display: { en: 'AE Ideate', zh: 'AE 想法生成' },
    en: 'Generate comparable solution options, tradeoffs, and next steps',
    zh: '生成可比较的方案方向、取舍和下一步',
    promptEn: 'Use $ae-ideate to generate feasible directions for this goal.',
    promptZh: '使用 $ae-ideate 帮我围绕这个目标生成几个可执行方向。',
  },
  'ae-init': {
    display: { en: 'AE Init', zh: 'AE 初始化' },
    en: 'Initialize project docs, archive rules, and AI memory',
    zh: '初始化项目文档、归档规则和 AI 记忆库',
    promptEn: 'Use $ae-init to initialize AGENTS.md, docs/ae, docs/00-process, and docs/08-ai-memory for this project.',
    promptZh: '使用 $ae-init 初始化当前项目的 AGENTS.md、docs/ae、docs/00-process 和 docs/08-ai-memory。',
  },
  'ae-language': {
    display: { en: 'AE Language', zh: 'AE 切换语言' },
    en: 'Switch local AE skill display language',
    zh: '切换本地 AE skill 列表显示语言',
    promptEn: 'Use $ae-language to switch local AE display language.',
    promptZh: '使用 $ae-language 把本地 AE 显示语言切换为中文。',
  },
  'ae-lfg': {
    display: { en: 'AE LFG', zh: 'AE 全流程' },
    en: 'Full AE workflow from requirement to verified delivery',
    zh: '从需求到验证交付的完整 AE 流程',
    promptEn: 'Use $ae-lfg to take this software requirement through plan, work, review, and validation.',
    promptZh: '使用 $ae-lfg 将这个软件需求推进到计划、实现、审查和验证。',
  },
  'ae-plan': {
    display: { en: 'AE Plan', zh: 'AE 计划生成' },
    en: 'Create AE implementation plans before coding',
    zh: '编码前创建 AE 实现计划',
    promptEn: 'Use $ae-plan to turn this requirement into an implementation plan.',
    promptZh: '使用 $ae-plan 将这个需求转换为实现计划。',
  },
  'ae-prompt-optimize': {
    display: { en: 'AE Prompt Optimize', zh: 'AE 提示词优化' },
    en: 'Rewrite vague requests into executable Codex prompts',
    zh: '把模糊请求改写成更可执行的 Codex 提示词',
    promptEn: 'Use $ae-prompt-optimize to improve this prompt.',
    promptZh: '使用 $ae-prompt-optimize 优化这段提示词。',
  },
  'ae-refactor': {
    display: { en: 'AE Refactor', zh: 'AE 重构计划' },
    en: 'Plan behavior-preserving refactors with validation and rollback',
    zh: '为行为保持型重构生成分步计划、验证和回滚策略',
    promptEn: 'Use $ae-refactor to create a safe refactoring plan.',
    promptZh: '使用 $ae-refactor 为这段代码生成一个安全的重构计划。',
  },
  'ae-review': {
    display: { en: 'AE Review', zh: 'AE 审查' },
    en: 'Layered code and document review with findings first',
    zh: '分层审查代码和文档，优先输出问题',
    promptEn: 'Use $ae-review to review my current changes and report risks first.',
    promptZh: '使用 $ae-review 审查我当前的变更并优先报告风险。',
  },
  'ae-save-experience': {
    display: { en: 'AE Save Experience', zh: 'AE 经验沉淀' },
    en: 'Capture reusable project experience after work lands',
    zh: '把问题、决策、命令和验证沉淀为可复用经验',
    promptEn: 'Use $ae-save-experience to record lessons from this work.',
    promptZh: '使用 $ae-save-experience 记录这次处理过程的经验。',
  },
  'ae-skill-creator': {
    display: { en: 'AE Skill Creator', zh: 'AE 创建技能' },
    en: 'Create or update reusable Codex skills',
    zh: '按 Codex skill 规范创建或更新可复用技能',
    promptEn: 'Use $ae-skill-creator to create a new Codex skill.',
    promptZh: '使用 $ae-skill-creator 帮我创建一个新的 Codex skill。',
  },
  'ae-sql': {
    display: { en: 'AE SQL', zh: 'AE 数据库操作' },
    en: 'Generate, review, or execute SQL with safety boundaries',
    zh: '生成、审查或执行 SQL，默认只读并保留安全边界',
    promptEn: 'Use $ae-sql to generate SQL from the current repository contract.',
    promptZh: '使用 $ae-sql 根据当前仓库生成这条数据库操作 SQL。',
  },
  'ae-swagger-parser': {
    display: { en: 'AE Swagger Parser', zh: 'AE Swagger 解析' },
    en: 'Summarize Swagger and OpenAPI specs',
    zh: '摘要解析 Swagger 和 OpenAPI 规格',
    promptEn: 'Use $ae-swagger-parser to summarize this OpenAPI file.',
    promptZh: '使用 $ae-swagger-parser 摘要解析这个 OpenAPI 文件。',
  },
  'ae-tdd': {
    display: { en: 'AE TDD', zh: 'AE 测试驱动开发' },
    en: 'Run a red-green-refactor loop with a failing test first',
    zh: '以先失败测试为起点执行红绿重构循环',
    promptEn: 'Use $ae-tdd to implement this change with a failing test first.',
    promptZh: '使用 $ae-tdd 以先写失败测试的方式实现这个改动。',
  },
  'ae-test-browser': {
    display: { en: 'AE Browser Test', zh: 'AE 浏览器验收' },
    en: 'Validate UI flows, screenshots, console, and network in a real browser',
    zh: '用真实浏览器检查 UI 流程、截图、控制台和网络',
    promptEn: 'Use $ae-test-browser to verify this page flow in a browser.',
    promptZh: '使用 $ae-test-browser 验收这个页面的主要流程。',
  },
  'ae-update': {
    display: { en: 'AE Update', zh: 'AE 更新插件' },
    en: 'Update the project-local AE for Codex installation',
    zh: '从指定仓库更新项目本地 AE for Codex 安装',
    promptEn: 'Use $ae-update to update the local AE for Codex plugin.',
    promptZh: '使用 $ae-update 更新当前项目的 AE for Codex 插件。',
  },
  'ae-web-app': {
    display: { en: 'AE Web App', zh: 'AE Web 应用开发' },
    en: 'Build or extend a web application using the existing repository stack',
    zh: '基于现有仓库技术栈构建或扩展 Web 应用',
    promptEn: 'Use $ae-web-app to implement this web app flow.',
    promptZh: '使用 $ae-web-app 实现这个 Web 应用流程。',
  },
  'ae-work': {
    display: { en: 'AE Work', zh: 'AE 计划执行' },
    en: 'Execute plans with Git safety and validation evidence',
    zh: '带 Git 安全检查和验证证据执行计划',
    promptEn: 'Use $ae-work to implement this AE plan with validation evidence.',
    promptZh: '使用 $ae-work 执行这个 AE 计划并提供验证证据。',
  },
}

export function renderYaml(item, selectedLang) {
  const display = selectedLang === 'zh-CN'
    ? item.display.zh
    : selectedLang === 'bilingual'
      ? `${item.display.zh} / ${item.display.en}`
      : item.display.en
  const description = selectedLang === 'zh-CN'
    ? item.zh
    : selectedLang === 'bilingual'
      ? `${item.zh} / ${item.en}`
      : item.en
  const prompt = selectedLang === 'zh-CN'
    ? item.promptZh
    : selectedLang === 'bilingual'
      ? `${item.promptZh} / ${item.promptEn}`
      : item.promptEn
  return [
    'interface:',
    `  display_name: "${escapeYaml(display)}"`,
    `  short_description: "${escapeYaml(description)}"`,
    `  default_prompt: "${escapeYaml(prompt)}"`,
    'policy:',
    '  allow_implicit_invocation: true',
    '',
  ].join('\n')
}

function escapeYaml(value) {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}
