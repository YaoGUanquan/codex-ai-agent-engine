// Minimal YAML subset parser shared by swagger and multi-agent profile loading.
import { clonePlain, isPlainObject } from './utils.mjs'

export function parseSimpleYaml(text) {
  const root = {}
  const stack = [{ indent: -1, value: root }]
  const lines = text.replace(/\r\n/g, '\n').split('\n')

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const rawLine = lines[lineIndex]
    const withoutComment = stripYamlComment(rawLine)
    if (!withoutComment.trim()) continue
    const indent = withoutComment.match(/^ */)?.[0].length ?? 0
    const trimmed = withoutComment.trim()
    while (stack.length > 1 && indent <= stack[stack.length - 1].indent) stack.pop()
    const parent = stack[stack.length - 1].value

    if (trimmed.startsWith('- ')) {
      if (!Array.isArray(parent)) throw new Error(`Unsupported YAML sequence placement: ${trimmed}`)
      const item = parseYamlSequenceItem(trimmed.slice(2).trim(), lines, lineIndex)
      parent.push(item)
      if (isPlainObject(item)) stack.push({ indent, value: item })
      continue
    }

    const sep = trimmed.indexOf(':')
    if (sep < 0) throw new Error(`Unsupported YAML line: ${trimmed}`)
    const key = trimmed.slice(0, sep).trim()
    const rest = trimmed.slice(sep + 1).trim()
    if (!isPlainObject(parent)) throw new Error(`Unsupported YAML mapping placement: ${trimmed}`)

    if (rest) {
      parent[key] = parseYamlScalar(rest)
      continue
    }

    const child = nextYamlContainer(lines, lineIndex) || {}
    parent[key] = child
    stack.push({ indent, value: child })
  }

  resolveRefs(root, root)
  return root
}

function parseYamlSequenceItem(value, lines, lineIndex) {
  const sep = value.indexOf(':')
  if (sep > 0) {
    const key = value.slice(0, sep).trim()
    const rest = value.slice(sep + 1).trim()
    return {
      [key]: rest ? parseYamlScalar(rest) : nextYamlContainer(lines, lineIndex) || {},
    }
  }
  return parseYamlScalar(value)
}

function nextYamlContainer(lines, currentIndex) {
  const currentIndent = lines[currentIndex].match(/^ */)?.[0].length ?? 0
  for (let i = currentIndex + 1; i < lines.length; i++) {
    const line = stripYamlComment(lines[i])
    if (!line.trim()) continue
    const indent = line.match(/^ */)?.[0].length ?? 0
    if (indent <= currentIndent) return {}
    return line.trim().startsWith('- ') ? [] : {}
  }
  return {}
}

function stripYamlComment(line) {
  let inSingle = false
  let inDouble = false
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === "'" && !inDouble) inSingle = !inSingle
    if (char === '"' && !inSingle && line[i - 1] !== '\\') inDouble = !inDouble
    if (char === '#' && !inSingle && !inDouble && (i === 0 || /\s/.test(line[i - 1]))) return line.slice(0, i)
  }
  return line
}

function parseYamlScalar(value) {
  if (value === 'true') return true
  if (value === 'false') return false
  if (value === 'null') return null
  if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value)
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1)
  }
  if (value.startsWith('[') && value.endsWith(']')) {
    const inner = value.slice(1, -1).trim()
    if (!inner) return []
    return inner.split(',').map((item) => parseYamlScalar(item.trim()))
  }
  return value
}

function resolveRefs(value, root, seen = new Set()) {
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) value[i] = resolveRefs(value[i], root, seen)
    return value
  }
  if (!isPlainObject(value)) return value
  if (typeof value.$ref === 'string' && value.$ref.startsWith('#/')) {
    if (seen.has(value.$ref)) return value
    const target = resolveJsonPointer(root, value.$ref)
    if (target) {
      seen.add(value.$ref)
      const resolved = resolveRefs(clonePlain(target), root, seen)
      seen.delete(value.$ref)
      return { ...resolved, ...Object.fromEntries(Object.entries(value).filter(([key]) => key !== '$ref')) }
    }
  }
  for (const [key, child] of Object.entries(value)) value[key] = resolveRefs(child, root, seen)
  return value
}

function resolveJsonPointer(root, ref) {
  return ref.slice(2).split('/').reduce((current, part) => {
    if (!current) return undefined
    const key = part.replace(/~1/g, '/').replace(/~0/g, '~')
    return current[key]
  }, root)
}
