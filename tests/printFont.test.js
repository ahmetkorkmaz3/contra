import assert from 'node:assert/strict'
import test from 'node:test'
import { PRINT_FONT_URL, loadPrintFont } from '../app/lib/printFont.js'

function stubFetch(responses) {
  const calls = []
  globalThis.fetch = async (url) => {
    calls.push(url)
    const next = responses.shift()
    if (next instanceof Error) throw next
    return next
  }
  return calls
}

const ok = (bytes) => ({ ok: true, arrayBuffer: async () => bytes })

test('loadPrintFont fetches the font once and shares the result', async () => {
  const buffer = new ArrayBuffer(4)
  const calls = stubFetch([ok(buffer)])
  const [a, b] = await Promise.all([loadPrintFont(), loadPrintFont()])
  assert.equal(a, buffer)
  assert.equal(b, buffer)
  assert.deepEqual(calls, [PRINT_FONT_URL])
})

test('loadPrintFont tries again after a failure', async () => {
  // A fresh copy of the module, without the font from the first test.
  const { loadPrintFont } = await import('../app/lib/printFont.js?fresh')
  const buffer = new ArrayBuffer(8)
  const calls = stubFetch([
    new Error('offline'),
    { ok: false, status: 404 },
    ok(buffer),
  ])
  await assert.rejects(loadPrintFont(), /offline/)
  await assert.rejects(loadPrintFont(), /404/)
  assert.equal(await loadPrintFont(), buffer)
  assert.equal(calls.length, 3)
})
