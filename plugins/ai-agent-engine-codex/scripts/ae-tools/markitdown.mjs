// Lightweight local-file to Markdown conversion.
import { existsSync, statSync } from 'node:fs'
import { basename, extname, relative } from 'node:path'
import { isPlainObject, normalizeRelPath, parseOptions, readText, safeResolve, scalarMarkdownCell } from './utils.mjs'

export function markitdown(worktree, args) {
  const opts = parseOptions(args)
  const fileArg = opts.file || opts._[0]
  if (!fileArg) throw new Error('markitdown requires a local file path')
  const filePath = safeResolve(worktree, fileArg)
  if (!existsSync(filePath) || !statSync(filePath).isFile()) throw new Error(`file not found: ${fileArg}`)
  const size = statSync(filePath).size
  if (size > 10 * 1024 * 1024) throw new Error('markitdown file limit is 10 MB')
  const format = String(opts.format || detectMarkdownFormat(filePath)).toLowerCase()
  const text = readText(filePath)
  return {
    status: 'ok',
    tool: 'markitdown',
    file: normalizeRelPath(relative(worktree, filePath)),
    format,
    fileSize: size,
    markdown: convertToMarkdown(format, text, basename(filePath)),
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

function convertToMarkdown(format, text, title) {
  if (format === 'markdown') return text
  if (format === 'text') return `# ${title}\n\n\`\`\`text\n${text}\n\`\`\`\n`
  if (format === 'json') return jsonToMarkdown(text)
  if (format === 'csv') return delimitedToMarkdown(text, ',')
  if (format === 'tsv') return delimitedToMarkdown(text, '\t')
  if (format === 'html') return htmlToMarkdown(text)
  if (format === 'yaml' || format === 'xml') return `# ${title}\n\n\`\`\`${format}\n${text}\n\`\`\`\n`
  throw new Error(`unsupported lightweight markitdown format: ${format}`)
}

function jsonToMarkdown(text) {
  const value = JSON.parse(text)
  if (Array.isArray(value) && value.every(isPlainObject)) {
    return objectsToMarkdownTable(value)
  }
  return `\`\`\`json\n${JSON.stringify(value, null, 2)}\n\`\`\`\n`
}

function delimitedToMarkdown(text, delimiter) {
  const rows = parseDelimited(text, delimiter)
  if (rows.length === 0) return ''
  const headers = rows[0]
  const data = rows.slice(1)
  return markdownTable(headers, data)
}

function parseDelimited(text, delimiter) {
  return text.replace(/\r\n/g, '\n').split('\n').filter((line) => line.length > 0).slice(0, 5001).map((line) => line.split(delimiter).map((cell) => cell.trim()))
}

function objectsToMarkdownTable(rows) {
  const headers = [...new Set(rows.flatMap((row) => Object.keys(row)))].slice(0, 50)
  return markdownTable(headers, rows.slice(0, 5000).map((row) => headers.map((key) => scalarMarkdownCell(row[key]))))
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
