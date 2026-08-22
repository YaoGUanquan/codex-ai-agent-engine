import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { dirname, extname } from 'node:path'
import { assertCanonicalContained, normalizeArtifactOutputPath, parseOptions, safeResolve, safeName, timestamp, truthy } from './utils.mjs'

const allowedStatuses = new Set(['passed', 'failed', 'blocked', 'unverified', 'not-applicable', 'partial'])
const allowedSeverities = new Set(['P0', 'P1', 'P2', 'P3', 'info'])
const maxInputBytes = 2 * 1024 * 1024

export function reportCommand(worktree, args) {
  const opts = parseOptions(args)
  const input = String(opts.input || opts._[0] || '').trim()
  if (!input) throw new Error('report requires --input <json-or-markdown>')
  const inputPath = safeResolve(worktree, input)
  assertCanonicalContained(worktree, inputPath, 'report input')
  if (!existsSync(inputPath) || !statSync(inputPath).isFile()) throw new Error(`report input not found: ${input}`)
  if (statSync(inputPath).size > maxInputBytes) throw new Error(`report input exceeds ${maxInputBytes} bytes`)
  const data = parseReportInput(inputPath)
  const outRel = opts.out
    ? normalizeArtifactOutputPath(String(opts.out), 'report')
    : `docs/ae/reports/${safeName(data.title || 'ae-report')}-${timestamp()}.html`
  const outPath = safeResolve(worktree, outRel)
  const outputExtension = extname(outPath).toLowerCase()
  if (!new Set(['.html', '.md']).has(outputExtension)) throw new Error('report output must use the .html or .md extension')
  assertCanonicalContained(worktree, outPath, 'report output')
  const cdnUrl = validateCdnOptions(opts)
  if (truthy(opts['dry-run'])) {
    return { status: 'ok', tool: 'report', input, output: outRel, bytes: null, preview: `file://${outPath}`, externalDependencies: cdnUrl ? [cdnUrl] : [] }
  }
  const rendered = outputExtension === '.md' ? renderMarkdown(data) : renderHtml(data, { cdn: Boolean(cdnUrl), cdnUrl })
  mkdirSync(dirname(outPath), { recursive: true })
  writeFileSync(outPath, rendered, 'utf8')
  return { status: 'ok', tool: 'report', input, output: outRel, bytes: statSync(outPath).size, preview: `file://${outPath}`, externalDependencies: cdnUrl ? [cdnUrl] : [] }
}

function parseReportInput(path) {
  const text = readFileSync(path, 'utf8')
  if (extname(path).toLowerCase() === '.json') {
    const value = JSON.parse(text)
    return validateReport(value?.tool === 'skill-audit' ? adaptSkillAudit(value) : value)
  }
  return validateReport({ title: path.split(/[\\/]/).at(-1), summary: text.trim(), findings: [], validation: [], limitations: ['Markdown input was treated as summary text.'] })
}

function renderMarkdown(data) {
  const lines = [
    '# ' + escapeMarkdown(data.title),
    '',
    '- Status: **' + escapeMarkdown(data.status) + '**',
    '- Generated: ' + escapeMarkdown(data.generatedAt),
    '',
    escapeMarkdown(data.summary),
    '',
    '## Findings',
    '',
  ]
  if (!data.findings.length) lines.push('No findings.', '')
  for (const finding of data.findings) {
    lines.push(
      '### [' + escapeMarkdown(finding.severity) + '] ' + escapeMarkdown(finding.title),
      '',
      '- Path: ' + escapeMarkdown(finding.path || 'n/a'),
      '- Evidence: ' + escapeMarkdown(finding.evidence || 'n/a'),
      '- Impact: ' + escapeMarkdown(finding.impact || 'n/a'),
      '- Fix: ' + escapeMarkdown(finding.fix || 'n/a'),
      '',
    )
  }
  for (const [title, values] of [['Validation', data.validation], ['Artifacts', data.artifacts], ['Limitations', data.limitations], ['Unverified', data.unverified]]) {
    if (!values.length) continue
    lines.push('## ' + title, '', ...values.map((value) => '- ' + escapeMarkdown(value)), '')
  }
  return lines.join('\n') + '\n'
}

function adaptSkillAudit(value) {
  const records = Array.isArray(value.records) ? value.records : []
  const deferred = records.filter((record) => record.status === 'defer').length
  const findings = records.flatMap((record) => Array.isArray(record.findings)
    ? record.findings.map((finding) => ({
      severity: finding.severity || 'info',
      title: `${record.name}: ${finding.code || 'audit finding'}`,
      path: record.sourcePath || '',
      evidence: finding.evidence || '',
      impact: finding.impact || '',
      fix: finding.fix || finding.disposition || '',
    }))
    : [])
  return {
    title: 'AE Skill Portfolio Audit',
    status: findings.some((finding) => finding.severity === 'P0' || finding.severity === 'P1') ? 'failed' : deferred > 0 ? 'partial' : 'passed',
    generatedAt: value.generatedAt,
    summary: `Audited ${value.sourceCount || records.length} plugin skills and ${value.mirrorCount || 0} matching maintenance mirrors across ${(value.auditedDimensions || []).length} static dimensions.`,
    findings,
    artifacts: records.flatMap((record) => [record.sourcePath, record.mirrorPath]).filter(Boolean),
    limitations: Array.isArray(value.limitations) ? value.limitations : [],
    unverified: ['Runtime skill behavior and user outcomes remain outside this static audit.'],
  }
}

