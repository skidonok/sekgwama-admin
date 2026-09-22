<script setup>
import { onMounted, ref } from 'vue'

import UserIdentity from '../components/UserIdentity.vue'
import { getErrorMessage } from '../services/api'
import { listFlaggedTransactions } from '../services/transactions'
import { formatAmount, formatDateTime } from '../utils/format'

const PAGE_SIZE = 50

const flagged = ref([])
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
    const page = await listFlaggedTransactions({ limit: PAGE_SIZE })
    flagged.value = page
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
    const page = await listFlaggedTransactions({ limit: PAGE_SIZE, cursor: cursor.value })
    flagged.value = flagged.value.concat(page)
    hasMore.value = page.length === PAGE_SIZE
    if (page.length) cursor.value = page[page.length - 1].createdAt
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
    <p class="text-sm text-hint">
      Deposits held by <code class="text-xs">fraudRules.checkDepositAnomaly</code> for review before being credited.
      Open a row to clear or confirm the flag.
    </p>

    <div v-if="error" class="rounded-xl bg-danger-light px-4 py-3 text-sm text-danger dark:bg-danger/15">
      {{ error }}
    </div>

    <div class="overflow-x-auto rounded-2xl bg-surface shadow-[0_1px_2px_rgba(16,24,40,0.04),0_1px_3px_rgba(16,24,40,0.06)] dark:border dark:border-border">
      <div class="grid min-w-[860px] grid-cols-[1.1fr_2fr_1.4fr_1.4fr] gap-4 border-b border-border px-6 py-3 text-xs font-medium tracking-wide text-hint uppercase">
        <span>Amount</span>
        <span>Reason</span>
        <span>User</span>
        <span>Flagged</span>
      </div>

      <div v-if="loading" class="px-6 py-10 text-center text-sm text-hint">Loading flagged deposits...</div>
      <div v-else-if="flagged.length === 0" class="px-6 py-10 text-center text-sm text-hint">
        No deposits are currently awaiting fraud review.
      </div>
      <template v-else>
        <router-link
          v-for="txn in flagged"
          :key="txn.id"
          :to="{ name: 'transaction-detail', params: { uid: txn.uid, paymentId: txn.id } }"
          class="grid min-w-[860px] grid-cols-[1.1fr_2fr_1.4fr_1.4fr] items-center gap-4 border-b border-border px-6 py-3 text-sm last:border-b-0 hover:bg-black/[0.02] dark:hover:bg-white/[0.03]"
        >
          <span class="font-medium text-text">{{ formatAmount(txn.amount, txn.currency) }}</span>
          <span class="truncate text-text-secondary" :title="txn.fraudFlag?.reason">{{ txn.fraudFlag?.reason }}</span>
          <UserIdentity :uid="txn.uid" compact />
          <span class="text-hint">{{ formatDateTime(txn.fraudFlag?.flaggedAt || txn.createdAt) }}</span>
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
