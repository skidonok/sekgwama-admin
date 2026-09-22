<script setup>
import { onMounted, ref, watch } from 'vue'

import StatusBadge from '../components/StatusBadge.vue'
import { getErrorMessage } from '../services/api'
import { listWebhookDeliveries } from '../services/webhooksAdmin'
import { formatDateTime } from '../utils/format'

const PAGE_SIZE = 50
const PROVIDERS = ['alpaca', 'apple', 'realpay']

const providerFilter = ref('')

const deliveries = ref([])
const loading = ref(true)
const loadingMore = ref(false)
const error = ref('')
const cursor = ref(undefined)
const hasMore = ref(false)

const load = async () => {
  loading.value = true
  error.value = ''
  cursor.value = undefined
  try {
    const page = await listWebhookDeliveries({ provider: providerFilter.value || undefined, limit: PAGE_SIZE })
    deliveries.value = page
    hasMore.value = page.length === PAGE_SIZE
    cursor.value = page.length ? page[page.length - 1].receivedAt : undefined
  } catch (err) {
    error.value = getErrorMessage(err)
  } finally {
    loading.value = false
  }
}

const loadMore = async () => {
  if (loadingMore.value || !hasMore.value) return
  loadingMore.value = true
  error.value = ''
  try {
    const page = await listWebhookDeliveries({ provider: providerFilter.value || undefined, limit: PAGE_SIZE, cursor: cursor.value })
    deliveries.value = deliveries.value.concat(page)
    hasMore.value = page.length === PAGE_SIZE
    if (page.length) cursor.value = page[page.length - 1].receivedAt
  } catch (err) {
    error.value = getErrorMessage(err)
  } finally {
    loadingMore.value = false
  }
}

watch(providerFilter, load)
onMounted(load)
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex flex-col gap-1">
      <label for="webhook-provider" class="text-xs font-medium text-hint">Provider</label>
      <select
        id="webhook-provider"
        v-model="providerFilter"
        class="w-48 rounded-full border border-border bg-surface px-4 py-2 text-sm text-text outline-none focus:border-primary"
      >
        <option value="">All providers</option>
        <option v-for="p in PROVIDERS" :key="p" :value="p">{{ p }}</option>
      </select>
    </div>

    <div v-if="error" class="rounded-xl bg-danger-light px-4 py-3 text-sm text-danger dark:bg-danger/15">
      {{ error }}
    </div>

    <div class="overflow-x-auto rounded-2xl bg-surface shadow-[0_1px_2px_rgba(16,24,40,0.04),0_1px_3px_rgba(16,24,40,0.06)] dark:border dark:border-border">
      <div class="grid min-w-[760px] grid-cols-[1fr_1fr_1.4fr_1.4fr_1.4fr] gap-4 border-b border-border px-6 py-3 text-xs font-medium tracking-wide text-hint uppercase">
        <span>Provider</span>
        <span>Status</span>
        <span>Received</span>
        <span>Processed</span>
        <span>Expires</span>
      </div>

      <div v-if="loading" class="px-6 py-10 text-center text-sm text-hint">Loading deliveries...</div>
      <div v-else-if="deliveries.length === 0" class="px-6 py-10 text-center text-sm text-hint">No webhook deliveries found.</div>
      <template v-else>
        <div
          v-for="delivery in deliveries"
          :key="delivery.id"
          class="grid min-w-[760px] grid-cols-[1fr_1fr_1.4fr_1.4fr_1.4fr] items-center gap-4 border-b border-border px-6 py-3 text-sm last:border-b-0"
        >
          <span class="text-text capitalize">{{ delivery.provider }}</span>
          <span>
            <StatusBadge
              :label="delivery.status === 'processed' ? 'Processed' : 'Processing'"
              :variant="delivery.status === 'processed' ? 'success' : 'warning'"
            />
          </span>
          <span class="text-text-secondary">{{ formatDateTime(delivery.receivedAt) }}</span>
          <span class="text-text-secondary">{{ delivery.processedAt ? formatDateTime(delivery.processedAt) : '-' }}</span>
          <span class="text-hint">{{ formatDateTime(delivery.expiresAt) }}</span>
        </div>
      </template>
    </div>

    <button
      v-if="hasMore"
      type="button"
      :disabled="loadingMore"
      class="self-center rounded-full border border-border px-5 py-2 text-sm font-medium text-text transition hover:bg-black/5 disabled:opacity-50 dark:hover:bg-white/10"
      @click="loadMore"
    >
      {{ loadingMore ? 'Loading...' : 'Load more' }}
    </button>
  </div>
</template>
