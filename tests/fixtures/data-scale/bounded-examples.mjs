import { setImmediate } from 'node:timers/promises'

// Instruction examples only. Live records are explicitly accounted, not heap bytes.
export function virtualSource(total) {
  let resident = 0
  const stats = { queries: 0, maxResident: 0, inFlight: 0, maxInFlight: 0 }
  const row = (id) => {
    resident++
    stats.maxResident = Math.max(stats.maxResident, resident)
    return { id }
  }
  const release = (rows) => { resident -= rows.length }
  const fetchPage = async (after, limit) => {
    stats.queries++
    const end = Math.min(total, after + limit)
    return {
      rows: Array.from({ length: end - after }, (_, index) => row(after + index + 1)),
      hasNext: end < total,
    }
  }
  const stream = async function* () {
    stats.queries++
    for (let id = 1; id <= total; id++) yield row(id)
  }
  const consume = async (record) => {
    stats.inFlight++
    stats.maxInFlight = Math.max(stats.maxInFlight, stats.inFlight)
    try {
      await setImmediate()
      return record.id
    } finally {
      stats.inFlight--
      release([record])
    }
  }
  return {
    total, stats, fetchPage, stream, consume, release,
    resident: () => resident,
  }
}

export async function boundedPages(source, pageSize, onId = () => {}) {
  let cursor = 0
  let count = 0
  let sum = 0
  let maxCache = 0
  for (;;) {
    const page = await source.fetchPage(cursor, pageSize)
    const cache = new Map(page.rows.map((record) => [record.id, record]))
    maxCache = Math.max(maxCache, cache.size)
    for (const record of page.rows) {
      count++
      sum += cache.get(record.id).id
      onId(record.id)
      cursor = record.id
    }
    source.release(page.rows)
    cache.clear()
    if (!page.hasNext) break
  }
  return { count, sum, maxCache }
}

export async function boundedChunks(source, chunkSize, onId = () => {}) {
  let chunk = []
  let count = 0
  let sum = 0
  const flush = async () => {
    const ids = await Promise.all(chunk.map((record) => source.consume(record)))
    count += ids.length
    sum += ids.reduce((value, id) => value + id, 0)
    for (const id of ids) onId(id)
    chunk = []
  }
  for await (const record of source.stream()) {
    chunk.push(record)
    if (chunk.length === chunkSize) await flush()
  }
  if (chunk.length) await flush()
  return { count, sum }
}

// Deliberately incorrect resource patterns: tests must detect their budget breaches.
export async function fullFetchThenPage(source, pageSize) {
  const { rows } = await source.fetchPage(0, source.total)
  const ids = rows.sort((left, right) => right.id - left.id)
    .slice(0, pageSize).map((record) => record.id)
  source.release(rows)
  return ids
}

export async function collectBeforeChunk(source, chunkSize) {
  const all = []
  for await (const record of source.stream()) all.push(record)
  let count = 0
  for (let offset = 0; offset < all.length; offset += chunkSize) {
    const ids = await Promise.all(all.slice(offset, offset + chunkSize)
      .map((record) => source.consume(record)))
    count += ids.length
  }
  return count
}

export async function unboundedFanout(source) {
  const tasks = []
  for await (const record of source.stream()) tasks.push(source.consume(record))
  return (await Promise.all(tasks)).length
}

export async function streamToArray(source) {
  const all = []
  for await (const record of source.stream()) all.push(record)
  const ids = all.map((record) => record.id)
  source.release(all)
  return ids
}
