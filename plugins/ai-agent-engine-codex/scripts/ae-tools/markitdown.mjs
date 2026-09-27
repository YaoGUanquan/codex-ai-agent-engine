// Lightweight local-file to Markdown conversion.
import { existsSync, statSync } from 'node:fs'
import { basename, extname, relative } from 'node:path'
import { assertCanonicalContained, boundedInteger, isPlainObject, normalizeRelPath, parseOptions, readBoundedText, safeResolve, scalarMarkdownCell } from './utils.mjs'

export function markitdown(worktree, args) {
  const opts = parseOptions(args)
  const fileArg = opts.file || opts._[0]
  if (!fileArg) throw new Error('markitdown requires a local file path')
  const filePath = safeResolve(worktree, fileArg)
  assertCanonicalContained(worktree, filePath, 'conversion source')
  if (!existsSync(filePath) || !statSync(filePath).isFile()) throw new Error(`file not found: ${fileArg}`)
  const size = statSync(filePath).size
  if (size > 10 * 1024 * 1024) throw new Error('markitdown file limit is 10 MB')
  const format = String(opts.format || detectMarkdownFormat(filePath)).toLowerCase()
  const text = readBoundedText(filePath, 10 * 1024 * 1024).text
  const diagnostics = { rowLimit: boundedInteger(opts['row-limit'], 5000, '--row-limit', 1, 5000), columnLimit: boundedInteger(opts['column-limit'], 50, '--column-limit', 1, 200), reasons: [] }
  const outputLimit = boundedInteger(opts['max-output-bytes'], 1024 * 1024, '--max-output-bytes', 1, 16 * 1024 * 1024)
  let markdown = convertToMarkdown(format, text, basename(filePath), diagnostics)
  if (Buffer.byteLength(markdown) > outputLimit) {
    markdown = Buffer.from(markdown).subarray(0, outputLimit).toString('utf8')
    while (Buffer.byteLength(markdown) > outputLimit || markdown.endsWith('\ufffd')) markdown = markdown.slice(0, -1)
    diagnostics.reasons.push('output-byte-limit')
  }
  return {
    status: 'ok',
    tool: 'markitdown',
    file: normalizeRelPath(relative(worktree, filePath)),
    format,
    fileSize: size,
    markdown,
    completeness: { complete: diagnostics.reasons.length === 0, reasons: [...new Set(diagnostics.reasons)] },
    diagnostics: { ...diagnostics, outputBytes: Buffer.byteLength(markdown), outputLimit },
  }
}

function detectMarkdownFormat(filePath) {
  const ext = extname(filePath).toLowerCase()
  if (ext === '.html' || ext === '.htm') return 'html'
  if (ext === '.csv') return 'csv'
  if (ext === '.tsv') return 'tsv'
  if (ext === '.json') return 'json'
  if (ext === '.yaml' || ext === '.yml') return 'yaml'
  if (ext === '.xml') return 'xml'
  if (ext === '.md' || ext === '.markdown') return 'markdown'
  if (ext === '.txt' || ext === '') return 'text'
  throw new Error(`unsupported lightweight markitdown format: ${ext || '<none>'}`)
}

function convertToMarkdown(format, text, title, diagnostics) {
  if (format === 'markdown') return text
  if (format === 'text') return `# ${title}\n\n\`\`\`text\n${text}\n\`\`\`\n`
  if (format === 'json') return jsonToMarkdown(text, diagnostics)
  if (format === 'csv') return delimitedToMarkdown(text, ',', diagnostics)
  if (format === 'tsv') return delimitedToMarkdown(text, '\t', diagnostics)
  if (format === 'html') return htmlToMarkdown(text)
  if (format === 'yaml' || format === 'xml') return `# ${title}\n\n\`\`\`${format}\n${text}\n\`\`\`\n`
  throw new Error(`unsupported lightweight markitdown format: ${format}`)
}

function jsonToMarkdown(text, diagnostics) {
  const value = JSON.parse(text)
  if (Array.isArray(value) && value.every(isPlainObject)) {
    return objectsToMarkdownTable(value, diagnostics)
  }
  return `\`\`\`json\n${JSON.stringify(value, null, 2)}\n\`\`\`\n`
}

