import {
  BoxGeometry,
  ExtrudeGeometry,
  Matrix4,
  Mesh,
  Shape,
  ShapePath,
} from 'three'
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
// The package has no exports field. This path works in Node and in Vite.
import { parse } from 'opentype.js/dist/opentype.mjs'
import { WEEKS } from './contributionStats.js'

// All sizes are in mm. x is the width (weeks), y is the depth (0 is the front), z is up.
export const PITCH = 3.2
export const BAR = 2.6
export const MARGIN = 5
export const PLATE_TOP = 8
export const MAX_BAR = 20
export const MIN_BAR = 1.2
export const EMPTY_BAR = 0.4
export const SLOPE_DEPTH = 10
export const SLOPE_BOTTOM = 2
export const TEXT_RELIEF = 1
export const TEXT_MAX_HEIGHT = 7
export const TEXT_MAX_WIDTH = 170
export const MAX_TEXT_LENGTH = 24
// Each solid goes this far into the solid under it, so the slicer joins them.
export const OVERLAP = 0.2

export const WIDTH = WEEKS * PITCH + 2 * MARGIN
export const DEPTH = SLOPE_DEPTH + 7 * PITCH + 2 * MARGIN
const SLOPE_ANGLE = Math.atan2(PLATE_TOP - SLOPE_BOTTOM, SLOPE_DEPTH)
// The text is made at this size first, then scaled to fit.
const GLYPH_SIZE = 10

export function parseFont(buffer) {
  return parse(buffer)
}

// Glyph 0 is the "missing glyph" box, so characters that map to it are not in the font.
// Some paste sources give decomposed (NFD) letters, and the glyphs have no mark positioning.
export function supportedText(text, font) {
  return [...text.normalize('NFC')]
    .slice(0, MAX_TEXT_LENGTH)
    .filter((ch) => font.charToGlyphIndex(ch) !== 0)
    .join('')
}

export function stlFileName(text) {
  const name = text
    .normalize('NFC')
    .replace(/[^\p{L}\p{N}_-]+/gu, '-')
    .replace(/^-+|-+$/g, '')
  return `contra-${name || 'heatmap'}.stl`
}

export function barHeight(count, max) {
  if (!count) return EMPTY_BAR
  return Math.max(MIN_BAR, (count / max) * MAX_BAR)
}

// The glyphs one by one, with kerning. The text shaping of opentype.js
// (font.getPath) throws on the GSUB table of Inter.
function textShapes(text, font) {
  const scale = GLYPH_SIZE / font.unitsPerEm
  const path = new ShapePath()
  let x = 0
  let previous = null
  for (const ch of text) {
    const glyph = font.charToGlyph(ch)
    if (previous) x += font.getKerningValue(previous, glyph) * scale
    // opentype.js gives y down. three.js uses y up.
    for (const c of glyph.getPath(x, 0, GLYPH_SIZE).commands) {
      if (c.type === 'M') path.moveTo(c.x, -c.y)
      else if (c.type === 'L') path.lineTo(c.x, -c.y)
      else if (c.type === 'Q') path.quadraticCurveTo(c.x1, -c.y1, c.x, -c.y)
      else if (c.type === 'C')
        path.bezierCurveTo(c.x1, -c.y1, c.x2, -c.y2, c.x, -c.y)
    }
    x += glyph.advanceWidth * scale
    previous = glyph
  }
  return path.toShapes(false)
}

// The side section of the plate and the sloped face, made long along x.
function base() {
  const shape = new Shape()
  shape.moveTo(0, 0)
  shape.lineTo(DEPTH, 0)
  shape.lineTo(DEPTH, PLATE_TOP)
  shape.lineTo(SLOPE_DEPTH, PLATE_TOP)
  shape.lineTo(0, SLOPE_BOTTOM)
  shape.closePath()
  const geometry = new ExtrudeGeometry(shape, {
    depth: WIDTH,
    bevelEnabled: false,
  })
  // The shape is in (y, z) and the extrusion goes along x.
  geometry.applyMatrix4(
    new Matrix4().set(0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1),
  )
  return geometry
}

// Sunday is at the back, as in the top row of the 2D calendar.
function bar(cell, max) {
  const height = barHeight(cell.count, max) + OVERLAP
  const geometry = new BoxGeometry(BAR, BAR, height).toNonIndexed()
  geometry.translate(
    MARGIN + (cell.week + 0.5) * PITCH,
    SLOPE_DEPTH + MARGIN + (6 - cell.dow + 0.5) * PITCH,
    PLATE_TOP - OVERLAP + height / 2,
  )
  return geometry
}

export function buildText(text, font) {
  const trimmed = text.trim()
  if (!trimmed) return null
  const geometry = new ExtrudeGeometry(textShapes(trimmed, font), {
    depth: TEXT_RELIEF + OVERLAP,
    curveSegments: 6,
    bevelEnabled: false,
  })
  geometry.computeBoundingBox()
  const { min, max } = geometry.boundingBox
  // The line box (ascender to descender) sets the size, so all texts get the same letter size.
  const ascender = (font.ascender / font.unitsPerEm) * GLYPH_SIZE
  const descender = (font.descender / font.unitsPerEm) * GLYPH_SIZE
  const scale = Math.min(
    TEXT_MAX_HEIGHT / (ascender - descender),
    TEXT_MAX_WIDTH / (max.x - min.x),
  )
  geometry.translate(
    -(min.x + max.x) / 2,
    -(ascender + descender) / 2,
    -OVERLAP,
  )
  geometry.scale(scale, scale, 1)
  // Turn the text up onto the sloped face, then move it to the middle of the face.
  geometry.rotateX(SLOPE_ANGLE)
  geometry.translate(WIDTH / 2, SLOPE_DEPTH / 2, (PLATE_TOP + SLOPE_BOTTOM) / 2)
  return geometry
}

export function buildPrintModel({ cells, max, text, font }) {
  const parts = [base(), ...cells.map((cell) => bar(cell, max))]
  const label = buildText(supportedText(text, font), font)
  if (label) parts.push(label)
  // mergeGeometries needs the same attributes on all parts. STL needs no uv.
  for (const part of parts) {
    part.deleteAttribute('uv')
    part.clearGroups()
  }
  const geometry = mergeGeometries(parts)
  for (const part of parts) part.dispose()
  geometry.computeBoundingBox()
  return geometry
}

export function exportStl(geometry) {
  const view = new STLExporter().parse(new Mesh(geometry), { binary: true })
  return new Blob([view.buffer], { type: 'model/stl' })
}
