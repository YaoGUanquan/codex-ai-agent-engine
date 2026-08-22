import { closeSync, existsSync, lstatSync, mkdirSync, openSync, readdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { randomUUID } from 'node:crypto'
import { assertCanonicalContained, normalizeArtifactOutputPath, parseOptions, safeResolve, toPosix } from './utils.mjs'

const states = new Set(['backlog', 'ready', 'in-progress', 'blocked', 'done', 'closed'])
const priorities = new Set(['P0', 'P1', 'P2', 'P3'])
const transitions = new Map([
  ['backlog', new Set(['ready', 'in-progress', 'blocked', 'closed'])],
  ['ready', new Set(['backlog', 'in-progress', 'blocked', 'closed'])],
  ['in-progress', new Set(['ready', 'blocked', 'done', 'closed'])],
  ['blocked', new Set(['backlog', 'ready', 'in-progress', 'closed'])],
  ['done', new Set(['in-progress', 'closed'])],
  ['closed', new Set()],
])

export function issueCommand(worktree, args) {
  const [action, ...rest] = args
  if (!action) throw new Error('issue requires create, list, show, update, transition, link, depend, close, or depends')
  const opts = parseOptions(rest)
  const root = safeResolve(worktree, 'docs/ae/issues')
  assertCanonicalContained(worktree, dirname(root), 'issue storage')
  mkdirSync(root, { recursive: true })
  assertCanonicalContained(worktree, root, 'issue storage')
  if (lstatSync(root).isSymbolicLink()) throw new Error('issue storage must not be a symbolic link or junction')
  const dispatch = () => runIssueAction(action, worktree, root, opts)
  return new Set(['create', 'update', 'transition', 'link', 'depend', 'close']).has(action)
    ? withIssueLock(root, dispatch)
    : dispatch()
}

function runIssueAction(action, worktree, root, opts) {
  switch (action) {
    case 'create': return createIssue(worktree, root, opts)
    case 'list': return listIssues(root, opts)
    case 'show': return showIssue(worktree, root, opts)
    case 'update': return updateIssue(worktree, root, opts)
    case 'transition': return transitionIssue(worktree, root, opts)
    case 'link': return linkIssue(worktree, root, opts)
    case 'depend': return dependIssue(worktree, root, opts)
    case 'close': return closeIssue(worktree, root, opts)
    case 'depends': return dependencyQuery(worktree, root, opts)
    default: throw new Error(`unknown issue action: ${action}`)
  }
}

function createIssue(worktree, root, opts) {
  const title = singleLine(opts.title).trim()
  if (!title) throw new Error('issue create requires --title')
  const status = String(opts.status || 'backlog')
  const priority = String(opts.priority || 'P2')
  validateState(status); validatePriority(priority)
  if ((status === 'done' || status === 'closed') && !singleLine(opts.reason)) throw new Error('issue create with done/closed status requires --reason')
  const id = allocateId(root)
  const now = new Date().toISOString()
  const issue = { id, title, status, priority, description: singleLine(opts.description), createdAt: now, updatedAt: now, dependsOn: [], links: [], closeReason: singleLine(opts.reason) || null, history: [historyEvent(now, 'create', status, 'created')] }
  const path = join(root, `${id}.md`)
  writeIssue(path, issue, true)
  return { status: 'ok', action: 'create', issue: publicIssue(worktree, path, issue) }
}

function listIssues(root, opts) {
  if (opts.status) validateState(String(opts.status))
  const issues = loadIssues(root).filter((issue) => !opts.status || issue.status === String(opts.status)).sort((a, b) => a.id.localeCompare(b.id))
  return { status: 'ok', action: 'list', issues }
}

function showIssue(worktree, root, opts) {
  const issue = requireIssue(root, opts.id || opts._?.[0])
  const path = join(root, `${issue.id}.md`)
  return { status: 'ok', action: 'show', issue: publicIssue(worktree, path, issue) }
}

function updateIssue(worktree, root, opts) {
  const issue = requireIssue(root, opts.id || opts._?.[0])
  const changes = []
  if (opts.title !== undefined) {
    const title = singleLine(opts.title)
    if (!title) throw new Error('issue update --title must not be empty')
    issue.title = title
    changes.push('title')
  }
  if (opts.description !== undefined) {
    issue.description = singleLine(opts.description)
    changes.push('description')
  }
  if (opts.priority !== undefined) {
    const priority = String(opts.priority)
    validatePriority(priority)
    issue.priority = priority
    changes.push(`priority=${priority}`)
  }
  if (changes.length === 0) throw new Error('issue update requires --title, --description, or --priority')
  const now = new Date().toISOString()
  issue.updatedAt = now
  issue.history.push(historyEvent(now, 'update', issue.status, changes.join(', ')))
  const path = join(root, `${issue.id}.md`)
  writeIssue(path, issue)
  return { status: 'ok', action: 'update', issue: publicIssue(worktree, path, issue), changed: changes }
}

function transitionIssue(worktree, root, opts) {
  const issue = requireIssue(root, opts.id || opts._?.[0])
  const next = String(opts.status || '')
  validateState(next)
  if (next !== issue.status && !transitions.get(issue.status)?.has(next)) throw new Error(`issue transition is not allowed: ${issue.status} -> ${next}`)
  if ((next === 'closed' || next === 'done') && !String(opts.reason || issue.closeReason || '').trim()) throw new Error('issue transition to done/closed requires --reason')
  const previous = issue.status
  const now = new Date().toISOString()
  issue.status = next; issue.updatedAt = now
  if (opts.reason) issue.closeReason = singleLine(opts.reason)
  if (next !== 'closed' && next !== 'done') issue.closeReason = null
  issue.history.push(historyEvent(now, 'transition', `${previous}->${next}`, singleLine(opts.reason) || 'state changed'))
  const path = join(root, `${issue.id}.md`); writeIssue(path, issue)
  return { status: 'ok', action: 'transition', issue: publicIssue(worktree, path, issue) }
}

function linkIssue(worktree, root, opts) {
  const issue = requireIssue(root, opts.id || opts._?.[0])
  const link = String(opts.path || opts.link || '').trim()
  if (!link) throw new Error('issue link requires --path <artifact>')
  const normalized = normalizeArtifactOutputPath(link, 'issue link')
  const target = safeResolve(worktree, normalized)
  if (!existsSync(target)) throw new Error(`linked artifact does not exist: ${normalized}`)
  assertCanonicalContained(worktree, target, 'issue link')
  if (lstatSync(target).isSymbolicLink()) throw new Error(`linked artifact must not be a symbolic link: ${normalized}`)
  issue.links = [...new Set([...issue.links, normalized])]; issue.updatedAt = new Date().toISOString()
  issue.history.push(historyEvent(issue.updatedAt, 'link', issue.status, normalized))
  const path = join(root, `${issue.id}.md`); writeIssue(path, issue)
  return { status: 'ok', action: 'link', issue: publicIssue(worktree, path, issue), linked: normalized }
}

function closeIssue(worktree, root, opts) { return transitionIssue(worktree, root, { ...opts, status: 'closed' }) }

function dependIssue(worktree, root, opts) {
  const issue = requireIssue(root, opts.id || opts._?.[0])
  const dependencyId = String(opts.on || opts.dependsOn || opts.depends || '').trim()
  if (!dependencyId) throw new Error('issue depend requires --on <issue-id>')
  if (dependencyId === issue.id) throw new Error('an issue cannot depend on itself')
  requireIssue(root, dependencyId)
  if (hasDependencyPath(root, dependencyId, issue.id)) throw new Error(`issue dependency would create a cycle: ${issue.id} -> ${dependencyId}`)
  issue.dependsOn = [...new Set([...issue.dependsOn, dependencyId])]
  issue.updatedAt = new Date().toISOString()
  issue.history.push(historyEvent(issue.updatedAt, 'depend', issue.status, dependencyId))
  const path = join(root, `${issue.id}.md`); writeIssue(path, issue)
  return { status: 'ok', action: 'depend', issue: publicIssue(worktree, path, issue), dependsOn: dependencyId }
}

function dependencyQuery(worktree, root, opts) {
  const issue = requireIssue(root, opts.id || opts._?.[0])
  return { status: 'ok', action: 'depends', issue: publicIssue(worktree, join(root, `${issue.id}.md`), issue), dependencies: issue.dependsOn.map((id) => requireIssue(root, id)) }
}

function loadIssues(root) {
  return readdirSync(root)
    .filter((name) => /^AEI-\d{8}-\d{3}\.md$/.test(name))
    .map((name) => readIssueFile(root, name.slice(0, -3)))
}

function requireIssue(root, id) {
  const value = String(id || '').trim()
  if (!/^AEI-\d{8}-\d{3}$/.test(value)) throw new Error('issue id must match AEI-YYYYMMDD-NNN')
  const path = join(root, `${value}.md`)
  if (!existsSync(path)) throw new Error(`issue not found: ${value}`)
  return readIssueFile(root, value)
}

function readIssueFile(root, id) {
  const path = join(root, `${id}.md`)
  if (lstatSync(path).isSymbolicLink()) throw new Error(`issue record must not be a symbolic link: ${id}`)
  const issue = parseIssue(readFileSync(path, 'utf8'))
  if (issue.id !== id) throw new Error(`issue record ID does not match its filename: ${id}`)
  validateState(issue.status)
  validatePriority(issue.priority)
  return issue
}

function hasDependencyPath(root, startId, targetId, visited = new Set()) {
  if (startId === targetId) return true
  if (visited.has(startId)) return false
  visited.add(startId)
  return requireIssue(root, startId).dependsOn.some((id) => hasDependencyPath(root, id, targetId, visited))
}

function parseIssue(text) {
  const fields = {}
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^([A-Za-z][A-Za-z ]+):\s*(.*)$/)
    if (match) fields[match[1].trim()] = match[2].trim()
  }
  let history = []
  if (fields.HistoryJSON) {
    try { history = JSON.parse(fields.HistoryJSON) } catch { throw new Error('issue HistoryJSON must be valid JSON') }
    if (!Array.isArray(history)) throw new Error('issue HistoryJSON must be an array')
  }
  return { id: fields.ID, title: fields.Title, status: fields.Status, priority: fields.Priority, description: fields.Description || '', createdAt: fields.Created || '', updatedAt: fields.Updated || '', dependsOn: fields.DependsOn && fields.DependsOn !== '-' ? fields.DependsOn.split(',').map((v) => v.trim()).filter(Boolean) : [], links: fields.Links && fields.Links !== '-' ? fields.Links.split(',').map((v) => v.trim()).filter(Boolean) : [], closeReason: fields.CloseReason && fields.CloseReason !== '-' ? fields.CloseReason : null, history }
}

