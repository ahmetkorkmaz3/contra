# STL Print Export Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The user downloads the 3D heatmap as a printable binary STL file, with a custom text raised on a sloped front face, and sees a three.js preview of that exact mesh first.

**Architecture:** A pure module (`app/utils/printModel.js`) turns the calendar cells, a text, and an opentype.js font into one merged three.js `BufferGeometry`, and turns that geometry into an STL `Blob`. A lazy dialog (`PrintDialog.vue`) shows the geometry with three.js and `OrbitControls`, and downloads the STL. A new `calendarCells()` helper gives the 53-week window to the 3D view and to the print model, so both show the same days.

**Tech Stack:** Nuxt 4 (Vue 3, Options API, `ssr: false`), three.js 0.186, opentype.js 2.0, Tailwind 4, Node test runner (`node --test`).

**Spec:** `docs/superpowers/specs/2026-10-02-stl-print-export-design.md`

## Global Constraints

- Use Yarn. Node `^22.19.0`, `^24.11.0`, or `>=26.0.0`.
- Prettier settings: `semi: false`, `singleQuote: true`. Run `yarn prettier --write <files>` on each file that a task creates or changes. Do not format other files.
- Components use the Options API, like the other components in `app/components/`.
- New dependencies: only `three` and `opentype.js`. No other runtime dependency. No test dependency.
- Sizes in mm: total about 180 x 43 x 28, bar pitch 3.2, bar footprint 2.6, highest bar 20, lowest bar with contributions 1.2, bar without contributions 0.4, plate top 8, margin 5, slope from 8 down to 2 over a depth of 10, text relief 1, text line box 7, text width 170 at most, overlap 0.2.
- The text is 24 characters (code points) at most.
- The model sits on z = 0. x is the width (weeks), y is the depth (y = 0 is the front), z is up.
- Do not use `TTFLoader` from three.js. In three 0.186, it imports opentype.js from a CDN URL.
- Import opentype.js as `import { parse } from 'opentype.js/dist/opentype.mjs'`. The package has no `exports` field, so this path works in Node and in Vite.
- Do not use `font.getPath(text)` or `font.stringToGlyphs()` from opentype.js. They throw on the GSUB table of Inter (`substitutionType : 62 lookupType: 6`). Use `charToGlyph`, `getKerningValue`, and `glyph.getPath`.
- UI text is English, like the rest of the app.
- Commit messages end with these two lines:
  ```
  Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01QhbXkRZfCCBxg14ssHkoJC
  ```

## Review Focus

1. The user types and clicks "Download STL" in less than 250 ms. The file must have the new text, not the old text. (`download()` runs a pending rebuild first. Task 3, manual check step.)
2. The user closes the dialog while the font loads. The late font response must not touch a disposed renderer or throw. (`closed` guard in `load()`. Task 3, manual check step.)
3. The text has only unsupported characters (for example `🚀🚀`). The model must have no text part and must not throw, and the note must show. (Task 2 test "unsupported characters only".)
4. The text has spaces at the start or the end. The text must stay centered on the face. (Task 2 test "trims spaces".)
5. The text has characters that are not safe in a file name (`/`, `:`, spaces). The download name must be safe and must keep Turkish letters. (Task 2 tests for `stlFileName`.)

---

## File Structure

| File | Status | Job |
|---|---|---|
| `app/utils/contributionStats.js` | Modify | Add `WEEKS`, `weekday()`, and `calendarCells()`. |
| `app/components/Contributions3d.vue` | Modify | Use `calendarCells()` and `WEEKS` from `contributionStats.js`. |
| `app/utils/printModel.js` | Create | Geometry constants, `parseFont`, `supportedText`, `stlFileName`, `barHeight`, `buildText`, `buildPrintModel`, `exportStl`. |
| `public/fonts/Inter-Bold.ttf` | Create | The text font (Inter 4.1, OFL). |
| `app/components/PrintDialog.vue` | Create | The dialog with the preview, the text field, and the download button. |
| `app/components/User.vue` | Modify | The "3D Print" button and `<LazyPrintDialog>`. |
| `tests/contributionStats.test.js` | Create | Tests for `calendarCells()`. |
| `tests/printModel.test.js` | Create | Tests for the print model. |
| `package.json` | Modify | `test` script, `three`, `opentype.js`. |
| `CLAUDE.md` | Modify | Document the print feature and `yarn test`. |

