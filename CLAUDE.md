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
```

The repo has no test suite. ESLint is a dev dependency, but the repo has no ESLint config and no lint script for it. Prettier is the only active linter (`semi: false`, `singleQuote: true`). Most source files do not pass `yarn lint` at this time.

## Environment

Copy `.env.example` to `.env`. `NUXT_ENV_API_URL` is the base URL of contra-api. `nuxt.config.ts` reads it at build time into `runtimeConfig.public.apiUrl`. Code reads it as `this.$config.public.apiUrl`. `NUXT_PUBLIC_API_URL` also sets it. The code does not use `NUXT_ENV_GITHUB_PERSONAL_KEY` at this time.

## Architecture

The app is Nuxt 4 (Vue 3, Options API) with `ssr: false`. `nuxt generate` makes a client-only SPA, deployed to Vercel. Source code is in `app/` (the Nuxt 4 `srcDir`). Static files are in `public/`. Nuxt auto-imports components from `app/components/`. The app has no store. HTTP calls use `$fetch` (ofetch). `$fetch` returns the parsed body.

The app has one page, `app/pages/index.vue`. That page owns all state and swaps between two views:

1. `UserInformation` shows the form for the GitHub and GitLab usernames. It emits `calculateData`. If the URL has `?githubUsername=...&gitlabUsername=...`, it submits the form automatically in `beforeMount`. This gives shareable links.
2. `index.vue` calls `GET ${NUXT_ENV_API_URL}/contributions?githubUsername=&gitlabUsername=`. It reads `res.data.contributions` and `res.data.totalContributionCount`.
3. `User` shows the result. It gets the avatar directly from `https://api.github.com/users/{name}` (no auth). It passes the contributions array to `Contributions`.
4. `Contributions` renders the array with `vue3-calendar-heatmap` (it needs the `tippy.js` peer and its `dist/style.css`). Each item must have the shape that `CalendarHeatmap` `values` expects (`{ date, count }`). The colors copy the GitHub dark theme.
5. `User` emits `close`, and `index.vue` resets to the form.

## Styling

Components use Tailwind 4 utility classes inline, on a dark gray and indigo theme. `@tailwindcss/vite` loads Tailwind. The `vite.plugins` entry in `nuxt.config.ts` adds it. The repo has no `tailwind.config.js`. `app/assets/css/tailwind.css` is the only global CSS file (set in `css` in `nuxt.config.ts`). It also restores `cursor: pointer` on buttons. `app/assets/css/main.css` uses Tailwind 3 syntax and the app does not load it. Do not depend on its classes (`.btn`, `.label`, `.card`, ...).
