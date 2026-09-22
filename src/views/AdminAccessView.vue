<script setup>
import { ShieldCheck, ShieldOff, UserPlus } from 'lucide-vue-next'
import { onMounted, ref } from 'vue'

import StatusBadge from '../components/StatusBadge.vue'
import { useAuthStore } from '../stores/auth'
import { getErrorMessage } from '../services/api'
import { grantAdminAccess, listAdmins, revokeAdminAccess } from '../services/adminAccess'
import { formatDateTime } from '../utils/format'

const auth = useAuthStore()

const admins = ref([])
const loading = ref(true)
const error = ref('')

const grantUid = ref('')
const granting = ref(false)
const grantError = ref('')

const revokingUid = ref(null)
const revokeError = ref('')

const load = async () => {
  loading.value = true
  error.value = ''
  try {
    admins.value = await listAdmins()
  } catch (err) {
    error.value = getErrorMessage(err)
  } finally {
    loading.value = false
  }
}

const displayName = (admin) => [admin.firstName, admin.lastName].filter(Boolean).join(' ') || admin.email || admin.uid

const grant = async () => {
  const uid = grantUid.value.trim()
  if (!uid || granting.value) return
  granting.value = true
  grantError.value = ''
  try {
    await grantAdminAccess(uid)
    grantUid.value = ''
    await load()
  } catch (err) {
    grantError.value = getErrorMessage(err)
  } finally {
    granting.value = false
  }
}

const revoke = async (uid) => {
  if (revokingUid.value) return
  revokingUid.value = uid
  revokeError.value = ''
  try {
    await revokeAdminAccess(uid)
    await load()
  } catch (err) {
    revokeError.value = getErrorMessage(err)
  } finally {
    revokingUid.value = null
  }
}

onMounted(load)
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="rounded-2xl bg-surface p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_1px_3px_rgba(16,24,40,0.06)] dark:border dark:border-border">
      <h3 class="mb-1 text-sm font-semibold text-text">Grant admin access</h3>
      <p class="mb-3 text-xs text-hint">
        Find the user's UID on their user detail page, then grant access here. They'll need to sign out and back in
        (or wait for their session to refresh) before the change takes effect.
      </p>
      <form class="flex flex-wrap items-center gap-2" @submit.prevent="grant">
        <input
          v-model="grantUid"
          type="text"
          placeholder="user uid"
          class="w-72 rounded-full border border-border bg-surface px-4 py-2 text-sm text-text outline-none focus:border-primary"
        />
        <button
          type="submit"
          :disabled="granting || !grantUid.trim()"
          class="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
        >
          <UserPlus class="h-4 w-4" />
          {{ granting ? 'Granting...' : 'Grant access' }}
        </button>
      </form>
      <p v-if="grantError" class="mt-2 text-xs text-danger">{{ grantError }}</p>
    </div>

    <div v-if="error" class="rounded-xl bg-danger-light px-4 py-3 text-sm text-danger dark:bg-danger/15">
      {{ error }}
    </div>
    <div v-if="revokeError" class="rounded-xl bg-danger-light px-4 py-3 text-sm text-danger dark:bg-danger/15">
      {{ revokeError }}
    </div>

    <div class="overflow-x-auto rounded-2xl bg-surface shadow-[0_1px_2px_rgba(16,24,40,0.04),0_1px_3px_rgba(16,24,40,0.06)] dark:border dark:border-border">
      <div class="grid min-w-[860px] grid-cols-[1.4fr_1fr_1fr_1.2fr_1fr] gap-4 border-b border-border px-6 py-3 text-xs font-medium tracking-wide text-hint uppercase">
        <span>Admin</span>
        <span>Source</span>
        <span>Granted by</span>
        <span>Granted at</span>
        <span></span>
      </div>

      <div v-if="loading" class="px-6 py-10 text-center text-sm text-hint">Loading admins...</div>
      <div v-else-if="admins.length === 0" class="px-6 py-10 text-center text-sm text-hint">No admins found.</div>
      <template v-else>
        <div
          v-for="admin in admins"
          :key="admin.uid"
          class="grid min-w-[860px] grid-cols-[1.4fr_1fr_1fr_1.2fr_1fr] items-center gap-4 border-b border-border px-6 py-3 text-sm last:border-b-0"
        >
          <div class="min-w-0">
            <p class="truncate text-text">{{ displayName(admin) }}</p>
            <p class="truncate font-mono text-xs text-hint" :title="admin.uid">{{ admin.uid }}</p>
          </div>
          <span>
            <StatusBadge
              :label="admin.source === 'env' ? 'Static (server config)' : 'Granted'"
              :variant="admin.source === 'env' ? 'neutral' : 'info'"
            />
          </span>
          <span class="truncate text-text-secondary">{{ admin.grantedByEmail || '-' }}</span>
          <span class="text-hint">{{ admin.grantedAt ? formatDateTime(admin.grantedAt) : '-' }}</span>
          <span class="flex justify-end">
            <span v-if="admin.source === 'env'" class="text-xs text-hint" title="Can only be changed via server configuration">
              <ShieldCheck class="h-4 w-4" />
            </span>
            <span v-else-if="admin.uid === auth.user?.uid" class="text-xs text-hint" title="You can't revoke your own access">
              -
            </span>
            <button
              v-else
              type="button"
              :disabled="revokingUid === admin.uid"
              class="inline-flex items-center gap-1.5 rounded-full border border-danger/30 px-3 py-1.5 text-xs font-medium text-danger transition hover:bg-danger-light disabled:opacity-50"
              @click="revoke(admin.uid)"
            >
              <ShieldOff class="h-3.5 w-3.5" />
              {{ revokingUid === admin.uid ? 'Revoking...' : 'Revoke' }}
            </button>
          </span>
        </div>
      </template>
    </div>
  </div>
</template>