---

### Task 1: `calendarCells()` and the test script

**Files:**
- Modify: `app/utils/contributionStats.js` (add after `countsByDay`, about line 31)
- Modify: `app/components/Contributions3d.vue:63-172` (imports, `WEEKS`, `weekday`, `cells` computed)
- Modify: `package.json` (`scripts`)
- Test: `tests/contributionStats.test.js`

**Interfaces:**
- Consumes: `countsByDay(contributions)` and `dayIndex(date)` from `app/utils/contributionStats.js`.
- Produces:
  - `export const WEEKS = 53`
  - `export function weekday(day: number): number` (0 is Sunday)
  - `export function calendarCells(contributions: {date, count}[], now: number | Date): { cells: { day: number, week: number, dow: number, count: number }[], max: number }`. `cells` is in day order, from the Sunday 52 weeks before the current week to today. `max` is the highest count in the window (0 when no day has contributions).

- [ ] **Step 1: Add the test script**

In `package.json`, add this line in `scripts`, after `"lintfix"`:

```json
    "test": "node --test 'tests/*.test.js'"
```

- [ ] **Step 2: Write the failing test**

Create `tests/contributionStats.test.js`:

```js
import assert from 'node:assert/strict'
import test from 'node:test'
import {
  WEEKS,
  calendarCells,
  dayIndex,
} from '../app/utils/contributionStats.js'

// 2026-10-02 is a Friday. The window starts on Sunday 2025-09-28.
const NOW = Date.UTC(2026, 9, 2, 15)

test('calendarCells gives 53 weeks that end today', () => {
  const { cells } = calendarCells([], NOW)
  assert.equal(cells.length, 52 * 7 + 6)
  assert.equal(cells[0].day, dayIndex('2025-09-28'))
  assert.equal(cells[0].week, 0)
  assert.equal(cells[0].dow, 0)
  const last = cells.at(-1)
  assert.equal(last.day, dayIndex('2026-10-02'))
  assert.equal(last.week, WEEKS - 1)
  assert.equal(last.dow, 5)
})

test('calendarCells sums each day and ignores days outside the window', () => {
  const { cells, max } = calendarCells(
    [
      { date: '2026-10-02', count: 3 },
      { date: '2026-10-02', count: 2 },
      { date: '2026-09-27', count: 1 },
      { date: '2025-01-01', count: 99 },
    ],
    NOW,
  )
  assert.equal(max, 5)
  assert.equal(cells.at(-1).count, 5)
  const sunday = cells.find((cell) => cell.day === dayIndex('2026-09-27'))
  assert.deepEqual(
    { week: sunday.week, dow: sunday.dow, count: sunday.count },
    { week: 52, dow: 0, count: 1 },
  )
})

test('calendarCells gives max 0 when there are no contributions', () => {
  assert.equal(calendarCells([], NOW).max, 0)
})
```

- [ ] **Step 3: Run the test and make sure it fails**

Run: `yarn test`
Expected: FAIL. The error says that `WEEKS` or `calendarCells` is not exported (`SyntaxError: The requested module ... does not provide an export named 'WEEKS'`).

- [ ] **Step 4: Add the functions**

In `app/utils/contributionStats.js`, add this code after the `countsByDay` function:

```js
export const WEEKS = 53

// Day 0 of the epoch is a Thursday. The result is 0 for Sunday.
export function weekday(day) {
  return (day + 4) % 7
}

// The days of the calendar, from the Sunday 52 weeks before this week to today.
// max is the highest count in this window.
export function calendarCells(contributions, now) {
  const counts = countsByDay(contributions)
  const today = dayIndex(now)
  const start = today - weekday(today) - (WEEKS - 1) * 7
  const cells = []
  let max = 0
  for (let day = start; day <= today; day++) {
    const count = counts.get(day) || 0
    max = Math.max(max, count)
    cells.push({
      day,
      week: Math.floor((day - start) / 7),
      dow: weekday(day),
      count,
    })
  }
  return { cells, max }
}
```

- [ ] **Step 5: Run the test and make sure it passes**

Run: `yarn test`
Expected: PASS, `# pass 3`, `# fail 0`.

- [ ] **Step 6: Use `calendarCells()` in `Contributions3d.vue`**

