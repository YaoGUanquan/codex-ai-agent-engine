import { cpSync, mkdtempSync, mkdirSync, readFileSync, rmSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { tmpdir } from 'node:os'
import { dirname, join, relative, resolve } from 'node:path'
import { isMain, repoRoot, walkFiles } from './files.mjs'
import { requiredSkills, validateCollection, validateSkill } from './validate.mjs'

function inventory(root) {
  return walkFiles(root).map((file) => ({
    path: relative(root, file).replace(/\\/g, '/'),
    sha256: createHash('sha256').update(readFileSync(file)).digest('hex'),
  }))
}

export function checkSmoke(source = resolve(repoRoot, 'skills')) {
  const baseline = validateCollection(source)
  if (baseline.errors.length) throw new Error(baseline.errors.join('\n'))
  const temp = mkdtempSync(join(tmpdir(), 'ae-independent-smoke-'))
  const singles = []
  try {
    for (const name of requiredSkills) {
      // Each isolated project receives one folder, with no collection or tools.
      const destination = join(temp, name, '.agents', 'skills', name)
      mkdirSync(dirname(destination), { recursive: true })
      cpSync(join(source, name), destination, { recursive: true, errorOnExist: true, force: false })
      const result = validateSkill(destination)
      if (result.errors.length) throw new Error(`${name}: ${result.errors.join('; ')}`)
      if (JSON.stringify(inventory(destination)) !== JSON.stringify(inventory(join(source, name)))) {
        throw new Error(`${name}: copy content differs from source`)
      }
      singles.push(name)
    }
    const collection = join(temp, 'all', '.agents', 'skills')
    mkdirSync(dirname(collection), { recursive: true })
    cpSync(source, collection, { recursive: true, errorOnExist: true, force: false })
    const all = validateCollection(collection)
    if (all.errors.length) throw new Error(all.errors.join('\n'))
    if (JSON.stringify(inventory(source)) !== JSON.stringify(inventory(collection))) throw new Error('Collection copy differs from source')
    return { status: 'ok', independentCopies: singles, collection: all.skills, proof: 'Local copies, resource closure and fingerprints; no host/model execution or real user installation.' }
  } finally {
    rmSync(temp, { recursive: true, force: true })
  }
}

if (isMain(import.meta.url)) {
  try {
    console.log(JSON.stringify(checkSmoke(), null, 2))
  } catch (error) {
    console.error(error.message)
    process.exitCode = 1
  }
}