function renderIssue(issue) {
  return `---\ntype: issue\nid: ${issue.id}\nstatus: ${issue.status}\npriority: ${issue.priority}\ncreated: ${issue.createdAt}\nupdated: ${issue.updatedAt}\n---\n\n# ${issue.title}\n\nID: ${issue.id}\nTitle: ${issue.title}\nStatus: ${issue.status}\nPriority: ${issue.priority}\nCreated: ${issue.createdAt}\nUpdated: ${issue.updatedAt}\nDependsOn: ${issue.dependsOn.length ? issue.dependsOn.join(', ') : '-'}\nLinks: ${issue.links.length ? issue.links.join(', ') : '-'}\nCloseReason: ${issue.closeReason || '-'}\nDescription: ${issue.description.replace(/\r?\n/g, ' ')}\nHistoryJSON: ${JSON.stringify(issue.history)}\n`
}

function publicIssue(worktree, path, issue) { return { ...issue, path: toPosix(relative(worktree, path)) } }
function validateState(value) { if (!states.has(value)) throw new Error(`issue status is not supported: ${value}`) }
function validatePriority(value) { if (!priorities.has(value)) throw new Error(`issue priority is not supported: ${value}`) }
function allocateId(root) { const date = new Date().toISOString().slice(0, 10).replaceAll('-', ''); const used = new Set(loadIssues(root).map((issue) => issue.id)); for (let n = 1; n <= 999; n++) { const id = `AEI-${date}-${String(n).padStart(3, '0')}`; if (!used.has(id)) return id } throw new Error('issue id space exhausted for today') }
function singleLine(value) { return String(value || '').replace(/[\r\n]+/g, ' ').trim() }
function historyEvent(at, action, value, detail) { return { at, action, value, detail } }

function writeIssue(path, issue, create = false) {
  if (create && existsSync(path)) throw new Error(`issue already exists: ${issue.id}`)
  const temp = `${path}.${process.pid}.${randomUUID()}.tmp`
  writeFileSync(temp, renderIssue(issue), 'utf8')
  try { renameSync(temp, path) } finally { rmSync(temp, { force: true }) }
}

function withIssueLock(root, action) {
  const lockPath = join(root, 'issues.lock')
  const deadline = Date.now() + 5_000
  while (true) {
    try {
      const descriptor = openSync(lockPath, 'wx')
      closeSync(descriptor)
      break
    } catch (error) {
      if (error?.code !== 'EEXIST' || Date.now() >= deadline) throw new Error('issue tracker is busy; retry after the active writer finishes')
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 10)
    }
  }
  try { return action() } finally { rmSync(lockPath, { force: true }) }
}
