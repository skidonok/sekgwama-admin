<script setup>
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title,
  Tooltip,
} from 'chart.js'
import { AlertTriangle, ListChecks, Radio } from 'lucide-vue-next'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { Bar } from 'vue-chartjs'

import KpiCard from '../components/KpiCard.vue'
import StatusBadge from '../components/StatusBadge.vue'
import { getErrorMessage } from '../services/api'
import { getErrors, getHealth } from '../services/status'
import {
  healthCheckLabel,
  healthStatusLabel,
  healthStatusVariant,
  systemErrorAreaLabel,
} from '../utils/badges'
import { formatDateTime, formatRelativeTime } from '../utils/format'

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale)

const RANGES = [
  { key: '1h', label: '1h', ms: 60 * 60 * 1000 },
  { key: '24h', label: '24h', ms: 24 * 60 * 60 * 1000 },
  { key: '7d', label: '7d', ms: 7 * 24 * 60 * 60 * 1000 },
  { key: '30d', label: '30d', ms: 30 * 24 * 60 * 60 * 1000 },
]
// The status page opens on "what's happened recently" - hourly buckets over
// 24h, daily buckets once the window is wide enough that hourly bars would
// just be noise.
const DAILY_BUCKET_RANGES = new Set(['7d', '30d'])

const selectedRange = ref('24h')
const loading = ref(true)
const error = ref('')

const health = ref([])
const healthCheckedAt = ref(null)
const errorEntries = ref([])
const errorSummary = ref({ total: 0, byArea: {} })
const chartData = ref({ labels: [], datasets: [] })

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: { intersect: false, mode: 'index' },
  },
  scales: {
    x: { grid: { display: false } },
    y: { beginAtZero: true, ticks: { precision: 0 } },
  },
}

const topErrorCode = computed(() => {
  const counts = new Map()
  for (const entry of errorEntries.value) {
    counts.set(entry.code, (counts.get(entry.code) || 0) + 1)
  }
  let top = null
  for (const [code, count] of counts) {
    if (!top || count > top.count) top = { code, count }
  }
  return top ? `${top.code} (${top.count})` : 'None'
})

const affectedAreaCount = computed(() => Object.keys(errorSummary.value.byArea || {}).length)

const bucketErrors = (from, to, daily) => {
  const bucketMs = daily ? 24 * 60 * 60 * 1000 : 60 * 60 * 1000
  const bucketCount = Math.ceil((to.getTime() - from.getTime()) / bucketMs)
  const buckets = Array.from({ length: bucketCount }, (_, i) => new Date(from.getTime() + i * bucketMs))
  const counts = new Array(bucketCount).fill(0)

  for (const entry of errorEntries.value) {
    const occurredAt = new Date(entry.occurredAt).getTime()
    const index = Math.floor((occurredAt - from.getTime()) / bucketMs)
    if (index >= 0 && index < bucketCount) counts[index] += 1
  }

  const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim() || '#006c82'

  chartData.value = {
    labels: buckets.map((d) => (daily ? d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }))),
    datasets: [
      {
        label: 'Errors',
        data: counts,
        backgroundColor: primaryColor,
        borderRadius: 6,
        maxBarThickness: 28,
      },
    ],
  }
}

const load = async () => {
  loading.value = true
  error.value = ''
  try {
    const range = RANGES.find((r) => r.key === selectedRange.value)
    const to = new Date()
    const from = new Date(to.getTime() - range.ms)

    const [healthData, errorsData] = await Promise.all([
      getHealth(),
      getErrors({ from: from.toISOString(), to: to.toISOString() }),
    ])

    health.value = healthData.checks
    healthCheckedAt.value = healthData.checkedAt
    errorEntries.value = errorsData.entries
    errorSummary.value = errorsData.summary

    bucketErrors(from, to, DAILY_BUCKET_RANGES.has(selectedRange.value))
  } catch (err) {
    error.value = getErrorMessage(err)
  } finally {
    loading.value = false
  }
}

let refreshTimer = null

onMounted(() => {
  load()
  // Datadog-style auto-refresh - the page should reflect reality without the
  // viewer needing to reload it themselves.
  refreshTimer = setInterval(load, 45_000)
})
onUnmounted(() => {
  if (refreshTimer) clearInterval(refreshTimer)
})
</script>

