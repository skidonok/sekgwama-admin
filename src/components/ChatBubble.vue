<script setup>
import { computed } from 'vue'

import { formatDateTime } from '../utils/format'

const props = defineProps({
  sender: { type: String, required: true }, // 'user' | 'support'
  body: { type: String, required: true },
  createdAt: { type: String, default: null },
})

const isSupport = computed(() => props.sender === 'support')
</script>

<template>
  <div class="flex" :class="isSupport ? 'justify-end' : 'justify-start'">
    <div class="max-w-[75%]">
      <div
        class="rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words"
        :class="
          isSupport
            ? 'rounded-br-sm bg-primary text-white'
            : 'rounded-bl-sm bg-black/5 text-text dark:bg-white/[0.06]'
        "
      >
        {{ body }}
      </div>
      <p
        class="mt-1 text-[11px] text-hint"
        :class="isSupport ? 'text-right' : 'text-left'"
      >
        {{ isSupport ? 'Support' : 'User' }} &middot; {{ formatDateTime(createdAt) }}
      </p>
    </div>
  </div>
</template>
