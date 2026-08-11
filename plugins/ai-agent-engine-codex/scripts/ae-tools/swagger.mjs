// Swagger/OpenAPI local spec summaries.
import { extname } from 'node:path'
import { parseSimpleYaml } from './yaml.mjs'
import { printJson, readText, safeResolve } from './utils.mjs'

export function printSwagger(args) {
  const opts = parseSwaggerArgs(args)
  if (!opts.source) throw new Error('swagger requires <source>')
  if (/^https?:\/\//i.test(opts.source)) {
    throw new Error('Remote URL parsing must use Codex network approval first. Download the spec or provide a local file.')
  }
  const sourcePath = safeResolve(process.cwd(), opts.source)
  const spec = loadSpec(sourcePath)
  const operations = collectOperations(spec)
  const filtered = filterOperations(operations, opts)
  const mode = opts.mode || (opts.method && opts.path && filtered.length === 1 ? 'detail' : 'overview')
  const result = {
    source: opts.source,
    title: spec.info?.title || null,
    version: spec.info?.version || null,
    openapi: spec.openapi || spec.swagger || null,
    total_operations: operations.length,
    matched_operations: filtered.length,
    mode,
    operations: mode === 'detail' ? filtered.slice(0, 5).map(detailOperation) : filtered.slice(0, 50).map(summaryOperation),
  }
  printJson(result)
}

function loadSpec(path) {
  const text = readText(path)
  const ext = extname(path).toLowerCase()
  if (ext === '.json' || text.trim().startsWith('{')) return JSON.parse(text)
  if (ext === '.yaml' || ext === '.yml' || /^[A-Za-z0-9_.-]+\s*:/m.test(text)) return parseSimpleYaml(text)
  throw new Error('Unsupported Swagger/OpenAPI format. Provide JSON, YAML, or YML.')
}

function collectOperations(spec) {
  const operations = []
  const validMethods = new Set(['get', 'post', 'put', 'patch', 'delete', 'head', 'options', 'trace'])
  for (const [pathName, pathItem] of Object.entries(spec.paths || {})) {
    if (!pathItem || typeof pathItem !== 'object') continue
    for (const [method, op] of Object.entries(pathItem)) {
      if (!validMethods.has(method.toLowerCase())) continue
      operations.push({ path: pathName, method: method.toUpperCase(), operation: op || {}, pathParameters: pathItem.parameters || [], spec })
    }
  }
  return operations
}

function filterOperations(operations, opts) {
  return operations.filter((item) => {
    if (opts.method && item.method !== opts.method.toUpperCase()) return false
    if (opts.path && item.path !== opts.path) return false
    if (opts.tag) {
      const tags = Array.isArray(item.operation.tags) ? item.operation.tags : []
      if (!tags.some((tag) => String(tag).toLowerCase() === opts.tag.toLowerCase())) return false
    }
    if (opts.keyword) {
      const haystack = [item.path, item.operation.summary, item.operation.description, item.operation.operationId, ...(item.operation.tags || [])].filter(Boolean).join(' ').toLowerCase()
      if (!haystack.includes(opts.keyword.toLowerCase())) return false
    }
    return true
  })
}

function summaryOperation(item) {
  return {
    method: item.method,
    path: item.path,
    operationId: item.operation.operationId || null,
    summary: item.operation.summary || null,
    tags: item.operation.tags || [],
  }
}

function detailOperation(item) {
  const parameters = [...(item.pathParameters || []), ...(item.operation.parameters || [])]
  const responses = Object.entries(item.operation.responses || {}).map(([status, response]) => ({
    status,
    description: response?.description || null,
    contentTypes: response?.content ? Object.keys(response.content) : [],
  }))
  return {
    ...summaryOperation(item),
    description: item.operation.description || null,
    deprecated: Boolean(item.operation.deprecated),
    parameters: parameters.map((p) => ({ name: p.name, in: p.in, required: Boolean(p.required), description: p.description || null, schema: summarizeSchema(p.schema) })),
    requestBody: summarizeRequestBody(item.operation.requestBody),
    responses,
    security: item.operation.security || item.spec.security || [],
  }
}

function summarizeRequestBody(body) {
  if (!body) return null
  const content = Object.fromEntries(Object.entries(body.content || {}).map(([type, media]) => [type, {
    schema: summarizeSchema(media.schema),
  }]))
  return {
    required: Boolean(body.required),
    description: body.description || null,
    contentTypes: body.content ? Object.keys(body.content) : [],
    content,
    schemas: Object.fromEntries(Object.entries(content).map(([type, media]) => [type, media.schema])),
  }
}

function summarizeSchema(schema) {
  if (!schema) return null
  if (schema.$ref) return { ref: schema.$ref }
  return {
    type: schema.type || null,
    format: schema.format || null,
    required: schema.required || undefined,
    properties: schema.properties ? summarizeProperties(schema.properties) : undefined,
    items: schema.items ? summarizeSchema(schema.items) : undefined,
  }
}

function summarizeProperties(properties) {
  return Object.fromEntries(Object.entries(properties).slice(0, 40).map(([name, schema]) => [name, summarizeSchema(schema)]))
}

function parseSwaggerArgs(args) {
  const opts = { source: null }
  for (const arg of args) {
    const idx = arg.indexOf(':')
    if (idx > 0 && ['method', 'path', 'tag', 'keyword', 'mode'].includes(arg.slice(0, idx))) {
      opts[arg.slice(0, idx)] = arg.slice(idx + 1)
    } else if (!opts.source) {
      opts.source = arg
    }
  }
  return opts
}
