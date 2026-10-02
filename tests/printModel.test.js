import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import {
  DEPTH,
  EMPTY_BAR,
  MAX_BAR,
  MAX_TEXT_LENGTH,
  PLATE_TOP,
  SLOPE_DEPTH,
  TEXT_MAX_WIDTH,
  WIDTH,
  buildPrintModel,
  buildText,
  exportStl,
  parseFont,
  stlFileName,
  supportedText,
} from '../app/utils/printModel.js'

const file = readFileSync(
  new URL('../public/fonts/Inter-Bold.ttf', import.meta.url),
)
const font = parseFont(
  file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength),
)

// A full calendar. The counts go from 0 to 8.
const cells = []
for (let week = 0; week < 53; week++) {
  for (let dow = 0; dow < 7; dow++) {
    cells.push({ week, dow, count: (week * 7 + dow) % 9 })
  }
}

// Geometry positions are Float32, so allow 0.1 µm.
const close = (actual, expected) =>
  assert.ok(Math.abs(actual - expected) < 1e-4, `${actual} != ${expected}`)

function triangles(geometry) {
  return geometry.attributes.position.count / 3
}

test('the model has the expected size and sits on z = 0', () => {
  const { min, max } = buildPrintModel({
    cells,
    max: 8,
    text: '@ahmetkorkmaz3',
    font,
  }).boundingBox
  close(min.x, 0)
  close(min.y, 0)
  close(min.z, 0)
  close(max.x, WIDTH)
  close(max.y, DEPTH)
  close(max.z, PLATE_TOP + MAX_BAR)
  close(WIDTH, 179.6)
  close(DEPTH, 42.4)
})

test('a calendar without contributions gets the low bars', () => {
  const empty = cells.map((cell) => ({ ...cell, count: 0 }))
  const { max } = buildPrintModel({
    cells: empty,
    max: 0,
    text: '',
    font,
  }).boundingBox
  close(max.z, PLATE_TOP + EMPTY_BAR)
})

test('the STL file has 84 + 50 bytes for each triangle', () => {
  const geometry = buildPrintModel({ cells, max: 8, text: 'İşçi Ğüşıö', font })
  assert.equal(exportStl(geometry).size, 84 + 50 * triangles(geometry))
})

test('the text stays on the sloped face and inside the width limit', () => {
  const geometry = buildText('W'.repeat(MAX_TEXT_LENGTH), font)
  geometry.computeBoundingBox()
  const { min, max } = geometry.boundingBox
  assert.ok(max.x - min.x <= TEXT_MAX_WIDTH + 1e-4)
  assert.ok(min.y > 0 && max.y < SLOPE_DEPTH)
  assert.ok(min.z > 0 && max.z < PLATE_TOP)
})

test('buildText trims spaces, so the text stays centered', () => {
  const plain = buildText('ab', font)
  const spaced = buildText('  ab  ', font)
  plain.computeBoundingBox()
  spaced.computeBoundingBox()
  assert.deepEqual(spaced.boundingBox, plain.boundingBox)
  assert.equal(buildText('   ', font), null)
})

test('unsupported characters only give a model without text', () => {
  const withEmoji = buildPrintModel({ cells, max: 8, text: '🚀🚀', font })
  const withoutText = buildPrintModel({ cells, max: 8, text: '', font })
  assert.equal(triangles(withEmoji), triangles(withoutText))
})

test('supportedText removes unsupported characters and keeps 24 characters', () => {
  assert.equal(supportedText('hi 🚀', font), 'hi ')
  assert.equal(supportedText('İşçi', font), 'İşçi')
  assert.equal(supportedText('a'.repeat(30), font).length, MAX_TEXT_LENGTH)
})

test('stlFileName makes a safe file name', () => {
  assert.equal(stlFileName('@ahmet korkmaz'), 'contra-ahmet-korkmaz.stl')
  assert.equal(stlFileName('a/b:c'), 'contra-a-b-c.stl')
  assert.equal(stlFileName('İşçi'), 'contra-İşçi.stl')
  assert.equal(stlFileName(''), 'contra-heatmap.stl')
  assert.equal(stlFileName('🚀'), 'contra-heatmap.stl')
})

test('decomposed (NFD) text becomes composed letters', () => {
  const nfd = 'Çağrı'.normalize('NFD')
  assert.notEqual(nfd, 'Çağrı')
  assert.equal(supportedText(nfd, font), 'Çağrı')
  assert.equal(stlFileName(nfd), 'contra-Çağrı.stl')
})