Replace the import block (lines 63-68) with:

```js
import {
  WEEKS,
  calendarCells,
  formatDay,
  formatNumber,
} from '~/utils/contributionStats'
```

Delete the line `const WEEKS = 53` (line 70). Delete the `weekday` function and its comment (lines 89-92).

Replace the whole `cells()` computed (from `// The bars in world space.` to the end of `cells()`) with:

```js
    // The bars in world space. They do not change when the camera turns.
    cells() {
      const { cells, max } = calendarCells(this.data, Date.now())
      return {
        cells: cells.map(({ day, week, dow, count }) => {
          const level = count ? Math.max(1, Math.ceil((count / max) * 4)) : 0
          const unit = count === 1 ? 'contribution' : 'contributions'
          return {
            week,
            dow,
            height: count
              ? Math.max(0.3, (count / max) * MAX_HEIGHT)
              : EMPTY_HEIGHT,
            color: COLORS[level],
            label: `${formatNumber(count)} ${unit} on ${formatDay(day)}`,
          }
        }),
        maxHeight: max ? MAX_HEIGHT : EMPTY_HEIGHT,
      }
    },
```

- [ ] **Step 7: Check that the 3D view did not change**

Run: `yarn dev`. Open the dev URL with `?githubUsername=ahmetkorkmaz3&gitlabUsername=ahmetkorkmaz3`. Click "3D".
Expected: the bars show and look the same as on `main`. Hover a bar: the tooltip shows the count and the date. The browser console shows no errors. Stop the dev server.

- [ ] **Step 8: Format and commit**

```bash
yarn prettier --write app/utils/contributionStats.js app/components/Contributions3d.vue tests/contributionStats.test.js package.json
git add app/utils/contributionStats.js app/components/Contributions3d.vue tests/contributionStats.test.js package.json
git commit -m "Move the calendar window into calendarCells and add yarn test

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01QhbXkRZfCCBxg14ssHkoJC"
```

---

### Task 2: The print model (`printModel.js`)

**Files:**
- Create: `app/utils/printModel.js`
- Create: `public/fonts/Inter-Bold.ttf`
- Modify: `package.json` (`dependencies`)
- Test: `tests/printModel.test.js`

**Interfaces:**
- Consumes: `WEEKS` from `app/utils/contributionStats.js`. The `cells` and `max` shape from `calendarCells()` (Task 1).
- Produces (all named exports of `app/utils/printModel.js`):
  - Constants: `PITCH`, `BAR`, `MARGIN`, `PLATE_TOP`, `MAX_BAR`, `MIN_BAR`, `EMPTY_BAR`, `SLOPE_DEPTH`, `SLOPE_BOTTOM`, `TEXT_RELIEF`, `TEXT_MAX_HEIGHT`, `TEXT_MAX_WIDTH`, `MAX_TEXT_LENGTH`, `OVERLAP`, `WIDTH` (179.6), `DEPTH` (42.4).
  - `parseFont(buffer: ArrayBuffer): opentype.Font`
  - `supportedText(text: string, font): string`. It keeps the first 24 code points and removes characters that the font does not have. It does not trim.
  - `stlFileName(text: string): string`. For example `contra-ahmetkorkmaz3.stl`, or `contra-heatmap.stl` when no safe character is left.
  - `barHeight(count: number, max: number): number`
  - `buildText(text: string, font): BufferGeometry | null`. The text part, already on the sloped face. `null` when the trimmed text is empty.
  - `buildPrintModel({ cells, max, text, font }): BufferGeometry`. One non-indexed geometry with `position` and `normal`, and a computed `boundingBox`.
  - `exportStl(geometry: BufferGeometry): Blob`. Binary STL, type `model/stl`.

- [ ] **Step 1: Add the dependencies and the font**

```bash
yarn add three@^0.186.1 opentype.js@^2.0.0
mkdir -p public/fonts
curl -sL -o /tmp/inter.zip https://github.com/rsms/inter/releases/download/v4.1/Inter-4.1.zip
unzip -o -j /tmp/inter.zip extras/ttf/Inter-Bold.ttf -d public/fonts
ls -l public/fonts/Inter-Bold.ttf
```

Expected: `public/fonts/Inter-Bold.ttf` is 420428 bytes.

