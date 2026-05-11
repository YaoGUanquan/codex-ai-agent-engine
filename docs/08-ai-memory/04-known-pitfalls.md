<!-- ae-codex:init managed -->
# 已知坑点

## 中文与编码

- Windows/PowerShell 输出可能把合法 UTF-8 中文显示成乱码。
- 修改生成的 Markdown 前，先用显式 UTF-8 读取验证。
- 不要根据默认 `Get-Content` 或控制台显示判断中文 Markdown 已损坏；优先使用 `Get-Content -Encoding UTF8` 或 Git diff 验证。

## Init 与 Recovery

- `init` 生成的可续跑过程笔记位于 `docs/00-process/active`，不能只让 `recovery` 扫描 `docs/ae`。
- 安装示例里清理临时目录前后都可以运行 init，但命令必须显式进入 `$target` 或 `"$target"`。
