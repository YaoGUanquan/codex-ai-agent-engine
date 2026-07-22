import { exec } from 'node:child_process'
import { promisify } from 'node:util'

const execAsync = promisify(exec)

export async function ensurePlaywrightCliGlobal() {
  if (process.env.SKIP_PLAYWRIGHT_GLOBAL === '1' || process.env.SKIP_PLAYWRIGHT_GLOBAL === 'true') {
    return
  }

  try {
    await execAsync('playwright-cli --version')
    return
  } catch {
    // Install the approved global executable only when it is unavailable.
  }

  try {
    await execAsync('npm install -g @playwright/cli@^0.1.17', { timeout: 180000 })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.warn(`@playwright/cli global installation failed: ${message}`)
  }
}
