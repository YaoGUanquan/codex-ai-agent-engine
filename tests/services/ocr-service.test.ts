import { EventEmitter } from 'node:events'
import { describe, expect, it, vi } from 'vitest'

const childProcess = vi.hoisted(() => ({ spawn: vi.fn() }))

vi.mock('node:child_process', () => childProcess)

import { getOcrPlatformPackage, parseOcrJson, resolveOcrBinary, runOcr } from '../../src/services/ocr-service.js'

describe('ocr-service', () => {
  it('resolves an npm binary or PATH fallback', () => expect(resolveOcrBinary().path).toBeTruthy())
  it('resolves the Windows x64 platform package used by OpenCodeReview', () => {
    expect(getOcrPlatformPackage('win32', 'x64')).toBe('@alibaba-group/ocr-win32-x64')
  })
  it('executes OCR without a shell', async () => {
    const child = Object.assign(new EventEmitter(), { stdout: new EventEmitter(), stderr: new EventEmitter() })
    childProcess.spawn.mockReturnValue(child)

    const result = runOcr(['--version'])
    child.emit('close', 0)

    await expect(result).resolves.toMatchObject({ exitCode: 0 })
    expect(childProcess.spawn).toHaveBeenCalledWith(expect.any(String), ['--version'], expect.objectContaining({ shell: false }))
  })
  it('parses JSON output', () => expect(parseOcrJson('{"comments":[]}').comments).toEqual([]))
})
