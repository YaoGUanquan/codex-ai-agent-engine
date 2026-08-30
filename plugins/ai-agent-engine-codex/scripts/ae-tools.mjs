#!/usr/bin/env node
// Thin dispatcher for ae-tools commands. Command logic lives in ./ae-tools/*.mjs.
import { knowledgeMap, knowledgeQuery, memoryQuery } from './memory-knowledge-contract.mjs'
import { spawnSync } from 'node:child_process'
import { resolveProjectRoot } from './project-root.mjs'
import { fileURLToPath } from 'node:url'
import { claudeDelegate } from './ae-tools/claude.mjs'
import { evidenceCommand } from './ae-tools/evidence.mjs'
import { gate } from './ae-tools/gate.mjs'
import { graphBuild, graphQuery } from './ae-tools/graph.mjs'
import { printHelp } from './ae-tools/help.mjs'
import { initProject } from './ae-tools/init.mjs'
import { issueCommand } from './ae-tools/issues.mjs'
import { skillAuditCommand } from './ae-tools/skill-audit.mjs'
import { markitdown } from './ae-tools/markitdown.mjs'
import { recovery } from './ae-tools/recovery.mjs'
import { reviewContract, reviewPackage } from './ae-tools/review.mjs'
import { reportCommand } from './ae-tools/report.mjs'
import { staticServer } from './ae-tools/static-server.mjs'
import { printSwagger } from './ae-tools/swagger.mjs'
import { taskAnalyze, taskBrief } from './ae-tools/tasks.mjs'
import { tidy } from './ae-tools/tidy.mjs'
import { formatError, printContractResult, printJson } from './ae-tools/utils.mjs'

function main() {
  const [command, ...rawArgs] = process.argv.slice(2)
  try {
    const { args, projectRoot, bypassRootDiscovery } = globalInvocation(command, rawArgs)
    const worktree = command === 'help' || command === undefined || command === 'swagger' || command === 'markitdown' || command === 'static-server' || command === 'ae-update' || bypassRootDiscovery
      ? process.cwd()
      : resolveProjectRoot({
        cwd: process.cwd(),
        explicitRoot: projectRoot,
        command,
        globalRoot: process.env.AE_RUNTIME_ROOT || null,
      }).root
    switch (command) {
      case 'help':
      case undefined:
        printHelp(args.join(' ').trim())
        break
      case 'recovery':
        printJson(recovery(worktree))
        break
      case 'tidy':
        printJson(tidy(worktree, args))
        break
      case 'init':
        printJson(initProject(worktree, args))
        break
      case 'task-analyze':
        printJson(taskAnalyze(worktree, args))
        break
      case 'task-brief':
        printJson(taskBrief(worktree, args))
        break
      case 'report':
        printJson(reportCommand(worktree, args))
        break
      case 'issue':
        printJson(issueCommand(worktree, args))
        break
      case 'skill-audit':
        printJson(skillAuditCommand(worktree, args))
        break
      case 'review-package':
        printJson(reviewPackage(worktree, args))
        break
      case 'gate':
        printJson(gate(worktree, args))
        break
      case 'swagger':
        printSwagger(args)
        break
      case 'claude-delegate':
        printJson(claudeDelegate(worktree, args))
        break
      case 'review-contract':
        printJson(reviewContract(worktree, args))
        break
      case 'evidence':
        printJson(evidenceCommand(worktree, args))
        break
      case 'markitdown':
        printJson(markitdown(worktree, args))
        break
      case 'static-server':
        staticServer(worktree, args)
        break
      case 'check-ae-artifacts':
        runBundledScript('check-ae-artifacts.mjs', worktree, ['--target', worktree, ...args])
        break
      case 'check-design-contract':
        runBundledScript('check-design-contract.mjs', worktree, ['--target', worktree, ...args])
        break
      case 'check-memory-knowledge-contract':
        runBundledScript('check-memory-knowledge-contract.mjs', worktree, args)
        break
      case 'set-ae-language':
        runBundledScript('set-language.mjs', worktree, ['--target', worktree, ...args])
        break
      case 'ae-update':
        runBundledScript('update-global.mjs', worktree, args)
        break
      case 'ae-memory-query':
      case 'memory-query':
        printContractResult(memoryQuery(worktree, args))
        break
      case 'ae-knowledge-map':
      case 'knowledge-map':
        printContractResult(knowledgeMap(worktree, args))
        break
      case 'ae-knowledge-query':
      case 'knowledge-query':
        printContractResult(knowledgeQuery(worktree, args))
        break
      case 'ae-graph-build':
      case 'graph-build':
        printJson(graphBuild(worktree, args))
        break
      case 'ae-graph-query':
      case 'graph-query':
        printJson(graphQuery(worktree, args))
        break
      default:
        throw new Error(`Unknown command: ${command}\nAvailable: help, init, recovery, tidy, task-analyze, task-brief, report, issue, skill-audit, review-package, gate, swagger, claude-delegate, review-contract, evidence, markitdown, static-server, check-ae-artifacts, check-design-contract, check-memory-knowledge-contract, set-ae-language, ae-update, ae-memory-query, ae-knowledge-map, ae-knowledge-query, ae-graph-build, ae-graph-query`)
    }
  } catch (error) {
    console.error(formatError(error))
    process.exitCode = 1
  }
}

function globalInvocation(command, rawArgs) {
  if (command === 'help' || command === undefined || command === 'swagger' || command === 'markitdown' || command === 'static-server' || command === 'ae-update') return { args: rawArgs, projectRoot: null }
  const args = []
  let projectRoot = null
  for (let index = 0; index < rawArgs.length; index++) {
    const arg = rawArgs[index]
    if (arg === '--project-root') {
      const value = rawArgs[index + 1]
      if (!value || value.startsWith('--')) throw new Error('AE_PROJECT_ROOT_REQUIRED: --project-root requires a directory')
      projectRoot = value
      index++
      continue
    }
    if (arg.startsWith('--project-root=')) {
      projectRoot = arg.slice('--project-root='.length)
      if (!projectRoot) throw new Error('AE_PROJECT_ROOT_REQUIRED: --project-root requires a directory')
      continue
    }
    args.push(arg)
  }
  const genericRootCommands = new Set(['ae-graph-build', 'graph-build', 'ae-graph-query', 'graph-query'])
  if (!projectRoot && genericRootCommands.has(command) && args.some((arg) => arg === '--root' || arg.startsWith('--root='))) {
    return { args, projectRoot: null, bypassRootDiscovery: true }
  }
  return { args, projectRoot }
}

function runBundledScript(name, worktree, args) {
  const script = fileURLToPath(new URL(`./${name}`, import.meta.url))
  const result = spawnSync(process.execPath, [script, ...args], { cwd: worktree, encoding: 'utf8', stdio: 'pipe', shell: false })
  if (result.stdout) process.stdout.write(result.stdout)
  if (result.stderr) process.stderr.write(result.stderr)
  if (result.error) throw result.error
  if (result.status !== 0) process.exitCode = result.status ?? 1
}

main()
