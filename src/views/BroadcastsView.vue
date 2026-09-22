<script setup>
import { reactive, ref, watch } from 'vue'

import { getErrorMessage } from '../services/api'
import { sendLegalUpdate, sendPromotionalCampaign, sendRegulatoryNotice } from '../services/broadcasts'

const TABS = [
  { id: 'legal', label: 'Legal update' },
  { id: 'regulatory', label: 'Regulatory notice' },
  { id: 'promotional', label: 'Promotional campaign' },
]
const activeTab = ref('legal')

// Each form tracks its own preview/send state independently: `preview` holds
// the last dry-run response, `confirming` gates the actual send behind an
// explicit second click (this sends real email to every user, so a single
// click is deliberately not enough), and `sent` shows the final result.
// Editing the form after previewing invalidates the stale preview via the
// watchers below, so Send can never fire against copy the admin didn't see.
const legalForm = reactive({ kind: 'terms', effectiveDate: '', summary: '', documentUrl: '' })
const legalState = reactive({ loading: false, error: '', preview: null, confirming: false, sent: null })

const regulatoryForm = reactive({ subject: '', summary: '', effectiveDate: '', documentUrl: '' })
const regulatoryState = reactive({ loading: false, error: '', preview: null, confirming: false, sent: null })

const promoForm = reactive({ headline: '', body: '', ctaLabel: '', ctaUrl: '' })
const promoState = reactive({ loading: false, error: '', preview: null, confirming: false, sent: null })

const invalidatePreview = (state) => {
  state.preview = null
  state.confirming = false
  state.sent = null
}

watch(legalForm, () => invalidatePreview(legalState), { deep: true })
watch(regulatoryForm, () => invalidatePreview(regulatoryState), { deep: true })
watch(promoForm, () => invalidatePreview(promoState), { deep: true })

const previewLegal = async () => {
  legalState.loading = true
  legalState.error = ''
  try {
    legalState.preview = await sendLegalUpdate({ ...legalForm, documentUrl: legalForm.documentUrl || undefined, confirm: false })
  } catch (err) {
    legalState.error = getErrorMessage(err)
  } finally {
    legalState.loading = false
  }
}
const sendLegal = async () => {
  if (!legalState.confirming) {
    legalState.confirming = true
    return
  }
  legalState.loading = true
  legalState.error = ''
  try {
    legalState.sent = await sendLegalUpdate({ ...legalForm, documentUrl: legalForm.documentUrl || undefined, confirm: true })
    legalState.confirming = false
  } catch (err) {
    legalState.error = getErrorMessage(err)
  } finally {
    legalState.loading = false
  }
}

const previewRegulatory = async () => {
  regulatoryState.loading = true
  regulatoryState.error = ''
  try {
    regulatoryState.preview = await sendRegulatoryNotice({
      ...regulatoryForm,
      effectiveDate: regulatoryForm.effectiveDate || undefined,
      documentUrl: regulatoryForm.documentUrl || undefined,
      confirm: false,
    })
  } catch (err) {
    regulatoryState.error = getErrorMessage(err)
  } finally {
    regulatoryState.loading = false
  }
}
const sendRegulatory = async () => {
  if (!regulatoryState.confirming) {
    regulatoryState.confirming = true
    return
  }
  regulatoryState.loading = true
  regulatoryState.error = ''
  try {
    regulatoryState.sent = await sendRegulatoryNotice({
      ...regulatoryForm,
      effectiveDate: regulatoryForm.effectiveDate || undefined,
      documentUrl: regulatoryForm.documentUrl || undefined,
      confirm: true,
    })
    regulatoryState.confirming = false
  } catch (err) {
    regulatoryState.error = getErrorMessage(err)
  } finally {
    regulatoryState.loading = false
  }
}

const promoBodyLines = () =>
  promoForm.body
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

const previewPromo = async () => {
  promoState.loading = true
  promoState.error = ''
  try {
    promoState.preview = await sendPromotionalCampaign({
      headline: promoForm.headline,
      bodyLines: promoBodyLines(),
      ctaLabel: promoForm.ctaLabel || undefined,
      ctaUrl: promoForm.ctaUrl || undefined,
      confirm: false,
    })
  } catch (err) {
    promoState.error = getErrorMessage(err)
  } finally {
    promoState.loading = false
  }
}
const sendPromo = async () => {
  if (!promoState.confirming) {
    promoState.confirming = true
    return
  }
  promoState.loading = true
  promoState.error = ''
  try {
    promoState.sent = await sendPromotionalCampaign({
      headline: promoForm.headline,
      bodyLines: promoBodyLines(),
      ctaLabel: promoForm.ctaLabel || undefined,
      ctaUrl: promoForm.ctaUrl || undefined,
      confirm: true,
    })
    promoState.confirming = false
  } catch (err) {
    promoState.error = getErrorMessage(err)
  } finally {
    promoState.loading = false
  }
}

