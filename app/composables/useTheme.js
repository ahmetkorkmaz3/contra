import { ref } from 'vue'

export const THEME_KEY = 'contra:theme'
// The colors of the html background in each theme, for the theme-color meta tag.
const THEME_COLORS = { dark: '#030712', light: '#f9fafb' }

// The inline script in nuxt.config.ts sets the class before the first paint.
// This ref starts from that class, so the page and the ref agree.
const theme = ref(
  typeof document !== 'undefined' &&
    !document.documentElement.classList.contains('dark')
    ? 'light'
    : 'dark',
)

function setThemeColor(value) {
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', THEME_COLORS[value])
}

function apply(value) {
  theme.value = value
  document.documentElement.classList.toggle('dark', value === 'dark')
  setThemeColor(value)
}

function savedTheme() {
  try {
    return localStorage.getItem(THEME_KEY)
  } catch {
    return null
  }
}

// The head script runs before the meta tag exists, so set the color here.
if (typeof document !== 'undefined') setThemeColor(theme.value)

// Without a saved choice, follow the system setting when it changes.
if (typeof window !== 'undefined' && window.matchMedia) {
  window
    .matchMedia('(prefers-color-scheme: dark)')
    .addEventListener('change', (event) => {
      if (!savedTheme()) apply(event.matches ? 'dark' : 'light')
    })
}

export function useTheme() {
  function toggleTheme() {
    const value = theme.value === 'dark' ? 'light' : 'dark'
    apply(value)
    try {
      localStorage.setItem(THEME_KEY, value)
    } catch {
      // Ignore. The theme still changes for this visit.
    }
  }
  return { theme, toggleTheme }
}
