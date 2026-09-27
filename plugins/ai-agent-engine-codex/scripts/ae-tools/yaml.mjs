// Minimal YAML subset parser shared by swagger and multi-agent profile loading.
import { clonePlain, isPlainObject } from './utils.mjs'

export function parseSimpleYaml(text) {
  if (Buffer.byteLength(text, 'utf8') > 1024 * 1024) throw new Error('YAML exceeds the 1 MiB parser budget')
  const root = {}
  const stack = [{ indent: -1, value: root }]
  const indents = new WeakMap()
  const lines = text.replace(/\r\n/g, '\n').split('\n')

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const rawLine = lines[lineIndex]
    if (/^\s*\t/.test(rawLine)) throw new Error(`YAML tabs are not supported at line ${lineIndex + 1}`)
    const withoutComment = stripYamlComment(rawLine)
    if (!withoutComment.trim()) continue
    const indent = withoutComment.match(/^ */)?.[0].length ?? 0
    const trimmed = withoutComment.trim()
    if (trimmed === '---' && Object.keys(root).length === 0) continue
    if (stack.length > 64) throw new Error('YAML nesting exceeds 64 levels')
    while (stack.length > 1 && indent <= stack[stack.length - 1].indent) stack.pop()
    const parent = stack[stack.length - 1].value
    if (!indents.has(parent)) indents.set(parent, indent)
    if (indents.get(parent) !== indent) throw new Error(`Invalid YAML indentation at line ${lineIndex + 1}`)

    if (trimmed.startsWith('- ')) {
      if (!Array.isArray(parent)) throw new Error(`Unsupported YAML sequence placement: ${trimmed}`)
      const value = trimmed.slice(2).trim()
      const item = parseYamlSequenceItem(value, lines, lineIndex)
      parent.push(item)
      if (isPlainObject(item)) {
        stack.push({ indent, value: item })
        const sep = mappingSeparator(value)
        if (sep > 0 && !value.slice(sep + 1).trim()) {
          stack.push({ indent: indent + 2, value: item[parseKey(value.slice(0, sep).trim())] })
        }
      }
      continue
    }

    const sep = mappingSeparator(trimmed)
    if (sep < 0) throw new Error(`Unsupported YAML line: ${trimmed}`)
    const key = parseKey(trimmed.slice(0, sep).trim())
    const rest = trimmed.slice(sep + 1).trim()
    if (!isPlainObject(parent)) throw new Error(`Unsupported YAML mapping placement: ${trimmed}`)
    if (Object.hasOwn(parent, key)) throw new Error(`Duplicate YAML key: ${key}`)

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
  const sep = mappingSeparator(value)
  if (sep > 0) {
    const key = parseKey(value.slice(0, sep).trim())
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
  if (value.startsWith('"')) {
    try { return JSON.parse(value) } catch { throw new Error('Invalid or unsupported YAML double-quoted scalar') }
  }
  if (value.startsWith("'")) {
    if (!/^'(?:[^']|'')*'$/.test(value)) throw new Error('Invalid YAML single-quoted scalar')
    return value.slice(1, -1).replaceAll("''", "'")
  }
  if (value.startsWith('[') && value.endsWith(']')) {
    const inner = value.slice(1, -1).trim()
    if (!inner) return []
    const items = []
    let start = 0
    let quote = null
    for (let i = 0; i <= inner.length; i++) {
      const char = inner[i]
      if (quote) {
        if (char === quote && inner[i - 1] !== '\\') quote = null
      } else if (char === "'" || char === '"') quote = char
      else if (char === ',' || i === inner.length) { items.push(parseYamlScalar(inner.slice(start, i).trim())); start = i + 1 }
      else if ('[]{}'.includes(char)) throw new Error('Nested YAML flow collections are not supported; use block mappings/sequences')
    }
    if (quote) throw new Error('Unterminated YAML flow scalar')
    return items
  }
  if (value === '{}') return {}
  if (/^[\[\]{}|>&*!%@`]/.test(value) || /:\s/.test(value)) throw new Error(`Unsupported or malformed YAML scalar: ${value}`)
  return value
}

function parseKey(value) {
  const key = /^['"]/.test(value) ? parseYamlScalar(value) : value
  if (typeof key !== 'string' || !key || ['__proto__', 'prototype', 'constructor', '<<'].includes(key)) throw new Error(`Unsupported YAML key: ${value}`)
  return key
}

function mappingSeparator(value) {
  let quote = null
  for (let i = 0; i < value.length; i++) {
    const char = value[i]
    if (quote) {
      if (char === quote && value[i - 1] !== '\\') quote = null
    } else if (char === "'" || char === '"') quote = char
    else if (char === ':' && (i + 1 === value.length || /\s/.test(value[i + 1]))) return i
  }
  return -1
}

function resolveRefs(value, root, seen = new Set(), budget = { remaining: 20000 }, depth = 0) {
  if (--budget.remaining < 0 || depth > 64) throw new Error('YAML reference expansion exceeds node/depth budget')
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) value[i] = resolveRefs(value[i], root, seen, budget, depth + 1)
    return value
  }
  if (!isPlainObject(value)) return value
  if (typeof value.$ref === 'string' && value.$ref.startsWith('#/')) {
    if (seen.has(value.$ref)) return value
    const target = resolveJsonPointer(root, value.$ref)
    if (target) {
      seen.add(value.$ref)
      const resolved = resolveRefs(clonePlain(target), root, seen, budget, depth + 1)
      seen.delete(value.$ref)
      return { ...resolved, ...Object.fromEntries(Object.entries(value).filter(([key]) => key !== '$ref')) }
    }
  }
  for (const [key, child] of Object.entries(value)) value[key] = resolveRefs(child, root, seen, budget, depth + 1)
  return value
}

function resolveJsonPointer(root, ref) {
  return ref.slice(2).split('/').reduce((current, part) => {
    if (!current) return undefined
    const key = part.replace(/~1/g, '/').replace(/~0/g, '~')
    return current[key]
  }, root)
}
