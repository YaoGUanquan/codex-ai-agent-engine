import test from 'node:test'
import assert from 'node:assert/strict'
import {
  virtualSource, boundedPages, boundedChunks, fullFetchThenPage,
  collectBeforeChunk, unboundedFanout, streamToArray,
} from './fixtures/data-scale/bounded-examples.mjs'

// Isolated examples/instruction acceptance, not generated-code or DB performance proof.
const size = 8
const totals = [0, 1, size - 1, size, size + 1, 257]
const expectedSum = (total) => total * (total + 1) / 2
const within = (stats, budget) => {
  for (const [metric, limit] of Object.entries(budget)) {
    assert.ok(stats[metric] <= limit, `${metric}: ${stats[metric]} exceeds ${limit}`)
  }
}

for (const total of totals) {
  test(`bounded page/cache example: ${total} rows retain at most one page`, async () => {
    const source = virtualSource(total)
    let nextId = 1
    const result = await boundedPages(source, size, (id) => assert.equal(id, nextId++))
    assert.equal(result.count, total)
    assert.equal(nextId, total + 1)
    assert.equal(result.sum, expectedSum(total))
    assert.equal(result.maxCache, Math.min(total, size))
    assert.equal(source.stats.maxResident, Math.min(total, size))
    assert.equal(source.stats.queries, Math.max(1, Math.ceil(total / size)))
    within(source.stats, {
      maxResident: size, maxInFlight: 0,
      queries: Math.max(1, Math.ceil(total / size)),
    })
    assert.equal(source.resident(), 0)
  })

  test(`streamed chunk example: ${total} rows bound memory and concurrent consumers`, async () => {
    const source = virtualSource(total)
    let nextId = 1
    const result = await boundedChunks(source, size, (id) => assert.equal(id, nextId++))
    assert.equal(result.count, total)
    assert.equal(nextId, total + 1)
    assert.equal(result.sum, expectedSum(total))
    assert.equal(source.stats.queries, 1)
    assert.equal(source.stats.maxResident, Math.min(total, size))
    assert.equal(source.stats.maxInFlight, Math.min(total, size))
    within(source.stats, { maxResident: size, maxInFlight: size, queries: 1 })
    assert.equal(source.stats.inFlight, 0)
    assert.equal(source.resident(), 0)
  })
}

test('full fetch followed by a correct page still exceeds the resident budget', async () => {
  const source = virtualSource(257)
  assert.deepEqual(await fullFetchThenPage(source, size), [257, 256, 255, 254, 253, 252, 251, 250])
  assert.equal(source.stats.queries, 1)
  assert.equal(source.stats.maxResident, 257)
  assert.throws(() => within(source.stats, { maxResident: size }), /maxResident/)
})

test('bounded chunk writes cannot repair fully materialized input', async () => {
  const source = virtualSource(257)
  assert.equal(await collectBeforeChunk(source, size), 257)
  assert.equal(source.stats.maxInFlight, size)
  assert.equal(source.stats.maxResident, 257)
  assert.throws(() => within(source.stats, { maxResident: size }), /maxResident/)
})

test('streaming input with unlimited scheduling exceeds both concurrency and memory limits', async () => {
  const source = virtualSource(257)
  assert.equal(await unboundedFanout(source), 257)
  assert.equal(source.stats.maxInFlight, 257)
  assert.equal(source.stats.maxResident, 257)
  assert.throws(() => within(source.stats, { maxInFlight: size }), /maxInFlight/)
})

test('a stream ultimately collected for output remains an unbounded result', async () => {
  const source = virtualSource(257)
  const ids = await streamToArray(source)
  assert.deepEqual(ids, Array.from({ length: 257 }, (_, index) => index + 1))
  assert.equal(source.stats.queries, 1)
  assert.equal(source.stats.maxResident, 257)
  assert.throws(() => within(source.stats, { maxResident: size }), /maxResident/)
})