- [ ] **Step 2: Write the failing test**

Create `tests/printModel.test.js`:

```js
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

const file = readFileSync(new URL('../public/fonts/Inter-Bold.ttf', import.meta.url))
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

const close = (actual, expected) =>
  assert.ok(Math.abs(actual - expected) < 1e-6, `${actual} != ${expected}`)

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
  const { max } = buildPrintModel({ cells: empty, max: 0, text: '', font })
    .boundingBox
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
  assert.ok(max.x - min.x <= TEXT_MAX_WIDTH + 1e-6)
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
```

- [ ] **Step 3: Run the test and make sure it fails**

Run: `yarn test`
Expected: FAIL with `Cannot find module '.../app/utils/printModel.js'`. The 3 tests from Task 1 still pass.

- [ ] **Step 4: Write the module**

Create `app/utils/printModel.js`:

```js
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
export function supportedText(text, font) {
  return [...text]
    .slice(0, MAX_TEXT_LENGTH)
    .filter((ch) => font.charToGlyphIndex(ch) !== 0)
    .join('')
}

export function stlFileName(text) {
  const name = text
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
  geometry.translate(
    WIDTH / 2,
    SLOPE_DEPTH / 2,
    (PLATE_TOP + SLOPE_BOTTOM) / 2,
  )
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
```

- [ ] **Step 5: Run the test and make sure it passes**

Run: `yarn test`
Expected: PASS, `# pass 11`, `# fail 0`.

- [ ] **Step 6: Format and commit**

```bash
yarn prettier --write app/utils/printModel.js tests/printModel.test.js package.json
git add app/utils/printModel.js tests/printModel.test.js public/fonts/Inter-Bold.ttf package.json yarn.lock
git commit -m "Add the print model that turns the calendar into an STL file

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01QhbXkRZfCCBxg14ssHkoJC"
```

---

### Task 3: The print dialog and the "3D Print" button

**Files:**
- Create: `app/components/PrintDialog.vue`
- Modify: `app/components/User.vue` (template: buttons at lines 41-77 and dialogs at lines 144-150, script: import at lines 155-159, `data()`, `computed`)

**Interfaces:**
- Consumes: from `app/utils/printModel.js` (Task 2): `parseFont`, `supportedText`, `stlFileName`, `buildPrintModel`, `exportStl`, `MAX_TEXT_LENGTH`, `WIDTH`, `DEPTH`, `PLATE_TOP`. From `app/utils/contributionStats.js` (Task 1): `calendarCells`.
- Produces: the `PrintDialog` component. Props: `cells` (Array, required), `max` (Number, required), `defaultText` (String, required). Emits: `close`.

- [ ] **Step 1: Create the dialog**

Create `app/components/PrintDialog.vue`:

```vue
<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      @click.self="$emit('close')"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="print-dialog-title"
        class="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl border border-gray-800 bg-gray-900 p-5 shadow-2xl sm:rounded-2xl sm:p-6"
      >
        <div class="mb-4 flex items-center justify-between">
          <h2 id="print-dialog-title" class="text-lg font-semibold text-white">
            Print your graph
          </h2>
          <button
            ref="closeButton"
            type="button"
            class="rounded-lg p-1.5 text-gray-400 hover:bg-gray-800 hover:text-white"
            aria-label="Close"
            @click="$emit('close')"
          >
            <svg
              class="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"
              />
            </svg>
          </button>
        </div>

        <div
          class="relative aspect-[2/1] touch-none overflow-hidden rounded-xl border border-gray-800 bg-gray-950"
        >
          <!-- three.js puts its canvas here. Vue does not manage the children of this element. -->
          <div ref="canvasHost" class="absolute inset-0"></div>
          <div
            v-if="loadError"
            class="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center text-sm text-red-300"
          >
            {{ loadError }}
            <button
              type="button"
              class="rounded-lg border border-gray-700 px-3 py-1.5 text-gray-200 hover:border-gray-500 hover:text-white"
              @click="load"
            >
              Retry
            </button>
          </div>
          <div
            v-else-if="previewError"
            class="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-gray-400"
          >
            {{ previewError }}
          </div>
          <div
            v-else-if="!ready"
            class="absolute inset-0 animate-pulse bg-gray-800/60"
          ></div>
        </div>
        <p v-if="!previewError" class="mt-2 text-xs text-[#8b949e]">
          Drag to turn. Scroll or pinch to zoom.
        </p>

        <label
          for="print-text"
          class="mt-5 block text-sm font-medium text-gray-300"
        >
          Text on the front
        </label>
        <input
          id="print-text"
          v-model="text"
          type="text"
          :maxlength="maxLength"
          autocomplete="off"
          spellcheck="false"
          placeholder="Your nickname"
          class="mt-1.5 w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
        />
        <div class="mt-1 flex justify-between gap-3 text-xs">
          <span class="text-amber-300">
            {{ unsupported ? 'Some characters are not supported' : '' }}
          </span>
          <span class="tabular-nums text-gray-500">
            {{ length }}/{{ maxLength }}
          </span>
        </div>

        <button
          type="button"
          class="print-button mt-5 w-full bg-indigo-600 text-white hover:bg-indigo-500"
          :disabled="!ready"
          @click="download"
        >
          Download STL
        </button>
        <p class="mt-3 text-center text-xs text-gray-500">
          About 180 x 43 x 28 mm. It prints flat, without supports.
        </p>
      </div>
    </div>
  </Teleport>
</template>

<script>
import {
  AmbientLight,
  Color,
  DirectionalLight,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import {
  DEPTH,
  MAX_TEXT_LENGTH,
  PLATE_TOP,
  WIDTH,
  buildPrintModel,
  exportStl,
  parseFont,
  stlFileName,
  supportedText,
} from '~/utils/printModel'

const FONT_URL = '/fonts/Inter-Bold.ttf'
const REBUILD_DELAY = 250
// The color of the highest level in the 2D and 3D views.
const MODEL_COLOR = '#39d353'
const BACKGROUND = '#030712'

export default {
  name: 'PrintDialog',
  emits: ['close'],
  props: {
    // The cells and max from calendarCells().
    cells: {
      type: Array,
      required: true,
    },
    max: {
      type: Number,
      required: true,
    },
    defaultText: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      text: [...this.defaultText].slice(0, MAX_TEXT_LENGTH).join(''),
      maxLength: MAX_TEXT_LENGTH,
      ready: false,
      unsupported: false,
      loadError: '',
      previewError: '',
    }
  },
  computed: {
    length() {
      return [...this.text].length
    },
  },
  watch: {
    text() {
      clearTimeout(this.rebuildTimer)
      this.rebuildTimer = setTimeout(this.rebuild, REBUILD_DELAY)
    },
  },
  mounted() {
    this.$refs.closeButton.focus()
    document.addEventListener('keydown', this.onKeydown)
    document.body.style.overflow = 'hidden'
    this.startPreview()
    this.load()
  },
  beforeUnmount() {
    // A font response that comes after this point must not touch the scene.
    this.closed = true
    document.removeEventListener('keydown', this.onKeydown)
    document.body.style.overflow = ''
    clearTimeout(this.rebuildTimer)
    this.resizeObserver?.disconnect()
    this.renderer?.setAnimationLoop(null)
    this.controls?.dispose()
    this.geometry?.dispose()
    this.material?.dispose()
    this.renderer?.dispose()
  },
  methods: {
    onKeydown(event) {
      if (event.key === 'Escape') this.$emit('close')
    },
    async load() {
      this.loadError = ''
      try {
        const buffer = await $fetch(FONT_URL, { responseType: 'arrayBuffer' })
        if (this.closed) return
        this.font = parseFont(buffer)
        this.rebuild()
        this.ready = true
      } catch (err) {
        if (this.closed) return
        this.loadError = 'Could not load the font. Check your connection.'
        console.error(err)
      }
    },
    // The preview is optional. Without WebGL, the download still works.
    startPreview() {
      try {
        this.renderer = new WebGLRenderer({ antialias: true })
      } catch (err) {
        this.previewError =
          'Your browser cannot show the 3D preview. You can still download the STL file.'
        console.error(err)
        return
      }
      const host = this.$refs.canvasHost
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      host.appendChild(this.renderer.domElement)

      this.scene = new Scene()
      this.scene.background = new Color(BACKGROUND)
      this.scene.add(new AmbientLight('#ffffff', 0.6))
      const light = new DirectionalLight('#ffffff', 2.2)
      light.position.set(-60, -120, 160)
      this.scene.add(light)

      // The model has z up, so the camera has z up too. It looks from the front and above.
      this.camera = new PerspectiveCamera(35, 2, 1, 2000)
      this.camera.up.set(0, 0, 1)
      this.camera.position.set(WIDTH / 2 - 30, DEPTH / 2 - 150, PLATE_TOP + 100)
      this.controls = new OrbitControls(this.camera, this.renderer.domElement)
      this.controls.target.set(WIDTH / 2, DEPTH / 2, PLATE_TOP)
      this.controls.enableDamping = true
      this.controls.minDistance = 60
      this.controls.maxDistance = 500

      this.material = new MeshStandardMaterial({
        color: MODEL_COLOR,
        roughness: 0.6,
      })
      this.mesh = new Mesh(undefined, this.material)
      this.scene.add(this.mesh)

      this.resizeObserver = new ResizeObserver(this.resize)
      this.resizeObserver.observe(host)
      this.resize()
      this.renderer.setAnimationLoop(() => {
        this.controls.update()
        this.renderer.render(this.scene, this.camera)
      })
    },
    resize() {
      const { clientWidth, clientHeight } = this.$refs.canvasHost
      if (!clientWidth || !clientHeight) return
      this.renderer.setSize(clientWidth, clientHeight)
      this.camera.aspect = clientWidth / clientHeight
      this.camera.updateProjectionMatrix()
    },
    rebuild() {
      this.rebuildTimer = null
      if (!this.font) return
      const geometry = buildPrintModel({
        cells: this.cells,
        max: this.max,
        text: this.text,
        font: this.font,
      })
      this.geometry?.dispose()
      this.geometry = geometry
      if (this.mesh) this.mesh.geometry = geometry
      const kept = [...this.text].slice(0, MAX_TEXT_LENGTH).join('')
      this.unsupported = supportedText(this.text, this.font) !== kept
    },
    download() {
      // The user can click before the debounce ends. Use the text that is in the field now.
      if (this.rebuildTimer) {
        clearTimeout(this.rebuildTimer)
        this.rebuild()
      }
      const url = URL.createObjectURL(exportStl(this.geometry))
      const link = document.createElement('a')
      link.href = url
      link.download = stlFileName(this.text)
      link.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    },
  },
}
</script>

<style scoped>
@reference '../assets/css/tailwind.css';

.print-button {
  @apply inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50;
}
</style>
```

