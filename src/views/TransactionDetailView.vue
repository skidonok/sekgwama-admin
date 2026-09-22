<script setup>
import { ArrowLeft } from 'lucide-vue-next'
import { onMounted, ref } from 'vue'

import StatusBadge from '../components/StatusBadge.vue'
import UserIdentity from '../components/UserIdentity.vue'
import { getErrorMessage } from '../services/api'
import { getTransaction, resolveFraudFlag } from '../services/transactions'
import { paymentMethodLabel, paymentPurposeLabel, paymentStatusLabel, paymentStatusVariant } from '../utils/badges'
import { formatAmount, formatDateTime } from '../utils/format'

const props = defineProps({
  uid: { type: String, required: true },
  paymentId: { type: String, required: true },
})

const transaction = ref(null)
const loading = ref(true)
const error = ref('')
const resolving = ref(false)
const resolveError = ref('')

const load = async () => {
  loading.value = true
  error.value = ''
  try {
    transaction.value = await getTransaction(props.uid, props.paymentId)
  } catch (err) {
    error.value = getErrorMessage(err)
  } finally {
    loading.value = false
  }
}

const resolve = async (reviewStatus) => {
  if (resolving.value) return
  resolving.value = true
  resolveError.value = ''
  try {
    transaction.value = await resolveFraudFlag(props.uid, props.paymentId, reviewStatus)
  } catch (err) {
    resolveError.value = getErrorMessage(err)
  } finally {
    resolving.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="flex flex-col gap-4">
    <router-link
      :to="{ name: 'transactions' }"
      class="inline-flex w-fit items-center gap-1.5 text-sm text-text-secondary transition hover:text-text"
    >
      <ArrowLeft class="h-4 w-4" />
      Back to transactions
    </router-link>

    <div v-if="error" class="rounded-xl bg-danger-light px-4 py-3 text-sm text-danger dark:bg-danger/15">
      {{ error }}
    </div>

    <div v-if="loading" class="rounded-2xl bg-surface p-6 text-center text-sm text-hint dark:border dark:border-border">
      Loading transaction...
    </div>

    <div v-else-if="transaction" class="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div class="flex flex-col gap-4 lg:col-span-2">
        <div class="rounded-2xl bg-surface p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_1px_3px_rgba(16,24,40,0.06)] dark:border dark:border-border">
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="text-xs font-medium tracking-wide text-hint uppercase">{{ paymentPurposeLabel(transaction.purpose) }}</p>
              <h2 class="mt-1 text-2xl font-semibold text-text">{{ formatAmount(transaction.amount, transaction.currency) }}</h2>
            </div>
            <StatusBadge :label="paymentStatusLabel(transaction.status)" :variant="paymentStatusVariant(transaction.status)" />
          </div>

          <dl class="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-border pt-4 text-sm sm:grid-cols-3">
            <div>
              <dt class="text-xs text-hint">Method</dt>
              <dd class="text-text">{{ paymentMethodLabel(transaction.method) }}</dd>
            </div>
            <div>
              <dt class="text-xs text-hint">Order number</dt>
              <dd class="font-mono text-xs text-text">{{ transaction.orderNum }}</dd>
            </div>
            <div v-if="transaction.retailSequence">
              <dt class="text-xs text-hint">Retail sequence</dt>
              <dd class="text-text">{{ transaction.retailSequence }}</dd>
            </div>
            <div v-if="transaction.responseCode">
              <dt class="text-xs text-hint">Response code</dt>
              <dd class="text-text">{{ transaction.responseCode }}</dd>
            </div>
            <div>
              <dt class="text-xs text-hint">Created</dt>
              <dd class="text-text">{{ formatDateTime(transaction.createdAt) }}</dd>
            </div>
            <div>
              <dt class="text-xs text-hint">Updated</dt>
              <dd class="text-text">{{ formatDateTime(transaction.updatedAt) }}</dd>
            </div>
          </dl>

          <div v-if="transaction.failureReason" class="mt-4 rounded-xl bg-danger-light px-4 py-3 text-sm text-danger dark:bg-danger/15">
            {{ transaction.failureReason }}
          </div>
          <div v-if="transaction.fraudFlag" class="mt-4 rounded-xl bg-warning-light px-4 py-3 text-sm text-warning dark:bg-warning/15">
            <p>
              {{ transaction.fraudFlag.reviewStatus === 'pending_review' ? 'Flagged for fraud review' : 'Fraud flag' }}:
              {{ transaction.fraudFlag.reason || JSON.stringify(transaction.fraudFlag) }}
            </p>
            <p v-if="transaction.fraudFlag.reviewStatus !== 'pending_review'" class="mt-1 text-xs opacity-80">
              Resolved as: {{ transaction.fraudFlag.reviewStatus === 'confirmed_fraud' ? 'Confirmed fraud' : 'Cleared' }}
            </p>
            <div v-if="transaction.fraudFlag.reviewStatus === 'pending_review'" class="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                :disabled="resolving"
                class="rounded-full bg-success px-4 py-1.5 text-xs font-medium text-white transition hover:opacity-90 disabled:opacity-50"
                @click="resolve('cleared')"
              >
                Clear flag
              </button>
              <button
                type="button"
                :disabled="resolving"
                class="rounded-full bg-danger px-4 py-1.5 text-xs font-medium text-white transition hover:opacity-90 disabled:opacity-50"
                @click="resolve('confirmed_fraud')"
              >
                Confirm fraud
              </button>
              <span v-if="resolveError" class="text-xs text-danger">{{ resolveError }}</span>
            </div>
          </div>
        </div>

        <div v-if="transaction.orderInput" class="rounded-2xl bg-surface p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_1px_3px_rgba(16,24,40,0.06)] dark:border dark:border-border">
          <h3 class="mb-3 text-sm font-semibold text-text">Order</h3>
          <dl class="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3">
            <div>
              <dt class="text-xs text-hint">Symbol</dt>
              <dd class="text-text">{{ transaction.orderInput.symbol }}</dd>
            </div>
            <div>
              <dt class="text-xs text-hint">Side</dt>
              <dd class="text-text capitalize">{{ transaction.orderInput.side }}</dd>
            </div>
            <div>
              <dt class="text-xs text-hint">Type</dt>
              <dd class="text-text capitalize">{{ transaction.orderInput.type }}</dd>
            </div>
            <div v-if="transaction.orderInput.qty">
              <dt class="text-xs text-hint">Quantity</dt>
              <dd class="text-text">{{ transaction.orderInput.qty }}</dd>
            </div>
            <div v-if="transaction.orderInput.notional">
              <dt class="text-xs text-hint">Notional</dt>
              <dd class="text-text">{{ transaction.orderInput.notional }}</dd>
            </div>
          </dl>
          <div v-if="transaction.alpacaOrder" class="mt-4 border-t border-border pt-4">
            <p class="mb-2 text-xs font-medium tracking-wide text-hint uppercase">Placed order</p>
            <pre class="overflow-x-auto rounded-xl bg-black/[0.03] p-3 text-xs text-text-secondary dark:bg-white/[0.04]">{{ JSON.stringify(transaction.alpacaOrder, null, 2) }}</pre>
          </div>
        </div>

        <div v-if="transaction.alpacaJournal || transaction.depositUsdAmount" class="rounded-2xl bg-surface p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_1px_3px_rgba(16,24,40,0.06)] dark:border dark:border-border">
          <h3 class="mb-3 text-sm font-semibold text-text">Deposit journal</h3>
          <dl class="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3">
            <div v-if="transaction.depositFxRate">
              <dt class="text-xs text-hint">FX rate</dt>
              <dd class="text-text">1 BWP = {{ transaction.depositFxRate }} USD</dd>
            </div>
            <div v-if="transaction.depositUsdAmount">
              <dt class="text-xs text-hint">Credited (USD)</dt>
              <dd class="text-text">${{ transaction.depositUsdAmount.toFixed(2) }}</dd>
            </div>
          </dl>
          <div v-if="transaction.alpacaJournal" class="mt-4 border-t border-border pt-4">
            <pre class="overflow-x-auto rounded-xl bg-black/[0.03] p-3 text-xs text-text-secondary dark:bg-white/[0.04]">{{ JSON.stringify(transaction.alpacaJournal, null, 2) }}</pre>
          </div>
        </div>
      </div>

      <div class="flex flex-col gap-3 rounded-2xl bg-surface p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_1px_3px_rgba(16,24,40,0.06)] dark:border dark:border-border lg:h-fit">
        <h3 class="text-sm font-semibold text-text">Account holder</h3>
        <UserIdentity :uid="uid" />
        <router-link
          :to="{ name: 'transactions', query: { uid } }"
          class="mt-1 w-fit text-xs text-primary underline hover:opacity-80"
        >
          View all transactions for this user
        </router-link>
      </div>
    </div>
  </div>
</template>