function delimitedToMarkdown(text, delimiter, diagnostics) {
  const rows = parseDelimited(text, delimiter, diagnostics)
  if (rows.length === 0) return ''
  const headers = rows[0]
  const data = rows.slice(1)
  return markdownTable(headers, data)
}

function parseDelimited(text, delimiter, diagnostics) {
  const rows = []
  let row = []
  let cell = ''
  let quoted = false
  let closedQuote = false
  let line = 1
  let column = 1
  let totalRows = 0
  let columns = 0
  const finishCell = () => {
    columns++
    if (row.length < diagnostics.columnLimit) row.push(cell.trim())
    else if (!diagnostics.reasons.includes('column-limit')) diagnostics.reasons.push('column-limit')
  }
  const finishRow = () => {
    if (row.length === 0 && cell === '') return
    finishCell()
    totalRows++
    if (rows.length <= diagnostics.rowLimit) rows.push(row)
    else if (!diagnostics.reasons.includes('row-limit')) diagnostics.reasons.push('row-limit')
    diagnostics.maxColumns = Math.max(diagnostics.maxColumns || 0, columns)
    row = []
    columns = 0
    cell = ''
    closedQuote = false
  }
  for (let index = 0; index < text.length; index++) {
    const char = text[index]
    const next = text[index + 1]
    if (quoted) {
      if (char === '"') {
        if (next === '"') { cell += '"'; index++; column += 2; continue }
        quoted = false
        closedQuote = true
      } else if (char === '\r' && next === '\n') {
        cell += '\n'
        index++
        line++
        column = 0
      } else {
        cell += char
        if (char === '\n') { line++; column = 0 }
      }
      column++
      continue
    }
    if (closedQuote && char !== delimiter && char !== '\n' && char !== '\r') throw malformedDelimited(line, column, 'unexpected character after closing quote')
    if (char === '"') {
      if (cell.length !== 0) throw malformedDelimited(line, column, 'unexpected quote in unquoted field')
      quoted = true
      closedQuote = false
    } else if (char === delimiter) {
      finishCell()
      cell = ''
      closedQuote = false
    } else if (char === '\n') {
      finishRow()
      line++
      column = 0
    } else if (char === '\r') {
      if (next === '\n') index++
      finishRow()
      line++
      column = 0
    } else {
      cell += char
    }
    column++
  }
  if (quoted) throw malformedDelimited(line, column, 'unterminated quoted field')
  finishRow()
  diagnostics.rowsTotal = Math.max(0, totalRows - 1)
  diagnostics.rowsReturned = Math.max(0, rows.length - 1)
  return rows
}

function malformedDelimited(line, column, detail) {
  return new Error(`invalid delimited data at line ${line}, column ${column}: ${detail}`)
}

function objectsToMarkdownTable(rows, diagnostics) {
  const headers = new Set()
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      if (headers.has(key)) continue
      if (headers.size < diagnostics.columnLimit) headers.add(key)
      else if (!diagnostics.reasons.includes('column-limit')) diagnostics.reasons.push('column-limit')
    }
  }
  if (rows.length > diagnostics.rowLimit) diagnostics.reasons.push('row-limit')
  diagnostics.rowsTotal = rows.length
  diagnostics.rowsReturned = Math.min(rows.length, diagnostics.rowLimit)
  const keys = [...headers]
  return markdownTable(keys, rows.slice(0, diagnostics.rowLimit).map((row) => keys.map((key) => scalarMarkdownCell(row[key]))))
}

function markdownTable(headers, rows) {
  const safeHeaders = headers.map(scalarMarkdownCell)
  const lines = [
    `| ${safeHeaders.join(' | ')} |`,
    `| ${safeHeaders.map(() => '---').join(' | ')} |`,
  ]
  for (const row of rows) {
    lines.push(`| ${safeHeaders.map((_, index) => scalarMarkdownCell(row[index] ?? '')).join(' | ')} |`)
  }
  return `${lines.join('\n')}\n`
}

function htmlToMarkdown(text) {
  return text
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, '# $1\n\n')
    .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, '## $1\n\n')
    .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, '### $1\n\n')
    .replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '$1\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '- $1\n')
    .replace(/<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim() + '\n'
}
