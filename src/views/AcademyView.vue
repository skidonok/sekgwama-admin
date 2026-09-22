<script setup>
import { onMounted, ref } from 'vue'

import { getErrorMessage } from '../services/api'
import { listAiBuddyWaitlist, listSubjects } from '../services/academyAdmin'
import { formatDateTime } from '../utils/format'

const subjects = ref([])
const subjectsLoading = ref(true)
const subjectsError = ref('')

const waitlist = ref([])
const waitlistLoading = ref(true)
const waitlistError = ref('')

const load = async () => {
  subjectsLoading.value = true
  subjectsError.value = ''
  try {
    subjects.value = await listSubjects()
  } catch (err) {
    subjectsError.value = getErrorMessage(err)
  } finally {
    subjectsLoading.value = false
  }

  waitlistLoading.value = true
  waitlistError.value = ''
  try {
    waitlist.value = await listAiBuddyWaitlist()
  } catch (err) {
    waitlistError.value = getErrorMessage(err)
  } finally {
    waitlistLoading.value = false
  }
}

const displayName = (user) => [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email

onMounted(load)
</script>

<template>
  <div class="flex flex-col gap-4">
    <p class="text-sm text-hint">
      Content is seed-managed via <code class="text-xs">scripts/seedAcademyContent.ts</code>, not edited here - this
      is a read-only view of what's currently published.
    </p>

    <div class="rounded-2xl bg-surface p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_1px_3px_rgba(16,24,40,0.06)] dark:border dark:border-border">
      <h3 class="mb-3 text-sm font-semibold text-text">Subjects</h3>
      <div v-if="subjectsError" class="rounded-xl bg-danger-light px-4 py-3 text-sm text-danger dark:bg-danger/15">
        {{ subjectsError }}
      </div>
      <div v-if="subjectsLoading" class="text-sm text-hint">Loading subjects...</div>
      <div v-else-if="subjects.length === 0" class="text-sm text-hint">No subjects published yet.</div>
      <div v-else class="overflow-x-auto">
        <div class="grid min-w-[700px] grid-cols-[1.6fr_1fr_1fr_0.8fr_0.8fr] gap-4 border-b border-border px-2 py-2 text-xs font-medium tracking-wide text-hint uppercase">
          <span>Title</span>
          <span>Level</span>
          <span>Category</span>
          <span>Lessons</span>
          <span>Quiz</span>
        </div>
        <div
          v-for="subject in subjects"
          :key="subject.id"
          class="grid min-w-[700px] grid-cols-[1.6fr_1fr_1fr_0.8fr_0.8fr] items-center gap-4 border-b border-border px-2 py-3 text-sm last:border-b-0"
        >
          <span class="text-text">{{ subject.title }}</span>
          <span class="text-text-secondary">{{ subject.level }}</span>
          <span class="text-text-secondary">{{ subject.category }}</span>
          <span class="text-text-secondary">{{ subject.lessons?.length ?? 0 }}</span>
          <span class="text-text-secondary">{{ subject.quiz?.length ?? 0 }}</span>
        </div>
      </div>
    </div>

    <div class="rounded-2xl bg-surface p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_1px_3px_rgba(16,24,40,0.06)] dark:border dark:border-border">
      <h3 class="mb-3 text-sm font-semibold text-text">AI Buddy waitlist</h3>
      <div v-if="waitlistError" class="rounded-xl bg-danger-light px-4 py-3 text-sm text-danger dark:bg-danger/15">
        {{ waitlistError }}
      </div>
      <div v-if="waitlistLoading" class="text-sm text-hint">Loading waitlist...</div>
      <div v-else-if="waitlist.length === 0" class="text-sm text-hint">No one has joined the waitlist yet.</div>
      <ul v-else class="flex flex-col gap-2">
        <li v-for="user in waitlist" :key="user.uid" class="flex items-center justify-between text-sm">
          <span class="text-text">{{ displayName(user) }}</span>
          <span class="text-hint">{{ formatDateTime(user.waitlistedAt) }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>
