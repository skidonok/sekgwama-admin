import { createRouter, createWebHistory } from 'vue-router'

import { useAuthStore } from '../stores/auth'

const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/LoginView.vue'),
    meta: { public: true },
  },
  {
    path: '/',
    component: () => import('../layouts/AdminLayout.vue'),
    children: [
      {
        path: '',
        name: 'dashboard',
        component: () => import('../views/DashboardView.vue'),
        meta: { title: 'Dashboard' },
      },
      {
        path: 'fraud-reports',
        name: 'fraud-reports',
        component: () => import('../views/FraudReportsView.vue'),
        meta: { title: 'Fraud Reports' },
      },
      {
        path: 'fraud-reports/:uid/:reportId',
        name: 'fraud-report-detail',
        component: () => import('../views/FraudReportDetailView.vue'),
        props: true,
        meta: { title: 'Fraud Report' },
      },
      {
        path: 'support-chat',
        name: 'support-chat',
        component: () => import('../views/SupportChatView.vue'),
        meta: { title: 'Support Chat' },
      },
      {
        path: 'support-chat/:uid',
        name: 'support-chat-thread',
        component: () => import('../views/SupportChatThreadView.vue'),
        props: true,
        meta: { title: 'Support Chat' },
      },
      {
        path: 'audit-log',
        name: 'audit-log',
        component: () => import('../views/AuditLogView.vue'),
        meta: { title: 'Audit Log' },
      },
      {
        path: 'transactions',
        name: 'transactions',
        component: () => import('../views/TransactionsView.vue'),
        meta: { title: 'Transactions' },
      },
      {
        path: 'transactions/:uid/:paymentId',
        name: 'transaction-detail',
        component: () => import('../views/TransactionDetailView.vue'),
        props: true,
        meta: { title: 'Transaction' },
      },
      {
        path: 'users',
        name: 'users',
        component: () => import('../views/UsersView.vue'),
        meta: { title: 'Users' },
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()

  // bootstrap() only does real work the first time (status starts 'idle');
  // subsequent navigations see it already settled.
  if (auth.status === 'idle') {
    await auth.bootstrap()
  } else if (auth.status === 'checking') {
    // A bootstrap triggered by a previous navigation is still in flight -
    // there's no store-level "wait for it" primitive here, so just proceed;
    // isAuthenticated will already reflect the outcome by the next guard run.
  }

  if (to.meta.public) {
    if (auth.isAuthenticated && to.name === 'login') {
      return { name: 'dashboard' }
    }
    return true
  }

  if (!auth.isAuthenticated) {
    return { name: 'login' }
  }

  return true
})

export default router
