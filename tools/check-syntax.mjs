import { spawnSync } from 'node:child_process'
import { extname, resolve } from 'node:path'
import { repoRoot, walkFiles } from './files.mjs'

const files = ['tools', 'tests', 'skills'].flatMap((directory) => walkFiles(resolve(repoRoot, directory)))
  .filter((file) => ['.mjs', '.js', '.cjs'].includes(extname(file)))
const failures = []
for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8', timeout: 10000 })
  if (result.error || result.status !== 0) failures.push({ file, message: result.error?.message || result.stderr, status: result.status })
}
console.log(JSON.stringify({ status: failures.length ? 'failed' : 'ok', checked: files.length, failures }, null, 2))
process.exitCode = failures.length ? 1 : 0
