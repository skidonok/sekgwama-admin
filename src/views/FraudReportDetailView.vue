<script setup>
import { ArrowLeft } from 'lucide-vue-next'
import { computed, onMounted, ref } from 'vue'

import ChatBubble from '../components/ChatBubble.vue'
import StatusBadge from '../components/StatusBadge.vue'
import UserIdentity from '../components/UserIdentity.vue'
import { getErrorMessage } from '../services/api'
import { getFraudReport, sendFraudReportMessage, updateFraudReportStatus } from '../services/fraudReports'
import { FRAUD_STATUSES, fraudStatusLabel, fraudStatusVariant } from '../utils/badges'
import { formatDateTime } from '../utils/format'

const props = defineProps({
  uid: { type: String, required: true },
  reportId: { type: String, required: true },
})

const report = ref(null)
const loading = ref(true)
const error = ref('')

const statusUpdating = ref(false)
const statusError = ref('')

const replyBody = ref('')
const sending = ref(false)
const sendError = ref('')

const messages = computed(() => report.value?.messages || [])
const transactions = computed(() => report.value?.transactions || [])

const load = async () => {
  loading.value = true
  error.value = ''
  try {
    report.value = await getFraudReport(props.uid, props.reportId)
  } catch (err) {
    error.value = getErrorMessage(err)
  } finally {
    loading.value = false
  }
}

const changeStatus = async (newStatus) => {
  if (!report.value || newStatus === report.value.status || statusUpdating.value) return
  statusUpdating.value = true
  statusError.value = ''
  try {
    await updateFraudReportStatus(props.uid, props.reportId, newStatus)
    await load()
  } catch (err) {
    statusError.value = getErrorMessage(err)
  } finally {
    statusUpdating.value = false
  }
}

const sendReply = async () => {
  const body = replyBody.value.trim()
  if (!body || sending.value) return
  sending.value = true
  sendError.value = ''
  try {
    const message = await sendFraudReportMessage(props.uid, props.reportId, body)
    if (!report.value.messages) report.value.messages = []
    report.value.messages.push(message)
    replyBody.value = ''
  } catch (err) {
    sendError.value = getErrorMessage(err)
  } finally {
    sending.value = false
  }
}

const formatAmount = (amount) => {
  const n = Number(amount)
  return Number.isFinite(n) ? n.toFixed(2) : amount
}

onMounted(load)
</script>

<template>
  <div class="flex flex-col gap-4">
    <router-link
      :to="{ name: 'fraud-reports' }"
      class="inline-flex w-fit items-center gap-1.5 text-sm text-text-secondary transition hover:text-text"
    >
      <ArrowLeft class="h-4 w-4" />
      Back to fraud reports
    </router-link>

    <div v-if="error" class="rounded-xl bg-danger-light px-4 py-3 text-sm text-danger dark:bg-danger/15">
      {{ error }}
    </div>

    <div v-if="loading" class="rounded-2xl bg-surface p-6 text-center text-sm text-hint dark:border dark:border-border">
      Loading report...
    </div>

    <div v-else-if="report" class="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div class="flex flex-col gap-4 lg:col-span-2">
        <div class="rounded-2xl bg-surface p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_1px_3px_rgba(16,24,40,0.06)] dark:border dark:border-border">
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="text-xs font-medium tracking-wide text-hint uppercase">Reason</p>
              <h2 class="mt-1 text-lg font-semibold text-text">{{ report.reason }}</h2>
            </div>
            <StatusBadge :label="fraudStatusLabel(report.status)" :variant="fraudStatusVariant(report.status)" />
          </div>
          <p v-if="report.details" class="mt-4 text-sm leading-relaxed text-text-secondary whitespace-pre-wrap">
            {{ report.details }}
          </p>
          <p class="mt-4 text-xs text-hint">Submitted {{ formatDateTime(report.createdAt) }}</p>

          <div class="mt-5 border-t border-border pt-4">
            <p class="mb-2 text-xs font-medium tracking-wide text-hint uppercase">Update status</p>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="s in FRAUD_STATUSES"
                :key="s"
                type="button"
                :disabled="statusUpdating || s === report.status"
                class="rounded-full border px-3.5 py-1.5 text-xs font-medium transition disabled:cursor-default"
                :class="
                  s === report.status
                    ? 'border-primary bg-secondary text-primary dark:bg-primary/15'
                    : 'border-border text-text-secondary hover:bg-black/5 dark:hover:bg-white/10'
                "
                @click="changeStatus(s)"
              >
                {{ fraudStatusLabel(s) }}
              </button>
            </div>
            <p v-if="statusError" class="mt-2 text-xs text-danger">{{ statusError }}</p>
          </div>
        </div>

        <div v-if="transactions.length" class="rounded-2xl bg-surface p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_1px_3px_rgba(16,24,40,0.06)] dark:border dark:border-border">
          <h3 class="mb-3 text-sm font-semibold text-text">Linked transactions</h3>
          <div class="flex flex-col divide-y divide-border">
            <div v-for="(txn, idx) in transactions" :key="txn.id || idx" class="flex items-center justify-between gap-4 py-2.5 text-sm">
              <div class="min-w-0">
                <p class="truncate text-text">{{ txn.title || txn.kind }}</p>
                <p class="text-xs text-hint">{{ txn.kind }} &middot; {{ formatDateTime(txn.occurredAt) }}</p>
              </div>
              <p class="shrink-0 font-medium text-text">{{ formatAmount(txn.amount) }}</p>
            </div>
          </div>
        </div>

        <div v-if="report.session" class="rounded-2xl bg-surface p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_1px_3px_rgba(16,24,40,0.06)] dark:border dark:border-border">
          <h3 class="mb-3 text-sm font-semibold text-text">Session</h3>
          <pre class="overflow-x-auto rounded-xl bg-black/[0.03] p-3 text-xs text-text-secondary dark:bg-white/[0.04]">{{ JSON.stringify(report.session, null, 2) }}</pre>
        </div>
      </div>

      <div class="flex flex-col gap-3 rounded-2xl bg-surface p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_1px_3px_rgba(16,24,40,0.06)] dark:border dark:border-border lg:h-fit">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-semibold text-text">Reported by</h3>
        </div>
        <UserIdentity :uid="uid" />

        <div class="mt-2 border-t border-border pt-4">
          <h3 class="mb-3 text-sm font-semibold text-text">Messages</h3>
          <div class="thin-scrollbar flex max-h-96 flex-col gap-3 overflow-y-auto pr-1">
            <p v-if="messages.length === 0" class="text-sm text-hint">No messages yet.</p>
            <ChatBubble
              v-for="(message, idx) in messages"
              :key="message.id || idx"
              :sender="message.sender"
              :body="message.body"
              :created-at="message.createdAt"
            />
          </div>

          <form class="mt-4 flex flex-col gap-2" @submit.prevent="sendReply">
            <textarea
              v-model="replyBody"
              rows="3"
              placeholder="Write a reply..."
              class="w-full resize-none rounded-2xl border border-border bg-bg px-4 py-2.5 text-sm text-text outline-none focus:border-primary"
            />
            <p v-if="sendError" class="text-xs text-danger">{{ sendError }}</p>
            <button
              type="submit"
              :disabled="sending || !replyBody.trim()"
              class="self-end rounded-full bg-primary px-5 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {{ sending ? 'Sending...' : 'Send' }}
            </button>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>
