<script setup>
import { Download, ShieldCheck } from 'lucide-vue-next'
import { onMounted, ref, watch } from 'vue'

import StatusBadge from '../components/StatusBadge.vue'
import UserIdentity from '../components/UserIdentity.vue'
import { getErrorMessage } from '../services/api'
import { downloadAuditLogCsv, exportAuditLog, verifyAuditLog } from '../services/audit'
import { outcomeVariant } from '../utils/badges'
import { formatDateTime } from '../utils/format'

const toDateInputValue = (date) => date.toISOString().slice(0, 10)

const today = new Date()
const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

const fromDate = ref(toDateInputValue(weekAgo))
const toDate = ref(toDateInputValue(today))
const actionFilter = ref('')
const uidFilter = ref('')

// action/uid are mutually exclusive per the API - clear whichever one isn't
// being typed into as soon as the other gains a value.
watch(actionFilter, (val) => {
  if (val) uidFilter.value = ''
})
watch(uidFilter, (val) => {
  if (val) actionFilter.value = ''
})

const entries = ref([])
const searched = ref(false)
const loading = ref(false)
const error = ref('')

const downloading = ref(false)
const downloadError = ref('')

const verifying = ref(false)
const verifyError = ref('')
const verifyResult = ref(null) // { checked, breaks }

const currentFilters = () => ({
  from: new Date(`${fromDate.value}T00:00:00`).toISOString(),
  to: new Date(`${toDate.value}T23:59:59.999`).toISOString(),
  action: actionFilter.value.trim() || undefined,
  uid: uidFilter.value.trim() || undefined,
})

const search = async () => {
  loading.value = true
  error.value = ''
  verifyResult.value = null
  try {
    const result = await exportAuditLog(currentFilters())
    entries.value = result.entries || []
    searched.value = true
  } catch (err) {
    error.value = getErrorMessage(err)
  } finally {
    loading.value = false
  }
}

const download = async () => {
  downloading.value = true
  downloadError.value = ''
  try {
    await downloadAuditLogCsv(currentFilters())
  } catch (err) {
    downloadError.value = getErrorMessage(err)
  } finally {
    downloading.value = false
  }
}

const verify = async () => {
  verifying.value = true
  verifyError.value = ''
  verifyResult.value = null
  try {
    verifyResult.value = await verifyAuditLog({
      from: new Date(`${fromDate.value}T00:00:00`).toISOString(),
      to: new Date(`${toDate.value}T23:59:59.999`).toISOString(),
    })
  } catch (err) {
    verifyError.value = getErrorMessage(err)
  } finally {
    verifying.value = false
  }
}

