<script setup>
import { useThemeStore } from './stores/theme'

// Instantiating the theme store here (rather than only inside components
// that use it) makes sure the dark/light class is applied to <html> as soon
// as the app boots, before any route renders.
useThemeStore()
</script>

<template>
  <router-view />
</template>
