import { mkdtempSync, mkdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'
import type { Part } from '@opencode-ai/sdk'

import { degradeMediaFileParts } from '../../src/services/media-degradation-service.js'

const tempRoots: string[] = []

afterEach(() => {
  for (const root of tempRoots.splice(0)) {
    rmSync(root, { recursive: true, force: true })
  }
})

describe('media-degradation-service', () => {
  it('should retain directory FileParts when the model lacks media support', () => {
    const root = mkdtempSync(join(tmpdir(), 'ae-media-directory-'))
    tempRoots.push(root)
    const directory = join(root, 'assets')
    mkdirSync(directory)
    const parts: Part[] = [{
      id: 'directory',
      sessionID: 'session',
      messageID: 'message',
      type: 'file',
      mime: 'application/octet-stream',
      filename: 'assets',
      source: { type: 'file', path: directory, text: { value: '@assets', start: 0, end: 7 } },
    } as Extract<Part, { type: 'file' }>]

    degradeMediaFileParts(parts, { image: false, audio: false, video: false })

    expect(parts).toHaveLength(1)
    expect(parts[0]).toMatchObject({ type: 'file', filename: 'assets' })
  })
})
