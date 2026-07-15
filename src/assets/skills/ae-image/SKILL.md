---
name: ae:image
description: "将本地图片转换为 Markdown 描述。通过 ae.jsonc 中 modelScenarios.vision 配置的模型识别图片内容，未配置时由 opencode 自行分配模型。支持 JPG/PNG/GIF/WebP/BMP 格式，识别提示词由调用方通过 prompt 参数传入。模型支持 vision 时可直接用 Read 工具读取图片；模型不支持 vision 时禁止尝试直接读取图片文件，必须通过本技能转换。"
argument-hint: "file=图片路径 [format=jpg|jpeg|png|gif|webp|bmp] [outputMode=file|inline] [prompt=识别提示词] [outputPath=路径]"
---

# ae:image — 图片内容识别

将本地图片转换为 Markdown 描述。通过内置 `ae-image` 工具调用 `modelScenarios.vision` 配置的模型实现，无需安装额外依赖。

## 适用场景

- 用户需要理解图片内容（将图片转为文字描述供 LLM 阅读）
- 用户明确要求将图片内容持久化为 Markdown 文件
- 当前模型不支持直接读取图片文件时，用本技能替代直接读取
- 需要定向识别图片特定内容时，通过 prompt 参数指定识别重点
- 其他工具生成 PNG 后，需要识别图片视觉内容进行验证

## 不适用场景

- 模型支持读取图片且只需查看/理解图片内容时，应直接使用 Read 工具读取，禁止调用本技能
- 不支持 SVG 格式（SVG 可用 Read 工具直接读取，无需转换）
- 不支持音频、视频等非图片格式
- 不支持远程 URL，仅处理当前工作区内本地文件

## 关键约束

- **模型不支持 vision 时禁止使用 Read 工具读取图片**：Read 工具读取 PNG/JPG 等图片文件时，如果当前模型不支持图像输入，会报错 "Cannot read image (this model does not support image input)"。此时必须通过本技能转换，不得尝试直接 Read 图片文件。
- 所有视觉验证场景生成的 PNG 图片，在模型不支持 vision 时，必须通过本技能识别，不得直接 Read。
- **自动调用，不询问用户**：当检测到模型不支持图片输入、或 Read 读取图片报错时，必须立即自动调用本技能，不得向用户提问是否调用、不得列出可选方案让用户选择、不得停下来等待用户确认。直接调用，拿到结果后继续完成任务。

## 模型配置

识别图片使用的模型通过 `ae.jsonc` 的 `modelScenarios.vision` 配置：

```jsonc
{
  "modelScenarios": {
    "vision": "openai/gpt-4o"
  }
}
```

未配置时，由 opencode 自行分配当前默认模型。建议配置支持图像输入的多模态模型（如 `openai/gpt-4o`、`anthropic/claude-3-5-sonnet`、`google/gemini-2.0-flash` 等）。

## 核心工作流

1. 接收用户提供的图片文件路径和识别提示词（prompt 参数）
2. 检测图片格式（JPG/PNG/GIF/WebP/BMP）
3. 读取图片内容，调用 `modelScenarios.vision` 配置的模型识别
4. 将识别结果作为 Markdown 直接返回（不附加元数据）
5. 根据 outputMode 参数决定输出方式：
   - `file`（默认）：写入 `ae/markdown/` 目录（或用户指定的 outputPath）
   - `inline`：直接返回 Markdown 内容，不写文件

## 调用纪律

- 单次调用只处理一个文件；需要批量处理时逐一调用或建议用户使用脚本
- outputMode=file 时转换结果自动写入 `ae/markdown/` 子目录，文件名规则：`image-to-markdown-<时间戳>-<随机串>.md`
- prompt 参数指定时，覆盖默认识别提示词，用于定向识别（如"识别图片中的表格数据"、"提取 UI 界面中的按钮和文字"）
- 不需要用户确认即可执行（只读操作，不修改原图）
- **file 参数必须是真实、完整、物理存在的路径**：禁止仅传文件名。路径来源不确定时，先用 `glob` 或 `bash` 的 `Test-Path`/`ls` 确认文件物理存在再调用。被 `.gitignore` 忽略的文件只要物理存在就应正常处理，不得以 Git 状态判断存在性

## prompt 参数使用指南

prompt 参数是本技能的核心能力，用于控制识别重点和输出质量。不同场景应使用不同的 prompt：

### 通用图片识别

未提供 prompt 时使用默认提示词，适合通用场景的图片内容描述。

### 视觉验证场景

视觉验证 prompt 应明确要求布局、文字、颜色、对齐、裁剪和渲染异常等检查维度。

### 定向识别场景

**提取表格数据：**

```
prompt=提取图片中所有表格的数据，以Markdown表格格式输出，保留原始行列结构，表头使用加粗
```

**识别 UI 界面元素：**

```
prompt=识别这个UI截图中的所有交互元素：按钮（文字和位置）、输入框（标签和占位符）、链接、下拉菜单等，按从上到下、从左到右的顺序列出
```

### prompt 编写原则

1. **明确识别目标**：清楚说明需要从图片中获取什么信息
2. **结构化要求**：使用编号列表指定识别维度，确保输出结构化
3. **保留原文**：要求"逐字逐句"保留文字内容，不总结、不改写
4. **异常检测**：显式要求报告渲染异常、排版问题、溢出等
5. **格式约束**：指定输出格式（Markdown 表格、列表等）
6. **上下文说明**：说明图片来源（文档 to-image 或 view screenshot 转换结果），帮助模型理解识别重点

## 输出

返回 Markdown 格式的图片描述，包含：
- outputPath：写入的 Markdown 文件路径（outputMode=file 时存在）
- content：图片内容的 Markdown 描述

## 边界

- 仅处理当前工作区内本地图片文件（JPG/PNG/GIF/WebP/BMP）
- 不处理远程 URL
- 不处理音频、视频等非图片格式
- 图片文件不存在时返回友好提示
- 图片过大时返回提示并建议缩小文件