<template>
  <div class="flex flex-col gap-6">
    <div v-if="error" class="rounded-xl bg-danger-light px-4 py-3 text-sm text-danger dark:bg-danger/15">
      {{ error }}
    </div>

    <div class="flex flex-wrap items-center justify-between gap-3">
      <h2 class="text-sm font-semibold text-text">Service health</h2>
      <div class="inline-flex rounded-full border border-border bg-surface p-1">
        <button
          v-for="range in RANGES"
          :key="range.key"
          type="button"
          class="rounded-full px-3.5 py-1.5 text-sm font-medium transition"
          :class="selectedRange === range.key ? 'bg-primary text-white' : 'text-text-secondary hover:bg-black/5 dark:hover:bg-white/10'"
          @click="selectedRange = range.key; load()"
        >
          {{ range.label }}
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="check in health"
        :key="check.name"
        class="flex items-center justify-between rounded-2xl bg-surface p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_1px_3px_rgba(16,24,40,0.06)] dark:border dark:border-border"
      >
        <div class="min-w-0">
          <p class="truncate text-sm font-medium text-text">{{ healthCheckLabel(check.name) }}</p>
          <p class="mt-0.5 truncate text-xs text-hint" :title="check.message">
            {{ check.message || formatRelativeTime(check.checkedAt) }}
          </p>
        </div>
        <StatusBadge :label="healthStatusLabel(check.status)" :variant="healthStatusVariant(check.status)" />
      </div>
      <div v-if="!loading && health.length === 0" class="col-span-full rounded-2xl bg-surface p-6 text-center text-sm text-hint dark:border dark:border-border">
        No health checks recorded yet - the scheduled check runs every 5 minutes.
      </div>
    </div>
    <p v-if="healthCheckedAt" class="-mt-2 text-xs text-hint">Last checked {{ formatRelativeTime(healthCheckedAt) }}</p>

    <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <KpiCard label="Errors in period" :value="errorSummary.total" :icon="AlertTriangle" accent="danger" :loading="loading" />
      <KpiCard label="Areas affected" :value="affectedAreaCount" :icon="Radio" accent="warning" :loading="loading" />
      <KpiCard label="Most frequent" :value="topErrorCode" :icon="ListChecks" accent="primary" :loading="loading" />
    </div>

    <div class="rounded-2xl bg-surface p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_1px_3px_rgba(16,24,40,0.06)] dark:border dark:border-border">
      <h2 class="mb-4 text-sm font-semibold text-text">Errors over time</h2>
      <div class="h-64">
        <div v-if="loading" class="flex h-full items-center justify-center text-sm text-hint">Loading chart...</div>
        <Bar v-else :data="chartData" :options="chartOptions" />
      </div>
    </div>

    <div class="overflow-x-auto rounded-2xl bg-surface shadow-[0_1px_2px_rgba(16,24,40,0.04),0_1px_3px_rgba(16,24,40,0.06)] dark:border dark:border-border">
      <div class="grid min-w-[760px] grid-cols-[1.2fr_0.8fr_1fr_2fr] gap-4 border-b border-border px-6 py-3 text-xs font-medium tracking-wide text-hint uppercase">
        <span>Time</span>
        <span>Area</span>
        <span>Code</span>
        <span>Message</span>
      </div>

      <div v-if="loading" class="px-6 py-10 text-center text-sm text-hint">Loading errors...</div>
      <div v-else-if="errorEntries.length === 0" class="px-6 py-10 text-center text-sm text-hint">
        No errors in this period.
      </div>
      <template v-else>
        <div
          v-for="entry in errorEntries"
          :key="entry.id"
          class="grid min-w-[760px] grid-cols-[1.2fr_0.8fr_1fr_2fr] items-center gap-4 border-b border-border px-6 py-3 text-sm last:border-b-0"
        >
          <span class="text-hint">{{ formatDateTime(entry.occurredAt) }}</span>
          <span class="text-text-secondary">{{ systemErrorAreaLabel(entry.area) }}</span>
          <span class="font-mono text-xs text-text-secondary">{{ entry.code }}</span>
          <span class="truncate text-text" :title="entry.message">{{ entry.message }}</span>
        </div>
      </template>
    </div>
  </div>
</template>
