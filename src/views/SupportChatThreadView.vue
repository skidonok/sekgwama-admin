<script setup>
import { ArrowLeft } from 'lucide-vue-next'
import { onMounted, ref } from 'vue'

import ChatBubble from '../components/ChatBubble.vue'
import UserIdentity from '../components/UserIdentity.vue'
import { getErrorMessage } from '../services/api'
import { listSupportMessages, sendSupportMessage } from '../services/supportChat'

const props = defineProps({
  uid: { type: String, required: true },
})

const messages = ref([])
const loading = ref(true)
const error = ref('')

const replyBody = ref('')
const sending = ref(false)
const sendError = ref('')

const load = async () => {
  loading.value = true
  error.value = ''
  try {
    messages.value = await listSupportMessages(props.uid)
  } catch (err) {
    error.value = getErrorMessage(err)
  } finally {
    loading.value = false
  }
}

const sendReply = async () => {
  const body = replyBody.value.trim()
  if (!body || sending.value) return
  sending.value = true
  sendError.value = ''
  try {
    const message = await sendSupportMessage(props.uid, body)
    messages.value.push(message)
    replyBody.value = ''
  } catch (err) {
    sendError.value = getErrorMessage(err)
  } finally {
    sending.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="flex flex-col gap-4">
    <router-link
      :to="{ name: 'support-chat' }"
      class="inline-flex w-fit items-center gap-1.5 text-sm text-text-secondary transition hover:text-text"
    >
      <ArrowLeft class="h-4 w-4" />
      Back to support chat
    </router-link>

    <div class="rounded-2xl bg-surface p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_1px_3px_rgba(16,24,40,0.06)] dark:border dark:border-border">
      <UserIdentity :uid="uid" />
    </div>

    <div v-if="error" class="rounded-xl bg-danger-light px-4 py-3 text-sm text-danger dark:bg-danger/15">
      {{ error }}
    </div>

    <div class="rounded-2xl bg-surface p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_1px_3px_rgba(16,24,40,0.06)] dark:border dark:border-border">
      <div v-if="loading" class="py-10 text-center text-sm text-hint">Loading messages...</div>
      <template v-else>
        <div class="thin-scrollbar flex max-h-[28rem] flex-col gap-3 overflow-y-auto pr-1">
          <p v-if="messages.length === 0" class="text-center text-sm text-hint">No messages yet.</p>
          <ChatBubble
            v-for="(message, idx) in messages"
            :key="message.id || idx"
            :sender="message.sender"
            :body="message.body"
            :created-at="message.createdAt"
          />
        </div>

        <form class="mt-4 flex flex-col gap-2 border-t border-border pt-4" @submit.prevent="sendReply">
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
      </template>
    </div>
  </div>
</template>
