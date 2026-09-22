<script setup>
import { onMounted, ref, watch } from 'vue'

import StatusBadge from '../components/StatusBadge.vue'
import UserIdentity from '../components/UserIdentity.vue'
import { getErrorMessage } from '../services/api'
import { listFraudReports } from '../services/fraudReports'
import { FRAUD_STATUSES, fraudStatusLabel, fraudStatusVariant } from '../utils/badges'
import { formatDateTime } from '../utils/format'

const status = ref('')
const reports = ref([])
const loading = ref(true)
const error = ref('')

const load = async () => {
  loading.value = true
  error.value = ''
  try {
    reports.value = await listFraudReports(status.value || undefined)
  } catch (err) {
    error.value = getErrorMessage(err)
  } finally {
    loading.value = false
  }
}

watch(status, load)
onMounted(load)
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex items-center justify-between">
      <h2 class="text-sm font-medium text-text-secondary">Fraud reports</h2>
      <select
        v-model="status"
        aria-label="Filter by status"
        class="rounded-full border border-border bg-surface px-4 py-2 text-sm text-text outline-none focus:border-primary"
      >
        <option value="">All statuses</option>
        <option v-for="s in FRAUD_STATUSES" :key="s" :value="s">{{ fraudStatusLabel(s) }}</option>
      </select>
    </div>

    <div v-if="error" class="rounded-xl bg-danger-light px-4 py-3 text-sm text-danger dark:bg-danger/15">
      {{ error }}
    </div>

    <div class="overflow-hidden rounded-2xl bg-surface shadow-[0_1px_2px_rgba(16,24,40,0.04),0_1px_3px_rgba(16,24,40,0.06)] dark:border dark:border-border">
      <div
        class="grid grid-cols-[2fr_1fr_1.5fr_1fr] gap-4 border-b border-border px-6 py-3 text-xs font-medium tracking-wide text-hint uppercase"
      >
        <span>Reason</span>
        <span>Status</span>
        <span>Reported by</span>
        <span>Submitted</span>
      </div>

      <div v-if="loading" class="px-6 py-10 text-center text-sm text-hint">Loading fraud reports...</div>
      <div v-else-if="reports.length === 0" class="px-6 py-10 text-center text-sm text-hint">
        No fraud reports found.
      </div>
      <template v-else>
        <router-link
          v-for="report in reports"
          :key="report.id"
          :to="{ name: 'fraud-report-detail', params: { uid: report.uid, reportId: report.id } }"
          class="grid grid-cols-[2fr_1fr_1.5fr_1fr] items-center gap-4 border-b border-border px-6 py-4 text-sm last:border-b-0 hover:bg-black/[0.02] dark:hover:bg-white/[0.03]"
        >
          <span class="truncate text-text">{{ report.reason }}</span>
          <span>
            <StatusBadge :label="fraudStatusLabel(report.status)" :variant="fraudStatusVariant(report.status)" />
          </span>
          <UserIdentity :uid="report.uid" compact />
          <span class="text-hint">{{ formatDateTime(report.createdAt) }}</span>
        </router-link>
      </template>
    </div>
  </div>
</template>