- [ ] **Step 2: Add the button and the dialog to `User.vue`**

In the template, add this button before the "Share" button (inside `<div class="flex gap-2">`):

```vue
        <button
          type="button"
          class="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm font-medium text-gray-200 transition-colors hover:border-gray-500 hover:text-white sm:flex-none"
          @click="printOpen = true"
        >
          <svg
            class="h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fill-rule="evenodd"
              d="M5 2.75C5 1.784 5.784 1 6.75 1h6.5c.966 0 1.75.784 1.75 1.75v3.552c.377.046.752.097 1.126.153A2.212 2.212 0 0118 8.653v4.097A2.25 2.25 0 0115.75 15h-.241l.305 1.984A1.75 1.75 0 0114.084 19H5.915a1.75 1.75 0 01-1.73-2.016L4.492 15H4.25A2.25 2.25 0 012 12.75V8.653c0-1.082.775-2.034 1.874-2.198.374-.056.75-.107 1.126-.153V2.75zM13.5 6.12V2.75a.25.25 0 00-.25-.25h-6.5a.25.25 0 00-.25.25v3.37a41.4 41.4 0 017 0zm-7.538 6.83l-.54 3.512a.25.25 0 00.247.288h8.166a.25.25 0 00.247-.288l-.54-3.512a.25.25 0 00-.247-.212H6.21a.25.25 0 00-.248.212z"
              clip-rule="evenodd"
            />
          </svg>
          3D Print
        </button>
```

After the `<ShareDialog ... />` element, add:

```vue
    <!-- Lazy, so three.js and the font code load only when the dialog opens. -->
    <LazyPrintDialog
      v-if="printOpen"
      :cells="calendar.cells"
      :max="calendar.max"
      :defaultText="githubUsername || gitlabUsername"
      @close="printOpen = false"
    />
```

In the script, change the import to:

