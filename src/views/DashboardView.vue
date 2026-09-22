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
import { Clock, FileWarning, MessageCircle, ShieldAlert } from 'lucide-vue-next'
import { onMounted, ref } from 'vue'
import { Bar } from 'vue-chartjs'

import KpiCard from '../components/KpiCard.vue'
import { getErrorMessage } from '../services/api'
import { exportAuditLog } from '../services/audit'
import { listFraudReports } from '../services/fraudReports'
import { listSupportThreads } from '../services/supportChat'
import { listTransactions } from '../services/transactions'
import { formatDayLabel } from '../utils/format'

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale)

const loading = ref(true)
const error = ref('')

const needingAttention = ref(0)
const totalReports = ref(0)
const activeThreads = ref(0)
const pendingTransactionsLabel = ref(0)

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

const load = async () => {
  loading.value = true
  error.value = ''
  try {
    const to = new Date()
    const from = new Date(to.getTime() - 14 * 24 * 60 * 60 * 1000)

    const [submitted, all, threads, audit, pendingTransactions] = await Promise.all([
      listFraudReports('submitted'),
      listFraudReports(),
      listSupportThreads(),
      exportAuditLog({ from: from.toISOString(), to: to.toISOString() }),
      // Capped at 100 - this is a landing-page signal ("is anything stuck?"),
      // not an exact count, same spirit as payments.service.listDeposits'
      // "generous rather than exact" comment. See TransactionsView for the
      // full, paginated list.
      listTransactions({ status: 'pending', limit: 100 }),
    ])

    needingAttention.value = submitted.length
    totalReports.value = all.length
    activeThreads.value = threads.length
    pendingTransactionsLabel.value = pendingTransactions.length === 100 ? '100+' : pendingTransactions.length

    // Bucket audit entries into one count per day across the 14-day window.
    const days = []
    for (let i = 13; i >= 0; i -= 1) {
      days.push(new Date(to.getTime() - i * 24 * 60 * 60 * 1000))
    }
    const counts = new Map(days.map((d) => [d.toDateString(), 0]))
    for (const entry of audit.entries || []) {
      const key = new Date(entry.occurredAt).toDateString()
      if (counts.has(key)) counts.set(key, counts.get(key) + 1)
    }

    const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim() || '#006c82'

    chartData.value = {
      labels: days.map((d) => formatDayLabel(d)),
      datasets: [
        {
          label: 'Audit events',
          data: days.map((d) => counts.get(d.toDateString())),
          backgroundColor: primaryColor,
          borderRadius: 6,
          maxBarThickness: 28,
        },
      ],
    }
  } catch (err) {
    error.value = getErrorMessage(err)
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="flex flex-col gap-6">
    <div v-if="error" class="rounded-xl bg-danger-light px-4 py-3 text-sm text-danger dark:bg-danger/15">
      {{ error }}
    </div>

    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard
        label="Fraud reports needing attention"
        :value="needingAttention"
        :icon="ShieldAlert"
        accent="warning"
        :loading="loading"
      />
      <KpiCard
        label="Total fraud reports"
        :value="totalReports"
        :icon="FileWarning"
        accent="primary"
        :loading="loading"
      />
      <KpiCard
        label="Active support threads"
        :value="activeThreads"
        :icon="MessageCircle"
        accent="primary"
        :loading="loading"
      />
      <router-link :to="{ name: 'transactions', query: { status: 'pending' } }">
        <KpiCard
          label="Pending transactions"
          :value="pendingTransactionsLabel"
          :icon="Clock"
          accent="warning"
          :loading="loading"
        />
      </router-link>
    </div>

    <div class="rounded-2xl bg-surface p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_1px_3px_rgba(16,24,40,0.06)] dark:border dark:border-border">
      <h2 class="mb-4 text-sm font-semibold text-text">Audit activity - last 14 days</h2>
      <div class="h-72">
        <div v-if="loading" class="flex h-full items-center justify-center text-sm text-hint">Loading chart...</div>
        <Bar v-else :data="chartData" :options="chartOptions" />
      </div>
    </div>
  </div>
</template>
