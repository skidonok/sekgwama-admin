<script setup>
import { ArrowLeft } from 'lucide-vue-next'
import { onMounted, ref } from 'vue'

import StatusBadge from '../components/StatusBadge.vue'
import UserIdentity from '../components/UserIdentity.vue'
import { getErrorMessage } from '../services/api'
import { getOrder } from '../services/tradingAdmin'
import { orderStatusLabel, orderStatusVariant } from '../utils/badges'
import { formatDateTime } from '../utils/format'

const props = defineProps({
  uid: { type: String, required: true },
  orderId: { type: String, required: true },
})

const order = ref(null)
const loading = ref(true)
const error = ref('')

const load = async () => {
  loading.value = true
  error.value = ''
  try {
    order.value = await getOrder(props.uid, props.orderId)
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
    <router-link :to="{ name: 'orders' }" class="inline-flex w-fit items-center gap-1.5 text-sm text-text-secondary transition hover:text-text">
      <ArrowLeft class="h-4 w-4" />
      Back to orders
    </router-link>

    <div v-if="error" class="rounded-xl bg-danger-light px-4 py-3 text-sm text-danger dark:bg-danger/15">
      {{ error }}
    </div>

    <div v-if="loading" class="rounded-2xl bg-surface p-6 text-center text-sm text-hint dark:border dark:border-border">
      Loading order...
    </div>

    <div v-else-if="order" class="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div class="flex flex-col gap-4 lg:col-span-2">
        <div class="rounded-2xl bg-surface p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_1px_3px_rgba(16,24,40,0.06)] dark:border dark:border-border">
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="text-xs font-medium tracking-wide text-hint uppercase capitalize">{{ order.side }} order</p>
              <h2 class="mt-1 text-2xl font-semibold text-text">{{ order.symbol }}</h2>
            </div>
            <StatusBadge :label="orderStatusLabel(order.status)" :variant="orderStatusVariant(order.status)" />
          </div>

          <dl class="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-border pt-4 text-sm sm:grid-cols-3">
            <div>
              <dt class="text-xs text-hint">Type</dt>
              <dd class="text-text capitalize">{{ order.type }}</dd>
            </div>
            <div v-if="order.qty">
              <dt class="text-xs text-hint">Quantity</dt>
              <dd class="text-text">{{ order.qty }}</dd>
            </div>
            <div v-if="order.notional">
              <dt class="text-xs text-hint">Notional</dt>
              <dd class="text-text">${{ order.notional }}</dd>
            </div>
            <div v-if="order.filled_qty">
              <dt class="text-xs text-hint">Filled quantity</dt>
              <dd class="text-text">{{ order.filled_qty }}</dd>
            </div>
            <div v-if="order.filled_avg_price">
              <dt class="text-xs text-hint">Fill price</dt>
              <dd class="text-text">${{ order.filled_avg_price }}</dd>
            </div>
            <div>
              <dt class="text-xs text-hint">Time in force</dt>
              <dd class="text-text uppercase">{{ order.time_in_force }}</dd>
            </div>
            <div>
              <dt class="text-xs text-hint">Submitted</dt>
              <dd class="text-text">{{ formatDateTime(order.submitted_at) }}</dd>
            </div>
            <div>
              <dt class="text-xs text-hint">Updated</dt>
              <dd class="text-text">{{ formatDateTime(order.updated_at) }}</dd>
            </div>
          </dl>
        </div>

        <div class="rounded-2xl bg-surface p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_1px_3px_rgba(16,24,40,0.06)] dark:border dark:border-border">
          <h3 class="mb-3 text-sm font-semibold text-text">Raw Alpaca order</h3>
          <pre class="overflow-x-auto rounded-xl bg-black/[0.03] p-3 text-xs text-text-secondary dark:bg-white/[0.04]">{{ JSON.stringify(order, null, 2) }}</pre>
        </div>
      </div>

      <div class="flex flex-col gap-3 rounded-2xl bg-surface p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_1px_3px_rgba(16,24,40,0.06)] dark:border dark:border-border lg:h-fit">
        <h3 class="text-sm font-semibold text-text">Account holder</h3>
        <UserIdentity :uid="uid" />
        <router-link :to="{ name: 'user-detail', params: { uid } }" class="mt-1 w-fit text-xs text-primary underline hover:opacity-80">
          View user detail
        </router-link>
      </div>
    </div>
  </div>
</template>
