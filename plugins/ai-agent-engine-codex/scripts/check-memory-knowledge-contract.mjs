#!/usr/bin/env node
import { checkMemoryKnowledgeRegistry } from './memory-knowledge-contract.mjs'

const result = checkMemoryKnowledgeRegistry(process.cwd(), process.argv.slice(2))
console.log(JSON.stringify(result, null, 2))
if (result.status !== 'ok') process.exitCode = 1
