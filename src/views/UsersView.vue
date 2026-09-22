<script setup>
import { Receipt, Search } from 'lucide-vue-next'
import { onMounted, ref } from 'vue'

import StatusBadge from '../components/StatusBadge.vue'
import { getErrorMessage } from '../services/api'
import { getUser, listUsers } from '../services/users'
import { onboardingStatusLabel, onboardingStatusVariant } from '../utils/badges'
import { formatDate } from '../utils/format'

const PAGE_SIZE = 50

const users = ref([])
const loading = ref(true)
const loadingMore = ref(false)
const error = ref('')
const cursor = ref(undefined)
const hasMore = ref(false)

const uidLookup = ref('')
const lookupLoading = ref(false)
const lookupError = ref('')

const load = async () => {
  loading.value = true
  error.value = ''
  try {
    const page = await listUsers({ pageSize: PAGE_SIZE })
    users.value = page.users
    cursor.value = page.nextCursor
    hasMore.value = !!page.nextCursor
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
    const page = await listUsers({ pageSize: PAGE_SIZE, cursor: cursor.value })
    users.value = users.value.concat(page.users)
    cursor.value = page.nextCursor
    hasMore.value = !!page.nextCursor
  } catch (err) {
    error.value = getErrorMessage(err)
  } finally {
    loadingMore.value = false
  }
}

// A direct uid lookup rather than a search box - the user directory below
// is ordered by uid, not indexed for name/email search, same limitation
// UserIdentity's cache already lives with elsewhere in the admin panel.
const lookupByUid = async () => {
  const uid = uidLookup.value.trim()
  if (!uid || lookupLoading.value) return
  lookupLoading.value = true
  lookupError.value = ''
  try {
    const user = await getUser(uid)
    users.value = [user]
    hasMore.value = false
  } catch (err) {
    lookupError.value = getErrorMessage(err)
  } finally {
    lookupLoading.value = false
  }
}

const clearLookup = () => {
  uidLookup.value = ''
  lookupError.value = ''
  load()
}

const displayName = (user) => [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email

onMounted(load)
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex flex-wrap items-end gap-3">
      <form class="flex flex-col gap-1" @submit.prevent="lookupByUid">
        <label for="user-uid" class="text-xs font-medium text-hint">Jump to user by UID</label>
        <div class="flex items-center gap-2">
          <input
            id="user-uid"
            v-model="uidLookup"
            type="text"
            placeholder="uid"
            class="w-64 rounded-full border border-border bg-surface px-4 py-2 text-sm text-text outline-none focus:border-primary"
          />
          <button
            type="submit"
            :disabled="lookupLoading || !uidLookup.trim()"
            class="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
          >
            <Search class="h-4 w-4" />
            {{ lookupLoading ? 'Searching...' : 'Find' }}
          </button>
          <button
            v-if="uidLookup"
            type="button"
            class="text-xs text-hint underline hover:text-text"
            @click="clearLookup"
          >
            Clear
          </button>
        </div>
        <p v-if="lookupError" class="text-xs text-danger">{{ lookupError }}</p>
      </form>
    </div>

    <div v-if="error" class="rounded-xl bg-danger-light px-4 py-3 text-sm text-danger dark:bg-danger/15">
      {{ error }}
    </div>

    <div class="overflow-x-auto rounded-2xl bg-surface shadow-[0_1px_2px_rgba(16,24,40,0.04),0_1px_3px_rgba(16,24,40,0.06)] dark:border dark:border-border">
      <div class="grid min-w-[760px] grid-cols-[1.6fr_1.3fr_1fr_1fr_0.6fr] gap-4 border-b border-border px-6 py-3 text-xs font-medium tracking-wide text-hint uppercase">
        <span>Name</span>
        <span>Email</span>
        <span>Onboarding</span>
        <span>Joined</span>
        <span></span>
      </div>

      <div v-if="loading" class="px-6 py-10 text-center text-sm text-hint">Loading users...</div>
      <div v-else-if="users.length === 0" class="px-6 py-10 text-center text-sm text-hint">No users found.</div>
      <template v-else>
        <div
          v-for="user in users"
          :key="user.uid"
          class="grid min-w-[760px] cursor-pointer grid-cols-[1.6fr_1.3fr_1fr_1fr_0.6fr] items-center gap-4 border-b border-border px-6 py-3 text-sm last:border-b-0 hover:bg-black/[0.02] dark:hover:bg-white/[0.03]"
          @click="$router.push({ name: 'user-detail', params: { uid: user.uid } })"
        >
          <span class="truncate text-text">{{ displayName(user) }}</span>
          <span class="truncate text-text-secondary">{{ user.email }}</span>
          <span>
            <StatusBadge :label="onboardingStatusLabel(user.onboardingStatus)" :variant="onboardingStatusVariant(user.onboardingStatus)" />
          </span>
          <span class="text-hint">{{ formatDate(user.createdAt) }}</span>
          <router-link
            :to="{ name: 'transactions', query: { uid: user.uid } }"
            title="View transactions"
            class="inline-flex w-fit items-center gap-1.5 text-xs text-primary underline hover:opacity-80"
            @click.stop
          >
            <Receipt class="h-3.5 w-3.5" />
            Transactions
          </router-link>
        </div>
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
