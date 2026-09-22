<script setup>
import { onMounted, ref } from 'vue'

import UserIdentity from '../components/UserIdentity.vue'
import { getErrorMessage } from '../services/api'
import { listSupportThreads } from '../services/supportChat'
import { formatDateTime } from '../utils/format'

const threads = ref([])
const loading = ref(true)
const error = ref('')

const load = async () => {
  loading.value = true
  error.value = ''
  try {
    threads.value = await listSupportThreads()
  } catch (err) {
    error.value = getErrorMessage(err)
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="flex flex-col gap-4">
    <div v-if="error" class="rounded-xl bg-danger-light px-4 py-3 text-sm text-danger dark:bg-danger/15">
      {{ error }}
    </div>

    <div class="overflow-hidden rounded-2xl bg-surface shadow-[0_1px_2px_rgba(16,24,40,0.04),0_1px_3px_rgba(16,24,40,0.06)] dark:border dark:border-border">
      <div class="grid grid-cols-[2fr_1fr] gap-4 border-b border-border px-6 py-3 text-xs font-medium tracking-wide text-hint uppercase">
        <span>User</span>
        <span>Last updated</span>
      </div>

      <div v-if="loading" class="px-6 py-10 text-center text-sm text-hint">Loading support threads...</div>
      <div v-else-if="threads.length === 0" class="px-6 py-10 text-center text-sm text-hint">
        No support threads found.
      </div>
      <template v-else>
        <router-link
          v-for="thread in threads"
          :key="thread.uid"
          :to="{ name: 'support-chat-thread', params: { uid: thread.uid } }"
          class="grid grid-cols-[2fr_1fr] items-center gap-4 border-b border-border px-6 py-4 text-sm last:border-b-0 hover:bg-black/[0.02] dark:hover:bg-white/[0.03]"
        >
          <UserIdentity :uid="thread.uid" compact />
          <span class="text-hint">{{ formatDateTime(thread.updatedAt) }}</span>
        </router-link>
      </template>
    </div>
  </div>
</template>
