import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

export const makeTempDir = (prefix = 'ae-skills-test-') => mkdtempSync(join(tmpdir(), prefix))
