<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import logo from '../assets/logo-white.png'
import { getErrorMessage } from '../services/api'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const auth = useAuthStore()

// 'credentials' -> email/password step
// 'mfa'         -> code input step
// 'passkey-only' -> dead end message, this account can't complete MFA here
const step = ref('credentials')

const email = ref('')
const password = ref('')
const code = ref('')

const loading = ref(false)
const error = ref('')
const notice = ref(null)

onMounted(() => {
  notice.value = auth.consumeNotice()
})

const submitCredentials = async () => {
  if (loading.value) return
  error.value = ''
  loading.value = true
  try {
    const result = await auth.login(email.value, password.value)
    if (result.mfaRequired) {
      if (result.mfaMethod === 'passkey' && !result.mfaFallback) {
        step.value = 'passkey-only'
      } else {
        step.value = 'mfa'
      }
      return
    }
    router.push({ name: 'dashboard' })
  } catch (err) {
    error.value = getErrorMessage(err)
  } finally {
    loading.value = false
  }
}

const submitMfa = async () => {
  if (loading.value) return
  error.value = ''
  loading.value = true
  try {
    await auth.verifyMfa(code.value)
    router.push({ name: 'dashboard' })
  } catch (err) {
    error.value = getErrorMessage(err)
  } finally {
    loading.value = false
  }
}

const backToCredentials = () => {
  step.value = 'credentials'
  code.value = ''
  error.value = ''
}
</script>

<template>
  <div class="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#0a0d0f] px-4 py-12">
    <div
      class="pointer-events-none absolute inset-x-0 top-0 h-[560px] bg-[radial-gradient(ellipse_at_top,_rgba(0,155,180,0.35),_transparent_70%)]"
    />

    <div class="relative w-full max-w-sm">
      <div class="mb-8 flex flex-col items-center gap-3">
        <img :src="logo" alt="Sekgwama" class="h-20 w-20 object-contain" />
        <h1 class="text-xl font-semibold text-white">Sekgwama Admin</h1>
        <p class="text-sm text-white/50">Sign in to the internal ops console</p>
      </div>

      <div class="rounded-3xl bg-white/[0.04] p-8 shadow-2xl ring-1 ring-white/10 backdrop-blur">
        <div v-if="notice" class="mb-5 rounded-2xl bg-warning/10 px-4 py-3 text-sm text-warning ring-1 ring-warning/20">
          {{ notice }}
        </div>
        <div v-if="error" class="mb-5 rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger ring-1 ring-danger/20">
          {{ error }}
        </div>

        <form v-if="step === 'credentials'" class="flex flex-col gap-3" @submit.prevent="submitCredentials">
          <input
            v-model="email"
            type="email"
            autocomplete="username"
            required
            aria-label="Email address"
            placeholder="Email address"
            class="w-full rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/30"
          />
          <input
            v-model="password"
            type="password"
            autocomplete="current-password"
            required
            aria-label="Password"
            placeholder="Password"
            class="w-full rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/30"
          />
          <button
            type="submit"
            :disabled="loading"
            class="mt-2 w-full rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {{ loading ? 'Signing in...' : 'Sign in' }}
          </button>
        </form>

        <form v-else-if="step === 'mfa'" class="flex flex-col gap-3" @submit.prevent="submitMfa">
          <p class="mb-1 text-center text-sm text-white/60">Enter the verification code for your account</p>
          <input
            v-model="code"
            type="text"
            inputmode="numeric"
            autocomplete="one-time-code"
            required
            aria-label="Verification code"
            placeholder="Verification code"
            class="w-full rounded-full border border-white/10 bg-white/5 px-5 py-3 text-center text-sm tracking-[0.3em] text-white placeholder-white/30 outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/30"
          />
          <button
            type="submit"
            :disabled="loading"
            class="mt-2 w-full rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {{ loading ? 'Verifying...' : 'Verify' }}
          </button>
          <button
            type="button"
            class="mt-1 w-full text-center text-xs text-white/40 transition hover:text-white/70"
            @click="backToCredentials"
          >
            Back to sign in
          </button>
        </form>

        <div v-else-if="step === 'passkey-only'" class="flex flex-col gap-4">
          <p class="text-center text-sm leading-relaxed text-white/70">
            This account is protected by a passkey, and passkey sign-in isn't available in this browser console yet.
            Use the mobile app to sign in, or ask another admin for access.
          </p>
          <button
            type="button"
            class="w-full rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10"
            @click="backToCredentials"
          >
            Back to sign in
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
