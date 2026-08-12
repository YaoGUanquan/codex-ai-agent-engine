# Local Smoke Request Config Template

Use this reference when the local-runtime smoke gate requires a token-free request template. It is a fillable handoff shape, not an HTTP client, secret store, or permission to read a populated credential file.

## Required Properties

Every created template must:

1. Be written as UTF-8 without BOM through a UTF-8-safe writer such as the editor Write tool or `fs.writeFileSync(..., 'utf8')`.
2. Be non-empty and immediately usable after the user replaces the credential placeholder.
3. Contain exactly one clearly marked credential placeholder: `REPLACE_WITH_LOCAL_TOKEN`.
4. Contain the bounded method, URL or path template, and any non-secret headers or fixture settings needed for the approved request.
5. Contain numbered fill steps so the user knows what to edit and how to confirm readiness in chat.
6. Live only at a verified ignored project path or in the operating-system temporary directory.

Never create an empty file, a comments-only stub without request fields, or a template that already contains a real token. Never write this file with PowerShell `Out-File`, default `Set-Content`, or shell redirection when the file includes non-ASCII text.

## Curl Config Shape

Prefer a curl `-K` / `--config` file when the session can invoke curl by absolute config path without echoing contents:

```text
# AE local smoke request config
# Encoding: UTF-8 without BOM
# Fill steps:
# 1. Replace REPLACE_WITH_LOCAL_TOKEN with your local token.
# 2. Save this file.
# 3. Reply in chat that the config is ready. Do not paste the token.
#
# 填写步骤：
# 1. 将 REPLACE_WITH_LOCAL_TOKEN 替换为本地 token。
# 2. 保存本文件。
# 3. 在对话中回复“配置已就绪”，不要粘贴 token。

header = "Authorization: Bearer REPLACE_WITH_LOCAL_TOKEN"
header = "Content-Type: application/json"
url = "http://127.0.0.1:<port><path-template>"
request = "GET"
```

Replace `<port>` and `<path-template>` with the bounded local values for the approved smoke. Keep query or body values out unless they are non-secret fixtures required by the contract. For a POST that is still read-only by contract, keep `request = "POST"` and include only the approved non-secret fixture body through curl-supported config fields.

## Handoff Rules

- Report the absolute path once, then wait for the user to populate the placeholder locally and confirm readiness.
- After handoff, do not open, read, write, print, or validate the populated reference.
- Invoke the client only by absolute path reference in a form that does not echo configuration contents.
- Archive only sanitized evidence. Never archive, commit, relocate, or expose the secret reference.