onMounted(search)
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="rounded-2xl bg-surface p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_1px_3px_rgba(16,24,40,0.06)] dark:border dark:border-border">
      <div class="flex flex-wrap items-end gap-3">
        <div class="flex flex-col gap-1">
          <label for="audit-from" class="text-xs font-medium text-hint">From</label>
          <input
            id="audit-from"
            v-model="fromDate"
            type="date"
            class="rounded-full border border-border bg-bg px-4 py-2 text-sm text-text outline-none focus:border-primary"
          />
        </div>
        <div class="flex flex-col gap-1">
          <label for="audit-to" class="text-xs font-medium text-hint">To</label>
          <input
            id="audit-to"
            v-model="toDate"
            type="date"
            class="rounded-full border border-border bg-bg px-4 py-2 text-sm text-text outline-none focus:border-primary"
          />
        </div>
        <div class="flex flex-col gap-1">
          <label for="audit-action" class="text-xs font-medium text-hint">Action</label>
          <input
            id="audit-action"
            v-model="actionFilter"
            type="text"
            placeholder="e.g. login"
            :disabled="!!uidFilter"
            class="w-40 rounded-full border border-border bg-bg px-4 py-2 text-sm text-text outline-none focus:border-primary disabled:opacity-50"
          />
        </div>
        <div class="flex flex-col gap-1">
          <label for="audit-uid" class="text-xs font-medium text-hint">User ID</label>
          <input
            id="audit-uid"
            v-model="uidFilter"
            type="text"
            placeholder="uid"
            :disabled="!!actionFilter"
            class="w-40 rounded-full border border-border bg-bg px-4 py-2 text-sm text-text outline-none focus:border-primary disabled:opacity-50"
          />
        </div>

        <div class="ml-auto flex flex-wrap gap-2">
          <button
            type="button"
            :disabled="loading"
            class="rounded-full bg-primary px-5 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
            @click="search"
          >
            {{ loading ? 'Searching...' : 'Search' }}
          </button>
          <button
            type="button"
            :disabled="downloading"
            class="inline-flex items-center gap-1.5 rounded-full border border-border px-5 py-2 text-sm font-medium text-text transition hover:bg-black/5 disabled:opacity-50 dark:hover:bg-white/10"
            @click="download"
          >
            <Download class="h-4 w-4" />
            {{ downloading ? 'Downloading...' : 'Download CSV' }}
          </button>
          <button
            type="button"
            :disabled="verifying"
            class="inline-flex items-center gap-1.5 rounded-full border border-border px-5 py-2 text-sm font-medium text-text transition hover:bg-black/5 disabled:opacity-50 dark:hover:bg-white/10"
            @click="verify"
          >
            <ShieldCheck class="h-4 w-4" />
            {{ verifying ? 'Verifying...' : 'Verify Chain Integrity' }}
          </button>
        </div>
      </div>
      <p v-if="downloadError" class="mt-3 text-xs text-danger">{{ downloadError }}</p>
    </div>

    <div v-if="verifyError" class="rounded-xl bg-danger-light px-4 py-3 text-sm text-danger dark:bg-danger/15">
      {{ verifyError }}
    </div>
    <div
      v-else-if="verifyResult && verifyResult.breaks.length === 0"
      class="rounded-xl bg-success-light px-4 py-3 text-sm text-success dark:bg-success/15"
    >
      Chain verified - {{ verifyResult.checked }} entries checked, no breaks found.
    </div>
    <div
      v-else-if="verifyResult && verifyResult.breaks.length > 0"
      class="rounded-xl bg-danger-light px-4 py-3 text-sm text-danger dark:bg-danger/15"
    >
      <p class="font-medium">
        Chain integrity failure - {{ verifyResult.breaks.length }} break(s) found out of
        {{ verifyResult.checked }} entries checked.
      </p>
      <ul class="mt-2 flex flex-col gap-1 pl-4 text-xs">
        <li v-for="(brk, idx) in verifyResult.breaks" :key="idx" class="list-disc">
          <span v-if="brk.sequence !== undefined">Sequence {{ brk.sequence }}: </span>
          <span>{{ brk.reason || brk.message || JSON.stringify(brk) }}</span>
        </li>
      </ul>
    </div>

    <div v-if="error" class="rounded-xl bg-danger-light px-4 py-3 text-sm text-danger dark:bg-danger/15">
      {{ error }}
    </div>

    <div class="overflow-x-auto rounded-2xl bg-surface shadow-[0_1px_2px_rgba(16,24,40,0.04),0_1px_3px_rgba(16,24,40,0.06)] dark:border dark:border-border">
      <div class="grid min-w-[860px] grid-cols-[0.6fr_1.3fr_1.2fr_1fr_1.4fr_1.4fr] gap-4 border-b border-border px-6 py-3 text-xs font-medium tracking-wide text-hint uppercase">
        <span>Seq</span>
        <span>Occurred</span>
        <span>Action</span>
        <span>Outcome</span>
        <span>Actor</span>
        <span>Resource</span>
      </div>

      <div v-if="loading" class="px-6 py-10 text-center text-sm text-hint">Loading audit log...</div>
      <div v-else-if="searched && entries.length === 0" class="px-6 py-10 text-center text-sm text-hint">
        No audit entries found for this range.
      </div>
      <template v-else>
        <div
          v-for="entry in entries"
          :key="entry.sequence ?? entry.id"
          class="grid min-w-[860px] grid-cols-[0.6fr_1.3fr_1.2fr_1fr_1.4fr_1.4fr] items-center gap-4 border-b border-border px-6 py-3 text-sm last:border-b-0"
        >
          <span class="text-hint">{{ entry.sequence }}</span>
          <span class="text-text-secondary">{{ formatDateTime(entry.occurredAt) }}</span>
          <span class="truncate text-text">{{ entry.action }}</span>
          <span>
            <StatusBadge :label="entry.outcome" :variant="outcomeVariant(entry.outcome)" />
          </span>
          <span class="min-w-0">
            <UserIdentity v-if="entry.actor?.uid" :uid="entry.actor.uid" compact />
            <span v-else class="text-text-secondary">{{ entry.actor?.type || '-' }}</span>
          </span>
          <span class="truncate text-text-secondary">
            {{ entry.resource?.type || '-' }}<span v-if="entry.resource?.id"> &middot; {{ entry.resource.id }}</span>
          </span>
        </div>
      </template>
    </div>
  </div>
</template>
