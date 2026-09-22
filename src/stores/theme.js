import { defineStore } from 'pinia'
import { ref, watchEffect } from 'vue'

const THEME_KEY = 'sekgwama_admin_theme'

const preferredTheme = () => {
  const stored = localStorage.getItem(THEME_KEY)
  if (stored === 'light' || stored === 'dark') return stored
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

// Light/dark toggle, persisted in localStorage. Light is the primary,
// designed-for experience; dark just swaps the token values from style.css.
export const useThemeStore = defineStore('theme', () => {
  const theme = ref(preferredTheme())

  watchEffect(() => {
    document.documentElement.classList.toggle('dark', theme.value === 'dark')
    localStorage.setItem(THEME_KEY, theme.value)
  })

  const toggle = () => {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
  }

  return { theme, toggle }
})