function validateReport(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('report input must be a JSON object')
  const status = value.status || 'unverified'
  if (!allowedStatuses.has(status)) throw new Error(`report status is not supported: ${status}`)
  if (Array.isArray(value.findings) && value.findings.length > 500) throw new Error('report findings exceed the 500-item limit')
  const findings = Array.isArray(value.findings) ? value.findings.map((finding, index) => {
    if (!finding || typeof finding !== 'object') throw new Error(`report finding ${index + 1} must be an object`)
    const severity = finding.severity || 'info'
    if (!allowedSeverities.has(severity)) throw new Error(`report finding ${index + 1} severity is not supported: ${severity}`)
    return { severity, title: boundedString(finding.title || `Finding ${index + 1}`, `finding ${index + 1} title`), evidence: boundedString(finding.evidence, `finding ${index + 1} evidence`), impact: boundedString(finding.impact, `finding ${index + 1} impact`), fix: boundedString(finding.fix, `finding ${index + 1} fix`), path: finding.path ? boundedString(finding.path, `finding ${index + 1} path`) : '' }
  }) : []
  return {
    title: boundedString(value.title || 'AE Report', 'report title', 500),
    status,
    summary: boundedString(value.summary, 'report summary'),
    generatedAt: boundedString(value.generatedAt || new Date().toISOString(), 'report generatedAt', 200),
    findings,
    validation: boundedArray(value.validation, 'validation'),
    artifacts: boundedArray(value.artifacts, 'artifacts'),
    limitations: boundedArray(value.limitations, 'limitations'),
    unverified: boundedArray(value.unverified, 'unverified'),
  }
}

function renderHtml(data, options) {
  const external = options.cdn ? `<link rel="stylesheet" href="${escapeHtml(options.cdnUrl || 'https://cdn.example.invalid/optional.css')}">` : ''
  const findingRows = data.findings.length === 0
    ? '<tr><td colspan="5">No findings</td></tr>'
    : data.findings.map((finding) => `<tr><td><span class="severity ${escapeHtml(finding.severity)}">${escapeHtml(finding.severity)}</span></td><td>${escapeHtml(finding.title)}</td><td>${escapeHtml(finding.path)}</td><td>${escapeHtml(finding.evidence)}</td><td>${escapeHtml(finding.fix)}</td></tr>`).join('')
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(data.title)}</title>${external}<style>
:root{color-scheme:light dark;font-family:system-ui,-apple-system,Segoe UI,sans-serif}body{margin:0;background:#f6f7f9;color:#17202a}main{max-width:1100px;margin:32px auto;padding:0 20px}header,section{background:#fff;border:1px solid #d9dee7;border-radius:8px;padding:20px;margin-bottom:16px}h1{margin:0 0 8px;font-size:28px}h2{font-size:18px;margin-top:0}.meta{display:flex;gap:12px;flex-wrap:wrap;color:#596579;font-size:14px}.status{font-weight:700;text-transform:uppercase}.passed{color:#147a3d}.failed,.P0,.P1{color:#b42318}.blocked,.P2{color:#b54708}.unverified,.partial{color:#7a5af8}.not-applicable,.info{color:#596579}table{border-collapse:collapse;width:100%;font-size:14px}th,td{border-bottom:1px solid #e6e9ef;text-align:left;padding:10px;vertical-align:top}.severity{font-weight:700}.mono{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;white-space:pre-wrap}ul{margin:8px 0 0;padding-left:22px}@media(prefers-color-scheme:dark){body{background:#111827;color:#e5e7eb}header,section{background:#1f2937;border-color:#374151}th,td{border-color:#374151}}
</style></head><body><main><header><h1>${escapeHtml(data.title)}</h1><div class="meta"><span class="status ${escapeHtml(data.status)}">${escapeHtml(data.status)}</span><span>Generated ${escapeHtml(data.generatedAt)}</span>${options.cdn ? '<span>External assets enabled</span>' : '<span>Offline self-contained assets</span>'}</div><p>${escapeHtml(data.summary)}</p></header><section><h2>Findings</h2><table><thead><tr><th>Severity</th><th>Title</th><th>Path</th><th>Evidence</th><th>Fix</th></tr></thead><tbody>${findingRows}</tbody></table></section>${listSection('Validation', data.validation, true)}${listSection('Artifacts', data.artifacts, false)}${listSection('Limitations', data.limitations, false)}${listSection('Unverified', data.unverified, false)}</main></body></html>`
}

function listSection(title, items, mono) {
  if (!items.length) return ''
  return `<section><h2>${title}</h2><ul>${items.map((item) => `<li${mono ? ' class="mono"' : ''}>${escapeHtml(item)}</li>`).join('')}</ul></section>`
}

function escapeHtml(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;')
}

function escapeMarkdown(value) {
  return String(value).replaceAll('\\\\', '\\\\\\\\').replaceAll('|', '\\\\|').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
}

function validateCdnOptions(opts) {
  if (!truthy(opts.cdn)) return null
  const value = String(opts['cdn-url'] || '').trim()
  if (!value) throw new Error('report --cdn requires an explicit --cdn-url https://...')
  let url
  try { url = new URL(value) } catch { throw new Error('report --cdn-url must be a valid HTTPS URL') }
  if (url.protocol !== 'https:') throw new Error('report --cdn-url must use HTTPS')
  return url.href
}

function boundedString(value, label, max = 20000) {
  const text = String(value || '')
  if (text.length > max) throw new Error(`${label} exceeds ${max} characters`)
  return text
}

function boundedArray(value, label) {
  if (!Array.isArray(value)) return []
  if (value.length > 1000) throw new Error(`report ${label} exceeds the 1000-item limit`)
  return value.map((item, index) => boundedString(item, `${label} item ${index + 1}`))
}
