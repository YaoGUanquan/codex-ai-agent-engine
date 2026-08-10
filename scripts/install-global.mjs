#!/usr/bin/env node
import { runGlobalInstall } from '../plugins/ai-agent-engine-codex/scripts/global-install.mjs'

try {
  console.log(JSON.stringify(runGlobalInstall(), null, 2))
} catch (error) {
  console.error(error instanceof Error ? `ERROR: ${error.message}` : `ERROR: ${String(error)}`)
  process.exitCode = 1
}
