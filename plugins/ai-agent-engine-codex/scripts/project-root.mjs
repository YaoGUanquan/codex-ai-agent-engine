import { existsSync, lstatSync, readFileSync, realpathSync, statSync } from 'node:fs'
import { dirname, isAbsolute, parse, relative, resolve } from 'node:path'

const managedMarker = '<!-- ae-codex:init managed -->'

export function resolveProjectRoot({ cwd = process.cwd(), explicitRoot = null, command = 'help', globalRoot = null } = {}) {
  const requested = explicitRoot ? checkedDirectory(explicitRoot, 'project root') : realDirectory(cwd, 'working directory')
  const resolvedGlobal = globalRoot ? realDirectory(globalRoot, 'global runtime root') : null
  if (resolvedGlobal && requested === resolvedGlobal) throw projectRootRequired('global runtime root is not a project root')

  if (explicitRoot) {
    if (isLinked(explicitRoot)) throw projectRootRequired('symbolic links and junctions are not accepted for --project-root')
    const markers = projectMarkers(requested)
    if (command !== 'init' && markers.length === 0) throw projectRootRequired('--project-root must contain a project marker for this command')
    return { root: requested, markers, explicit: true }
  }

  for (let current = requested; ; current = dirname(current)) {
    if (resolvedGlobal && current === resolvedGlobal) throw projectRootRequired('global runtime root is not a project root')
    const markers = projectMarkers(current)
    if (markers.length > 0) return { root: current, markers, explicit: false }
    if (current === parse(current).root) break
  }
  throw projectRootRequired(command === 'init'
    ? 'init requires --project-root when no project marker is found'
    : 'run from a project or pass --project-root')
}

export function projectMarkers(root) {
  const markers = []
  if (existsSync(resolve(root, '.git'))) markers.push('git')
  const agents = resolve(root, 'AGENTS.md')
  if (existsSync(agents) && readFileSync(agents, 'utf8').includes(managedMarker)) markers.push('managed-agents')
  if (existsSync(resolve(root, 'docs', 'ae'))) markers.push('docs-ae')
  return markers
}

export function isInside(root, target) {
  const rel = relative(root, target)
  return rel === '' || (!isAbsolute(rel) && !rel.startsWith('..') && !rel.includes('..\\') && !rel.includes('../'))
}

function checkedDirectory(path, label) {
  if (isLinked(path)) throw projectRootRequired(`${label} must not be a symbolic link or junction`)
  return realDirectory(path, label)
}

function realDirectory(path, label) {
  const absolute = resolve(path)
  if (!existsSync(absolute) || !statSync(absolute).isDirectory()) throw projectRootRequired(`${label} does not exist or is not a directory`)
  return realpathSync(absolute)
}

function isLinked(path) {
  try {
    const stat = lstatSync(resolve(path))
    return stat.isSymbolicLink() || stat.isBlockDevice() || stat.isCharacterDevice()
  } catch {
    return true
  }
}

function projectRootRequired(message) {
  const error = new Error(`AE_PROJECT_ROOT_REQUIRED: ${message}`)
  error.code = 'AE_PROJECT_ROOT_REQUIRED'
  return error
}
