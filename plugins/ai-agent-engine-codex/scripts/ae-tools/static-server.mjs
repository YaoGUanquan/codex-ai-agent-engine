// Local static preview server.
import { existsSync, readFileSync, statSync } from 'node:fs'
import { basename, dirname, extname, isAbsolute, relative, resolve } from 'node:path'
import { createServer } from 'node:http'
import { clampInteger, normalizeRelPath, parseOptions, printJson, safeResolve, truthy } from './utils.mjs'

export function staticServer(worktree, args) {
  const opts = parseOptions(args)
  const targetArg = opts._[0] || opts.path || '.'
  const targetPath = safeResolve(worktree, targetArg)
  if (!existsSync(targetPath)) throw new Error(`static-server target not found: ${targetArg}`)
  const stat = statSync(targetPath)
  const port = clampInteger(Number(opts.port || 4173), 4173, 1, 65535)
  const host = String(opts.host || '127.0.0.1')
  const rel = normalizeRelPath(relative(worktree, targetPath)) || '.'
  const urlPath = stat.isDirectory() ? '/' : `/${encodeURI(basename(targetPath))}`
  const base = {
    status: 'ok',
    tool: 'static-server',
    host,
    port,
    url: `http://${host}:${port}${urlPath}`,
    serving: {
      path: rel,
      type: stat.isDirectory() ? 'directory' : 'file',
    },
  }
  if (truthy(opts['dry-run'])) {
    printJson({ ...base, dryRun: true })
    return
  }
  const root = stat.isDirectory() ? targetPath : dirname(targetPath)
  const server = createServer((request, response) => {
    try {
      const requestPath = decodeURIComponent((request.url || '/').split('?')[0] || '/')
      const localPath = requestPath === '/' && stat.isFile() ? targetPath : resolve(root, `.${requestPath}`)
      const relPath = relative(root, localPath)
      if (relPath.startsWith('..') || isAbsolute(relPath) || !existsSync(localPath) || !statSync(localPath).isFile()) {
        response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' })
        response.end('Not found')
        return
      }
      response.writeHead(200, { 'content-type': contentType(localPath) })
      response.end(readFileSync(localPath))
    } catch (error) {
      response.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' })
      response.end(error instanceof Error ? error.message : String(error))
    }
  })
  server.listen(port, host, () => {
    printJson({ ...base, dryRun: false, pid: process.pid })
  })
}

function contentType(path) {
  const ext = extname(path).toLowerCase()
  const map = {
    '.html': 'text/html; charset=utf-8',
    '.htm': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.txt': 'text/plain; charset=utf-8',
  }
  return map[ext] || 'application/octet-stream'
}
