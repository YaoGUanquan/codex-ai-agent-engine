import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import path from 'node:path'

const require = createRequire(import.meta.url)

export function getOcrPlatformPackage(platform = process.platform, arch = process.arch): string {
  return `@alibaba-group/ocr-${platform}-${arch}`
}

export interface OcrFinding { path?: string; content?: string; start_line?: number; end_line?: number; severity?: string; category?: string }
export interface OcrJsonResult { comments?: OcrFinding[]; summary?: { files_reviewed?: number }; [key: string]: unknown }

export function resolveOcrBinary(): { path: string; source: 'npm' | 'path' } {
  try {
    const packageDir = path.dirname(require.resolve(`${getOcrPlatformPackage()}/package.json`))
    const file = process.platform === 'win32' ? 'opencodereview.exe' : 'opencodereview'
    return { path: path.join(packageDir, 'bin', file), source: 'npm' }
  } catch {
    return { path: 'ocr', source: 'path' }
  }
}

export function parseOcrJson(stdout: string): OcrJsonResult {
  const text = stdout.trim()
  if (!text) return { comments: [], summary: { files_reviewed: 0 } }
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start < 0 || end < start) throw new Error('ocr output is not JSON')
  return JSON.parse(text.slice(start, end + 1)) as OcrJsonResult
}

export async function runOcr(args: string[], cwd?: string): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  const binary = resolveOcrBinary()
  return new Promise((resolve, reject) => {
    const child = spawn(binary.path, args, { cwd, shell: false, windowsHide: true })
    let stdout = ''; let stderr = ''
    child.stdout?.on('data', (data: Buffer) => { stdout += data.toString() })
    child.stderr?.on('data', (data: Buffer) => { stderr += data.toString() })
    child.once('error', reject)
    child.once('close', (code) => resolve({ stdout, stderr, exitCode: code ?? -1 }))
  })
}
