try {
  const { ensurePlaywrightCliGlobal } = await import('./ensure-playwright-lib.mjs')
  await ensurePlaywrightCliGlobal()
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  console.warn(`playwright-cli bootstrap failed: ${message}`)
}
