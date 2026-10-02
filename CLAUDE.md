# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Contra merges the GitHub and GitLab contribution calendars of one person into a single heatmap. This repo holds only the frontend. A separate backend ([contra-api](https://github.com/ahmetkorkmaz3/contra-api)) fetches and merges the data. GitLab private contributions show only when the user enables them in GitLab profile settings.

## Commands

Use Yarn. Nuxt 4 needs Node `^22.19.0`, `^24.11.0`, or `>=26.0.0`.

```sh
yarn install       # install dependencies
yarn dev           # start the dev server
yarn build         # nuxt generate (static output in .output/public, dist/ is a symlink)
yarn generate      # same as build
yarn preview       # serve the generated output
yarn lint          # prettier --check .
yarn lintfix       # prettier --write on changed files
yarn test          # node --test on tests/*.test.js
```

`yarn test` runs the Node test runner on `tests/`. The tests cover the pure modules in `app/utils/` only, not the components. ESLint is a dev dependency, but the repo has no ESLint config and no lint script for it. Prettier is the only active linter (`semi: false`, `singleQuote: true`). Most source files do not pass `yarn lint` at this time.

## Environment

Copy `.env.example` to `.env`. `NUXT_ENV_API_URL` is the base URL of contra-api. `nuxt.config.ts` reads it at build time into `runtimeConfig.public.apiUrl`. Code reads it as `this.$config.public.apiUrl`. `NUXT_PUBLIC_API_URL` also sets it. The code does not use `NUXT_ENV_GITHUB_PERSONAL_KEY` at this time.

## Architecture

The app is Nuxt 4 (Vue 3, Options API) with `ssr: false`. `nuxt generate` makes a client-only SPA, deployed to Vercel. Source code is in `app/` (the Nuxt 4 `srcDir`). Static files are in `public/`. Nuxt auto-imports components from `app/components/`. The app has no store. HTTP calls use `$fetch` (ofetch). `$fetch` returns the parsed body.

The app has one page, `app/pages/index.vue`. That page owns all state and swaps between two views:

1. `UserInformation` shows the form for the GitHub and GitLab usernames. It emits `calculateData`. If the URL has `?githubUsername=...&gitlabUsername=...`, it submits the form automatically in `beforeMount`. This gives shareable links.
2. `index.vue` calls `GET ${NUXT_ENV_API_URL}/contributions?githubUsername=&gitlabUsername=`. It reads `res.data.contributions` and `res.data.totalContributionCount`.
3. `User` shows the result. It gets the avatar and the display name directly from `https://api.github.com/users/{name}` (no auth). It gets the stats (active days, streaks, best day) from `app/utils/contributionStats.js`. It passes the contributions array to `Contributions`.
4. `Contributions` renders the array with `vue3-calendar-heatmap` (it needs the `tippy.js` peer and its `dist/style.css`). Each item must have the shape that `CalendarHeatmap` `values` expects (`{ date, count }`). The colors copy the GitHub dark theme. `rangeColor` needs 6 colors: index 0 is "no data" and index 5 is the maximum.
   A 2D/3D toggle in `User` swaps `Contributions` for `Contributions3d`. The toggle saves the choice in `localStorage`. `Contributions3d` draws the same data as bars in an SVG with its own orthographic camera (no 3D library). Drag, double-click, or the arrow keys change the camera angle. The `viewBox` fits the calendar at each angle. The bars are keyed by position, not by day. A new draw order then changes attributes and does not move DOM nodes, so the grow animation does not start again.
5. The "Share" button in `User` opens `ShareDialog`. `app/utils/shareCard.js` draws a 1200x630 PNG card on a canvas in the browser. The dialog downloads, copies, or shares the card, and opens the X and LinkedIn share screens. The SPA has no server for `og:image`, so the share link is `${apiUrl}/share?githubUsername=&gitlabUsername=` on contra-api. That page gives the Open Graph tags and a server-made card (`/api/og`) to X and LinkedIn, then sends browsers to the result page. Without `apiUrl`, the share link is the frontend URL and has no preview card.
6. The "3D Print" button in `User` opens `PrintDialog` (as `LazyPrintDialog`, so three.js loads only when it opens). `app/utils/printModel.js` turns the `calendarCells()` window, a text, and `public/fonts/Inter-Bold.ttf` into one three.js geometry and a binary STL file. The model is about 180 x 43 x 28 mm: bars on a plate, and the text raised on a sloped front face. The parts overlap by 0.2 mm, and the slicer joins them. The model is not one manifold mesh. The text uses opentype.js glyph by glyph, because `font.getPath()` throws on the GSUB table of Inter, and the three.js `TTFLoader` loads opentype.js from a CDN.
7. On a result, `index.vue` puts the usernames in the URL query. `User` emits `close`, and `index.vue` clears the query first, then resets to the form.

## Styling

Components use Tailwind 4 utility classes inline, on a dark gray and indigo theme. `@tailwindcss/vite` loads Tailwind. The `vite.plugins` entry in `nuxt.config.ts` adds it. The repo has no `tailwind.config.js`. `app/assets/css/tailwind.css` is the only global CSS file (set in `css` in `nuxt.config.ts`). It also restores `cursor: pointer` on buttons. `app/assets/css/main.css` uses Tailwind 3 syntax and the app does not load it. Do not depend on its classes (`.btn`, `.label`, `.card`, ...).
