<script setup>
import { onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import StatusBadge from '../components/StatusBadge.vue'
import UserIdentity from '../components/UserIdentity.vue'
import { getErrorMessage } from '../services/api'
import { listTransactions } from '../services/transactions'
import {
  PAYMENT_PURPOSES,
  PAYMENT_STATUSES,
  paymentMethodLabel,
  paymentPurposeLabel,
  paymentStatusLabel,
  paymentStatusVariant,
} from '../utils/badges'
import { formatAmount, formatDateTime } from '../utils/format'

const PAGE_SIZE = 50

const route = useRoute()
const router = useRouter()

const statusFilter = ref(typeof route.query.status === 'string' ? route.query.status : '')
const purposeFilter = ref('')
const uidFilter = ref(typeof route.query.uid === 'string' ? route.query.uid : '')

// Mutually exclusive at the API level (a query can only be scoped by one of
// status/purpose/uid at a time - see payments.repository.ts's
// listAllForAdmin), same convention as the audit log's action/uid split.
watch(statusFilter, (val) => {
  if (val) {
    purposeFilter.value = ''
    uidFilter.value = ''
  }
})
watch(purposeFilter, (val) => {
  if (val) {
    statusFilter.value = ''
    uidFilter.value = ''
  }
})
watch(uidFilter, (val) => {
  if (val) {
    statusFilter.value = ''
    purposeFilter.value = ''
  }
})

const transactions = ref([])
const loading = ref(true)
const loadingMore = ref(false)
const error = ref('')
const cursor = ref(undefined)
const hasMore = ref(false)

const currentFilters = () => ({
  status: statusFilter.value || undefined,
  purpose: purposeFilter.value || undefined,
  uid: uidFilter.value.trim() || undefined,
})

const load = async () => {
  loading.value = true
  error.value = ''
  cursor.value = undefined
  try {
    const page = await listTransactions({ ...currentFilters(), limit: PAGE_SIZE })
    transactions.value = page
    hasMore.value = page.length === PAGE_SIZE
    cursor.value = page.length ? page[page.length - 1].createdAt : undefined
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
    const page = await listTransactions({ ...currentFilters(), limit: PAGE_SIZE, cursor: cursor.value })
    transactions.value = transactions.value.concat(page)
    hasMore.value = page.length === PAGE_SIZE
    if (page.length) cursor.value = page[page.length - 1].createdAt
  } catch (err) {
    error.value = getErrorMessage(err)
  } finally {
    loadingMore.value = false
  }
}

const clearUidFilter = () => {
  uidFilter.value = ''
  const rest = { ...route.query }
  delete rest.uid
  router.replace({ query: rest })
}

watch([statusFilter, purposeFilter, uidFilter], load)
onMounted(load)
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex flex-wrap items-end gap-3">
      <div class="flex flex-col gap-1">
        <label for="txn-status" class="text-xs font-medium text-hint">Status</label>
        <select
          id="txn-status"
          v-model="statusFilter"
          class="rounded-full border border-border bg-surface px-4 py-2 text-sm text-text outline-none focus:border-primary"
        >
          <option value="">All statuses</option>
          <option v-for="s in PAYMENT_STATUSES" :key="s" :value="s">{{ paymentStatusLabel(s) }}</option>
        </select>
      </div>
      <div class="flex flex-col gap-1">
        <label for="txn-purpose" class="text-xs font-medium text-hint">Purpose</label>
        <select
          id="txn-purpose"
          v-model="purposeFilter"
          class="rounded-full border border-border bg-surface px-4 py-2 text-sm text-text outline-none focus:border-primary"
        >
          <option value="">All purposes</option>
          <option v-for="p in PAYMENT_PURPOSES" :key="p" :value="p">{{ paymentPurposeLabel(p) }}</option>
        </select>
      </div>
      <div class="flex flex-col gap-1">
        <label for="txn-uid" class="text-xs font-medium text-hint">User ID</label>
        <div class="flex items-center gap-1.5">
          <input
            id="txn-uid"
            v-model="uidFilter"
            type="text"
            placeholder="uid"
            class="w-48 rounded-full border border-border bg-surface px-4 py-2 text-sm text-text outline-none focus:border-primary"
          />
          <button
            v-if="uidFilter"
            type="button"
            title="Clear"
            class="text-xs text-hint underline hover:text-text"
            @click="clearUidFilter"
          >
            Clear
          </button>
        </div>
      </div>
    </div>

    <div v-if="error" class="rounded-xl bg-danger-light px-4 py-3 text-sm text-danger dark:bg-danger/15">
      {{ error }}
    </div>

    <div class="overflow-x-auto rounded-2xl bg-surface shadow-[0_1px_2px_rgba(16,24,40,0.04),0_1px_3px_rgba(16,24,40,0.06)] dark:border dark:border-border">
      <div class="grid min-w-[860px] grid-cols-[1.1fr_1fr_1.1fr_1fr_1.4fr_1.4fr] gap-4 border-b border-border px-6 py-3 text-xs font-medium tracking-wide text-hint uppercase">
        <span>Amount</span>
        <span>Status</span>
        <span>Purpose</span>
        <span>Method</span>
        <span>User</span>
        <span>Created</span>
      </div>

      <div v-if="loading" class="px-6 py-10 text-center text-sm text-hint">Loading transactions...</div>
      <div v-else-if="transactions.length === 0" class="px-6 py-10 text-center text-sm text-hint">
        No transactions found.
      </div>
      <template v-else>
        <router-link
          v-for="txn in transactions"
          :key="txn.id"
          :to="{ name: 'transaction-detail', params: { uid: txn.uid, paymentId: txn.id } }"
          class="grid min-w-[860px] grid-cols-[1.1fr_1fr_1.1fr_1fr_1.4fr_1.4fr] items-center gap-4 border-b border-border px-6 py-3 text-sm last:border-b-0 hover:bg-black/[0.02] dark:hover:bg-white/[0.03]"
        >
          <span class="font-medium text-text">{{ formatAmount(txn.amount, txn.currency) }}</span>
          <span>
            <StatusBadge :label="paymentStatusLabel(txn.status)" :variant="paymentStatusVariant(txn.status)" />
          </span>
          <span class="text-text-secondary">{{ paymentPurposeLabel(txn.purpose) }}</span>
          <span class="text-text-secondary">{{ paymentMethodLabel(txn.method) }}</span>
          <UserIdentity :uid="txn.uid" compact />
          <span class="text-hint">{{ formatDateTime(txn.createdAt) }}</span>
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
