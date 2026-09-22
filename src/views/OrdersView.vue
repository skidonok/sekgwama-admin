<script setup>
import { onMounted, ref } from 'vue'

import StatusBadge from '../components/StatusBadge.vue'
import UserIdentity from '../components/UserIdentity.vue'
import { getErrorMessage } from '../services/api'
import { listAllOrders } from '../services/tradingAdmin'
import { orderStatusLabel, orderStatusVariant } from '../utils/badges'
import { formatDateTime } from '../utils/format'

const PAGE_SIZE = 50

const orders = ref([])
const loading = ref(true)
const loadingMore = ref(false)
const error = ref('')
const cursor = ref(undefined)
const hasMore = ref(false)

const orderSize = (order) => (order.notional ? `$${order.notional}` : order.qty ? `${order.qty} sh` : '-')

const load = async () => {
  loading.value = true
  error.value = ''
  cursor.value = undefined
  try {
    const page = await listAllOrders({ limit: PAGE_SIZE })
    orders.value = page
    hasMore.value = page.length === PAGE_SIZE
    cursor.value = page.length ? page[page.length - 1].updatedAt : undefined
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
    const page = await listAllOrders({ limit: PAGE_SIZE, cursor: cursor.value })
    orders.value = orders.value.concat(page)
    hasMore.value = page.length === PAGE_SIZE
    if (page.length) cursor.value = page[page.length - 1].updatedAt
  } catch (err) {
    error.value = getErrorMessage(err)
  } finally {
    loadingMore.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="flex flex-col gap-4">
    <div v-if="error" class="rounded-xl bg-danger-light px-4 py-3 text-sm text-danger dark:bg-danger/15">
      {{ error }}
    </div>

    <div class="overflow-x-auto rounded-2xl bg-surface shadow-[0_1px_2px_rgba(16,24,40,0.04),0_1px_3px_rgba(16,24,40,0.06)] dark:border dark:border-border">
      <div class="grid min-w-[860px] grid-cols-[1.2fr_1fr_1fr_1fr_1.4fr_1.4fr] gap-4 border-b border-border px-6 py-3 text-xs font-medium tracking-wide text-hint uppercase">
        <span>Order</span>
        <span>Size</span>
        <span>Status</span>
        <span>Fill price</span>
        <span>User</span>
        <span>Updated</span>
      </div>

      <div v-if="loading" class="px-6 py-10 text-center text-sm text-hint">Loading orders...</div>
      <div v-else-if="orders.length === 0" class="px-6 py-10 text-center text-sm text-hint">No orders found.</div>
      <template v-else>
        <router-link
          v-for="order in orders"
          :key="order.id"
          :to="{ name: 'order-detail', params: { uid: order.uid, orderId: order.id } }"
          class="grid min-w-[860px] grid-cols-[1.2fr_1fr_1fr_1fr_1.4fr_1.4fr] items-center gap-4 border-b border-border px-6 py-3 text-sm last:border-b-0 hover:bg-black/[0.02] dark:hover:bg-white/[0.03]"
        >
          <span class="font-medium text-text capitalize">{{ order.side }} {{ order.symbol }}</span>
          <span class="text-text-secondary">{{ orderSize(order) }}</span>
          <span>
            <StatusBadge :label="orderStatusLabel(order.status)" :variant="orderStatusVariant(order.status)" />
          </span>
          <span class="text-text-secondary">{{ order.filledAvgPrice ? `$${order.filledAvgPrice}` : '-' }}</span>
          <UserIdentity :uid="order.uid" compact />
          <span class="text-hint">{{ formatDateTime(order.updatedAt) }}</span>
        </router-link>
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
