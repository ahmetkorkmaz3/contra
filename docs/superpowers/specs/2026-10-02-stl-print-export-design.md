# STL print export for the 3D heatmap

Date: 2026-10-02
Status: approved design, waiting for an implementation plan

## Goal

The user downloads their 3D contribution heatmap as an STL file and prints it on a 3D printer. The print stands on a desk. A sloped front face under the heatmap shows a text that the user types (the default is their nickname). The user sees a preview of the exact model before the download.

## Decisions

- The output is one binary STL file. STL has no color, so only the bar heights show the data.
- The browser makes the model. contra-api does not change.
- The text is raised by 1 mm on a sloped front face (option "embossed, sloped front").
- The preview shows the real mesh with three.js (WebGL).
- The mesh is a merge of overlapping solids, made with three.js (approach A). The model does not use a true boolean union. Desktop slicers (Cura, PrusaSlicer, Bambu Studio) join overlapping shells. If a print service needs one manifold mesh later, add manifold-3d on top of this design.

## Geometry

All sizes are in millimeters. The model sits on the z = 0 plane and needs no supports.

| Part | Value |
|---|---|
| Total size | about 180 x 43 x 28 (width x depth x height) |
| Bar pitch | 3.2 (53 weeks x 7 days) |
| Bar footprint | 2.6 x 2.6 (gap 0.6, so a 0.4 mm nozzle prints the bars apart) |
| Bar height above the plate | highest day 20, lowest day with contributions 1.2, day without contributions 0.4 |
| Plate | top face at 8, margin of 5 around the bars, depth 32.4 |
| Sloped front face | in front of the plate, goes down from 8 to 2 over a depth of 10 (about 31 degrees) |
| Text | on the sloped face, raised by 1, maximum 24 characters |

Side section:

```
          # #          <- bars (0.4 to 20 above the plate)
   +--------------+ 8  <- plate top face
  /  @nickname    |
 /________________| 0
 <-10-><--32.4--->
```

Rules:

- Bar height uses the same ratio as the 3D view: `count / max`. The model uses the same 53-week window as the 2D and 3D views.
- Each solid goes 0.2 into the solid under it. Thus the slicer joins all solids into one part.
- The font line box (ascender to descender) is 7 high. Thus all texts get the same letter size. A text that is wider than 170 gets smaller until it fits.
- An empty text gives a flat sloped face. The download still works.

## Files

| File | Job |
|---|---|
| `app/utils/contributionStats.js` | New function `calendarCells(data, now)`. It gives the 53-week window as `{ cells: [{ week, dow, count }], max }`. This logic is now in `Contributions3d.vue`. Both components use the new function, so the 3D view and the STL show the same days. |
| `app/utils/printModel.js` | No Vue. `parseFont(buffer)` gives an opentype.js font. `buildPrintModel({ cells, max, text, font })` gives a `BufferGeometry`. `exportStl(geometry)` gives a binary STL `Blob`. All sizes from the geometry section are constants at the top of the file. |
| `app/components/PrintDialog.vue` | The same shell as `ShareDialog` (Teleport, Esc closes it, a click outside closes it). It holds the three.js preview, the text field, and the "Download STL" button. |
| `app/components/User.vue` | A "3D Print" button next to the "Share" button. The `printOpen` state opens the dialog. |
| `public/fonts/Inter-Bold.ttf` | The text font (Inter 4.1). Inter has the OFL license and supports Turkish letters (ş, ğ, ı, İ). The file is 420 KB. The `helvetiker` font that comes with three.js does not support these letters. |
| `package.json` | The `three` and `opentype.js` dependencies and a `test` script. |

## PrintDialog

- Props: `cells`, `max`, `defaultText` (the GitHub username, or the GitLab username when there is no GitHub username).
- `User.vue` uses `<LazyPrintDialog>`. Nuxt puts the dialog, three.js, and opentype.js in a separate chunk that loads when the dialog opens. The bundle of the main page does not change.
- The model does not use `TTFLoader` from three.js. In three 0.186, `TTFLoader` loads opentype.js from a CDN URL. `printModel.js` uses opentype.js from npm and lays out the glyphs one by one, with kerning. The text shaping of opentype.js 2.0 fails on the GSUB table of Inter.
- Preview: one color mesh (`#39d353`, the color of the highest level), a dark background, one directional light, and one ambient light. The mouse or a touch turns and zooms the model.
- When the text changes, the dialog makes the model again after 250 ms (debounce). It calls `dispose()` on the old geometry.
- A counter under the text field shows the length (`12/24`). The field accepts 24 characters at most.
- File name: `contra-<text>.stl`. When the text is empty, the name is `contra-heatmap.stl`.
- When the dialog closes, it disposes the renderer, the controls, and the geometry.

## Data flow

1. `User.vue` calls `calendarCells(data, Date.now())` and gets `cells` and `max`.
2. The user clicks "3D Print". `PrintDialog` opens and loads three.js and the font in parallel.
3. `buildPrintModel` makes the geometry. The preview shows this geometry.
4. The user changes the text. After 250 ms, a new geometry replaces the old one.
5. "Download STL" calls `exportStl` on the current geometry. The browser downloads the `Blob`.

The preview and the download use the same geometry. Thus the user sees the exact model that the printer makes.

## Errors

| Case | Behavior |
|---|---|
| No WebGL | A message shows in place of the preview. "Download STL" still works. |
| The font does not load | An error message and a "Retry" button show. The download stays off. |
| A character that is not in the font (for example an emoji) | The model skips the character. A note under the text field says "Some characters are not supported". |
| No contributions (`max = 0`) | All bars are 0.4 high. The model is still made. |
| Empty text | The sloped face stays flat. |

## Testing

The repo has no test suite. The tests use the Node test runner, so no new test dependency is necessary.

- `yarn test` runs `node --test`.
- `tests/printModel.test.js` reads the font with `fs` and calls `buildPrintModel`. It checks these points:
  - The bounds are about 180 x 43 x 28. The lowest z value is 0.
  - The highest bar ends at 8 + 20 = 28.
  - A long text does not go past the width of 170.
  - The STL size in bytes is `84 + 50 x triangle count`.
- `tests/contributionStats.test.js` checks that `calendarCells` gives 53 weeks and the correct `max`.
- Manual check: open the STL in PrusaSlicer or Bambu Studio. The slicer shows no errors and asks for no supports.

## Out of scope

- Multi-color files (3MF).
- User controls for size, bar height, or font.
- A true boolean union (manifold-3d).
