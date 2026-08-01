[CmdletBinding()]
param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$CodexSecurityArguments
)

$ErrorActionPreference = 'Stop'

# Fill these values manually after initialization. Keep this file outside the repository.
$NewApiBaseUrl = 'REPLACE_WITH_NEW_API_BASE_URL'
$NewApiKey = 'REPLACE_WITH_NEW_API_KEY'
$DeclaredModel = 'REPLACE_WITH_MODEL_ID'

$ProjectRoot = 'REPLACE_WITH_TARGET_PROJECT_ROOT'
$CodexSecurity = Join-Path $ProjectRoot 'node_modules\.bin\codex-security.cmd'

if (-not (Test-Path -LiteralPath $CodexSecurity -PathType Leaf)) {
    throw "Project-local codex-security executable was not found: $CodexSecurity"
}

$env:OPENAI_API_KEY = $NewApiKey
$CodexProviderArguments = @(
    '--model', $DeclaredModel,
    '--codex', ("openai_base_url='{0}'" -f $NewApiBaseUrl.TrimEnd('/')),
    '--codex', 'features.multi_agent_v2.max_concurrent_threads_per_session=6'
)

& $CodexSecurity @CodexSecurityArguments @CodexProviderArguments
exit $LASTEXITCODE
