import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2026-10-02',

  // Disable server-side rendering: https://nuxt.com/docs/guide/concepts/rendering
  ssr: false,

  app: {
    head: {
      title: 'Contra · Merge GitHub and GitLab contributions',
      htmlAttrs: {
        lang: 'en',
      },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content:
            'Merge your GitHub and GitLab contribution calendars into one heatmap.',
        },
        { name: 'theme-color', content: '#030712' },
        { name: 'format-detection', content: 'telephone=no' },
      ],
      link: [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }],
    },
  },

  css: ['~/assets/css/tailwind.css'],

  runtimeConfig: {
    public: {
      // Keeps the old NUXT_ENV_API_URL name. NUXT_PUBLIC_API_URL also works.
      apiUrl: process.env.NUXT_ENV_API_URL || '',
    },
  },

  vite: {
    plugins: [tailwindcss()],
  },
})
