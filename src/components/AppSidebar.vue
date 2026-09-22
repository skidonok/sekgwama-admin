<script setup>
import {
  Activity,
  BookOpen,
  Flag,
  LayoutDashboard,
  LineChart,
  LogOut,
  Mail,
  MessageCircle,
  Receipt,
  ScrollText,
  ShieldAlert,
  Users,
  Webhook,
} from 'lucide-vue-next'
import { useRouter } from 'vue-router'

import icon from '../assets/icon.png'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const auth = useAuthStore()

const links = [
  { to: { name: 'dashboard' }, icon: LayoutDashboard, label: 'Dashboard' },
  { to: { name: 'status' }, icon: Activity, label: 'Status' },
  { to: { name: 'transactions' }, icon: Receipt, label: 'Transactions' },
  { to: { name: 'orders' }, icon: LineChart, label: 'Orders' },
  { to: { name: 'users' }, icon: Users, label: 'Users' },
  { to: { name: 'fraud-reports' }, icon: ShieldAlert, label: 'Fraud Reports' },
  { to: { name: 'fraud-flags' }, icon: Flag, label: 'Fraud Flags' },
  { to: { name: 'support-chat' }, icon: MessageCircle, label: 'Support Chat' },
  { to: { name: 'broadcasts' }, icon: Mail, label: 'Broadcasts' },
  { to: { name: 'academy' }, icon: BookOpen, label: 'Academy' },
  { to: { name: 'webhooks' }, icon: Webhook, label: 'Webhooks' },
  { to: { name: 'audit-log' }, icon: ScrollText, label: 'Audit Log' },
]

const handleLogout = async () => {
  await auth.logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <aside
    class="flex w-[76px] shrink-0 flex-col items-center gap-2 rounded-2xl bg-surface py-5 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_1px_3px_rgba(16,24,40,0.06)] dark:border dark:border-border"
  >
    <img :src="icon" alt="Sekgwama" class="mb-4 h-9 w-9 rounded-lg object-cover" />

    <nav class="flex flex-1 flex-col items-center gap-2">
      <router-link
        v-for="link in links"
        :key="link.label"
        v-slot="{ isExactActive, href, navigate }"
        :to="link.to"
        custom
      >
        <a
          :href="href"
          :title="link.label"
          class="group relative flex h-11 w-11 items-center justify-center rounded-xl transition"
          :class="isExactActive ? 'bg-primary text-white' : 'text-text-secondary hover:bg-black/5 dark:hover:bg-white/10'"
          @click="navigate"
        >
          <component :is="link.icon" class="h-[19px] w-[19px]" stroke-width="2" />
        </a>
      </router-link>
    </nav>

    <button
      type="button"
      title="Log out"
      class="flex h-11 w-11 items-center justify-center rounded-xl text-text-secondary transition hover:bg-danger-light hover:text-danger"
      @click="handleLogout"
    >
      <LogOut class="h-[19px] w-[19px]" stroke-width="2" />
    </button>
  </aside>
</template>
