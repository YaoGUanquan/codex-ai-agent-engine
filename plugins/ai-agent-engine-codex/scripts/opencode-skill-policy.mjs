import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

export const opencodeExcludedSkillNames = Object.freeze([
  'ae-computer-use-guard',
  'ae-imagegen-prompt',
  'ae-video-edit-computer',
])

export const opencodeExcludedSkills = new Set(opencodeExcludedSkillNames)

export function isOpenCodeProject(targetRoot) {
  return existsSync(resolve(targetRoot, 'opencode.json')) || existsSync(resolve(targetRoot, '.opencode'))
}