const inputClass =
  'w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-text outline-none focus:border-primary'
const labelClass = 'text-xs font-medium text-hint'
</script>

<template>
  <div class="flex flex-col gap-4">
    <p class="text-sm text-hint">
      Preview a broadcast before sending - every send below emails every user (or every opted-in user, for the
      promotional campaign) and can't be undone.
    </p>

    <div class="flex gap-2">
      <button
        v-for="tab in TABS"
        :key="tab.id"
        type="button"
        class="rounded-full px-4 py-2 text-sm font-medium transition"
        :class="activeTab === tab.id ? 'bg-primary text-white' : 'bg-surface text-text-secondary hover:bg-black/5 dark:hover:bg-white/10'"
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Legal update -->
    <div
      v-if="activeTab === 'legal'"
      class="flex flex-col gap-4 rounded-2xl bg-surface p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_1px_3px_rgba(16,24,40,0.06)] dark:border dark:border-border"
    >
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div class="flex flex-col gap-1.5">
          <label :class="labelClass">Document</label>
          <select v-model="legalForm.kind" :class="inputClass">
            <option value="terms">Terms of Use</option>
            <option value="privacy">Privacy Policy</option>
          </select>
        </div>
        <div class="flex flex-col gap-1.5">
          <label :class="labelClass">Effective date</label>
          <input v-model="legalForm.effectiveDate" type="date" :class="inputClass" />
        </div>
      </div>
      <div class="flex flex-col gap-1.5">
        <label :class="labelClass">Summary (what changed)</label>
        <textarea v-model="legalForm.summary" rows="3" :class="inputClass" />
      </div>
      <div class="flex flex-col gap-1.5">
        <label :class="labelClass">Document URL (optional)</label>
        <input v-model="legalForm.documentUrl" type="url" placeholder="https://sekgwama.online/legal/terms" :class="inputClass" />
      </div>

      <div v-if="legalState.error" class="rounded-xl bg-danger-light px-4 py-3 text-sm text-danger dark:bg-danger/15">
        {{ legalState.error }}
      </div>

      <div v-if="legalState.sent" class="rounded-xl bg-success-light px-4 py-3 text-sm text-success dark:bg-success/15">
        Sent to {{ legalState.sent.delivered }} of {{ legalState.sent.recipients }} recipients ({{ legalState.sent.failed }} failed).
      </div>
      <template v-else-if="legalState.preview">
        <div class="rounded-xl border border-border p-4 text-sm">
          <p class="mb-1 font-medium text-text">Subject: {{ legalState.preview.subject }}</p>
          <p class="whitespace-pre-line text-text-secondary">{{ legalState.preview.text }}</p>
          <p class="mt-2 text-xs text-hint">Recipients: {{ legalState.preview.recipients }}</p>
        </div>
        <div class="flex items-center gap-3">
          <button
            type="button"
            :disabled="legalState.loading"
            class="rounded-full bg-danger px-5 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
            @click="sendLegal"
          >
            {{ legalState.confirming ? `Confirm: email ${legalState.preview.recipients} users` : 'Send' }}
          </button>
          <button v-if="legalState.confirming" type="button" class="text-sm text-hint underline" @click="legalState.confirming = false">
            Cancel
          </button>
        </div>
      </template>
      <button
        v-else
        type="button"
        :disabled="legalState.loading || !legalForm.effectiveDate || !legalForm.summary"
        class="w-fit rounded-full bg-primary px-5 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
        @click="previewLegal"
      >
        {{ legalState.loading ? 'Loading...' : 'Preview' }}
      </button>
    </div>

    <!-- Regulatory notice -->
    <div
      v-if="activeTab === 'regulatory'"
      class="flex flex-col gap-4 rounded-2xl bg-surface p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_1px_3px_rgba(16,24,40,0.06)] dark:border dark:border-border"
    >
      <div class="flex flex-col gap-1.5">
        <label :class="labelClass">Subject</label>
        <input v-model="regulatoryForm.subject" type="text" :class="inputClass" />
      </div>
      <div class="flex flex-col gap-1.5">
        <label :class="labelClass">Summary</label>
        <textarea v-model="regulatoryForm.summary" rows="3" :class="inputClass" />
      </div>
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div class="flex flex-col gap-1.5">
          <label :class="labelClass">Effective date (optional)</label>
          <input v-model="regulatoryForm.effectiveDate" type="date" :class="inputClass" />
        </div>
        <div class="flex flex-col gap-1.5">
          <label :class="labelClass">Document URL (optional)</label>
          <input v-model="regulatoryForm.documentUrl" type="url" :class="inputClass" />
        </div>
      </div>

      <div v-if="regulatoryState.error" class="rounded-xl bg-danger-light px-4 py-3 text-sm text-danger dark:bg-danger/15">
        {{ regulatoryState.error }}
      </div>

      <div v-if="regulatoryState.sent" class="rounded-xl bg-success-light px-4 py-3 text-sm text-success dark:bg-success/15">
        Sent to {{ regulatoryState.sent.delivered }} of {{ regulatoryState.sent.recipients }} recipients ({{ regulatoryState.sent.failed }} failed).
      </div>
      <template v-else-if="regulatoryState.preview">
        <div class="rounded-xl border border-border p-4 text-sm">
          <p class="mb-1 font-medium text-text">Subject: {{ regulatoryState.preview.subject }}</p>
          <p class="whitespace-pre-line text-text-secondary">{{ regulatoryState.preview.text }}</p>
          <p class="mt-2 text-xs text-hint">Recipients: {{ regulatoryState.preview.recipients }}</p>
        </div>
        <div class="flex items-center gap-3">
          <button
            type="button"
            :disabled="regulatoryState.loading"
            class="rounded-full bg-danger px-5 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
            @click="sendRegulatory"
          >
            {{ regulatoryState.confirming ? `Confirm: email ${regulatoryState.preview.recipients} users` : 'Send' }}
          </button>
          <button v-if="regulatoryState.confirming" type="button" class="text-sm text-hint underline" @click="regulatoryState.confirming = false">
            Cancel
          </button>
        </div>
      </template>
      <button
        v-else
        type="button"
        :disabled="regulatoryState.loading || !regulatoryForm.subject || !regulatoryForm.summary"
        class="w-fit rounded-full bg-primary px-5 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
        @click="previewRegulatory"
      >
        {{ regulatoryState.loading ? 'Loading...' : 'Preview' }}
      </button>
    </div>

    <!-- Promotional campaign -->
    <div
      v-if="activeTab === 'promotional'"
      class="flex flex-col gap-4 rounded-2xl bg-surface p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_1px_3px_rgba(16,24,40,0.06)] dark:border dark:border-border"
    >
      <div class="flex flex-col gap-1.5">
        <label :class="labelClass">Headline</label>
        <input v-model="promoForm.headline" type="text" :class="inputClass" />
      </div>
      <div class="flex flex-col gap-1.5">
        <label :class="labelClass">Body (one paragraph per line)</label>
        <textarea v-model="promoForm.body" rows="4" :class="inputClass" />
      </div>
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div class="flex flex-col gap-1.5">
          <label :class="labelClass">CTA label (optional)</label>
          <input v-model="promoForm.ctaLabel" type="text" placeholder="Open Sekgwama" :class="inputClass" />
        </div>
        <div class="flex flex-col gap-1.5">
          <label :class="labelClass">CTA URL (optional)</label>
          <input v-model="promoForm.ctaUrl" type="url" :class="inputClass" />
        </div>
      </div>

      <div v-if="promoState.error" class="rounded-xl bg-danger-light px-4 py-3 text-sm text-danger dark:bg-danger/15">
        {{ promoState.error }}
      </div>

      <div v-if="promoState.sent" class="rounded-xl bg-success-light px-4 py-3 text-sm text-success dark:bg-success/15">
        Sent to {{ promoState.sent.delivered }} of {{ promoState.sent.recipients }} recipients ({{ promoState.sent.failed }} failed).
      </div>
      <template v-else-if="promoState.preview">
        <div class="rounded-xl border border-border p-4 text-sm">
          <p class="mb-1 font-medium text-text">Subject: {{ promoState.preview.subject }}</p>
          <p class="whitespace-pre-line text-text-secondary">{{ promoState.preview.text }}</p>
          <p class="mt-2 text-xs text-hint">Recipients: up to {{ promoState.preview.recipients }} (opted-in only)</p>
        </div>
        <div class="flex items-center gap-3">
          <button
            type="button"
            :disabled="promoState.loading"
            class="rounded-full bg-danger px-5 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
            @click="sendPromo"
          >
            {{ promoState.confirming ? `Confirm: email up to ${promoState.preview.recipients} users` : 'Send' }}
          </button>
          <button v-if="promoState.confirming" type="button" class="text-sm text-hint underline" @click="promoState.confirming = false">
            Cancel
          </button>
        </div>
      </template>
      <button
        v-else
        type="button"
        :disabled="promoState.loading || !promoForm.headline || !promoBodyLines().length"
        class="w-fit rounded-full bg-primary px-5 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
        @click="previewPromo"
      >
        {{ promoState.loading ? 'Loading...' : 'Preview' }}
      </button>
    </div>
  </div>
</template>
