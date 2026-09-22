<script setup>
import { computed, ref, watch } from 'vue'

import { resolveUser } from '../utils/userCache'
import { truncateId } from '../utils/format'

const props = defineProps({
  uid: { type: String, required: true },
  compact: { type: Boolean, default: false },
})

const state = ref('loading') // 'loading' | 'ready' | 'error'
const profile = ref(null)

const load = async (uid) => {
  state.value = 'loading'
  profile.value = null
  try {
    profile.value = await resolveUser(uid)
    state.value = 'ready'
  } catch {
    state.value = 'error'
  }
}

watch(() => props.uid, load, { immediate: true })

const displayName = computed(() => {
  if (!profile.value) return null
  const name = [profile.value.firstName, profile.value.lastName].filter(Boolean).join(' ')
  return name || profile.value.email || null
})
</script>

<template>
  <div class="min-w-0">
    <div v-if="state === 'loading'" class="h-4 w-28 animate-pulse rounded bg-black/5 dark:bg-white/10" />
    <template v-else-if="state === 'ready' && displayName">
      <p class="truncate text-sm font-medium text-text">{{ displayName }}</p>
      <p v-if="!compact && profile.email && displayName !== profile.email" class="truncate text-xs text-hint">
        {{ profile.email }}
      </p>
    </template>
    <p v-else class="truncate font-mono text-xs text-hint" :title="uid">{{ truncateId(uid, 12) }}</p>
  </div>
</template>
