<script setup>
import { Bell } from 'lucide-vue-next'
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import AppSidebar from '../components/AppSidebar.vue'
import ThemeToggle from '../components/ThemeToggle.vue'
import { useAuthStore } from '../stores/auth'

const route = useRoute()
const auth = useAuthStore()

const pageTitle = computed(() => route.meta.title || 'Sekgwama Admin')

const initials = computed(() => {
  const user = auth.user
  if (!user) return '?'
  const first = user.firstName?.[0] || user.email?.[0] || '?'
  const last = user.lastName?.[0] || ''
  return (first + last).toUpperCase()
})

const displayName = computed(() => {
  const user = auth.user
  if (!user) return ''
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ')
  return name || user.email || ''
})
</script>

<template>
  <div class="app-gradient-bg flex min-h-screen w-full gap-4 p-4">
    <AppSidebar />

    <div class="flex min-w-0 flex-1 flex-col gap-4">
      <header class="flex items-center justify-between rounded-2xl bg-surface px-6 py-4 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_1px_3px_rgba(16,24,40,0.06)] dark:border dark:border-border">
        <div>
          <h1 class="text-lg font-semibold text-text">{{ pageTitle }}</h1>
          <p class="text-xs text-hint">Sekgwama internal ops console</p>
        </div>

        <div class="flex items-center gap-3">
          <ThemeToggle />
          <button
            type="button"
            title="Notifications"
            class="flex h-9 w-9 items-center justify-center rounded-full text-text-secondary transition hover:bg-black/5 dark:hover:bg-white/10"
          >
            <Bell class="h-[18px] w-[18px]" />
          </button>
          <div class="flex items-center gap-2.5 border-l border-border pl-3">
            <div
              class="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white"
            >
              {{ initials }}
            </div>
            <div class="hidden sm:block">
              <p class="text-sm font-medium leading-tight text-text">{{ displayName }}</p>
              <p class="text-xs leading-tight text-hint">Admin</p>
            </div>
          </div>
        </div>
      </header>

      <main class="min-w-0 flex-1 pb-4">
        <router-view />
      </main>
    </div>
  </div>
</template>
