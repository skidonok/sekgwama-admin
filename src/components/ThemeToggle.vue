<script setup>
import { Moon, Sun } from 'lucide-vue-next'

import { useThemeStore } from '../stores/theme'

const themeStore = useThemeStore()
</script>

<template>
  <button
    type="button"
    class="flex h-9 w-9 items-center justify-center rounded-full text-text-secondary transition hover:bg-black/5 dark:hover:bg-white/10"
    :title="themeStore.theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
    @click="themeStore.toggle"
  >
    <Sun v-if="themeStore.theme === 'dark'" class="h-[18px] w-[18px]" />
    <Moon v-else class="h-[18px] w-[18px]" />
  </button>
</template>