```js
import {
  calendarCells,
  formatDay,
  formatNumber,
  getContributionStats,
} from '~/utils/contributionStats'
```

In `data()`, add `printOpen: false,` after `shareOpen: false,`.

In `computed`, add after `summary()`:

```js
    calendar() {
      return calendarCells(this.contributions, Date.now())
    },
```

- [ ] **Step 3: Check that the build works and that three.js is in a separate chunk**

Run: `yarn build`
Expected: the build ends without errors.

Run:

```bash
grep -l "WebGLRenderer" .output/public/_nuxt/*.js | wc -l
ENTRY=$(grep -o '/_nuxt/[A-Za-z0-9_.-]*\.js' .output/public/index.html | head -1)
grep -c "WebGLRenderer" ".output/public$ENTRY"
```

Expected: the first number is 1 or more. The second number is 0. Thus three.js is not in the entry chunk that `index.html` loads.

- [ ] **Step 4: Check the dialog in the browser**

Run: `yarn dev`. Open the dev URL with `?githubUsername=ahmetkorkmaz3&gitlabUsername=ahmetkorkmaz3`. Do these checks:

1. Click "3D Print". The dialog opens. A green model shows: bars on a plate, and `ahmetkorkmaz3` raised on the sloped front face. Drag turns the model. Scroll zooms.
2. Type `İşçi Ğüşıö`. After about 250 ms, the text on the model changes. The counter shows `10/24`.
3. Type `hi 🚀`. The note "Some characters are not supported" shows. The model shows `hi`.
4. Type `abc` and click "Download STL" at once (Review Focus 1). The file `contra-abc.stl` downloads. Open it in PrusaSlicer, Bambu Studio, or https://www.viewstl.com. The text on the model is `abc`. The slicer shows no errors and asks for no supports.
5. Close the dialog with Esc. Open it and close it at once, before the model shows (Review Focus 2). Set the network to "Slow 4G" in the browser developer tools if the font loads too fast. The console shows no errors.
6. Open the developer tools, set the network to "Offline", and open the dialog again. The font error and "Retry" show. Set the network to "No throttling" and click "Retry". The model shows.

Stop the dev server.

- [ ] **Step 5: Format and commit**

```bash
yarn prettier --write app/components/PrintDialog.vue app/components/User.vue
git add app/components/PrintDialog.vue app/components/User.vue
git commit -m "Add a 3D print dialog with an STL preview and download

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01QhbXkRZfCCBxg14ssHkoJC"
```

---

### Task 4: Documentation and the final check

**Files:**
- Modify: `CLAUDE.md` (sections "Commands" and "Architecture")

**Interfaces:**
- Consumes: the finished work of Tasks 1-3.
- Produces: no code.

- [ ] **Step 1: Update `CLAUDE.md`**

In "Commands", add this line after `yarn lintfix`:

```sh
yarn test          # node --test on tests/*.test.js
```

Replace the sentence "The repo has no test suite." with:

```md
`yarn test` runs the Node test runner on `tests/`. The tests cover the pure modules in `app/utils/` only, not the components.
```

In "Architecture", add this item after item 5:

```md
6. The "3D Print" button in `User` opens `PrintDialog` (as `LazyPrintDialog`, so three.js loads only when it opens). `app/utils/printModel.js` turns the `calendarCells()` window, a text, and `public/fonts/Inter-Bold.ttf` into one three.js geometry and a binary STL file. The model is about 180 x 43 x 28 mm: bars on a plate, and the text raised on a sloped front face. The parts overlap by 0.2 mm, and the slicer joins them. The model is not one manifold mesh. The text uses opentype.js glyph by glyph, because `font.getPath()` throws on the GSUB table of Inter, and the three.js `TTFLoader` loads opentype.js from a CDN.
```

Renumber the old item 6 to 7.

- [ ] **Step 2: Run all checks**

Run: `yarn test`
Expected: `# pass 11`, `# fail 0`.

Run: `yarn build`
Expected: the build ends without errors.

Run: `yarn prettier --check app/utils/printModel.js app/utils/contributionStats.js app/components/PrintDialog.vue app/components/User.vue app/components/Contributions3d.vue tests/`
Expected: `All matched files use Prettier code style!`

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "Document the STL print export and yarn test

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01QhbXkRZfCCBxg14ssHkoJC"
```
