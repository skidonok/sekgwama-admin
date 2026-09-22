<script setup>
import { ArrowLeft, ExternalLink, Receipt, ShieldCheck, ShieldOff } from 'lucide-vue-next'
import { onMounted, ref } from 'vue'

import StatusBadge from '../components/StatusBadge.vue'
import { getErrorMessage } from '../services/api'
import { grantAdminAccess, listAdmins, revokeAdminAccess } from '../services/adminAccess'
import { listBankAccounts } from '../services/bankAccountsAdmin'
import { listGoals } from '../services/goalsAdmin'
import { getOnboardingDraft, getDocumentUrl } from '../services/onboardingAdmin'
import { getReferralSummary } from '../services/referralsAdmin'
import { getOrderHistory, getPositions } from '../services/tradingAdmin'
import { getUser } from '../services/users'
import { useAuthStore } from '../stores/auth'
import { onboardingStatusLabel, onboardingStatusVariant, orderStatusLabel, orderStatusVariant } from '../utils/badges'
import { formatAmount, formatDate, formatDateTime } from '../utils/format'

const auth = useAuthStore()

const props = defineProps({
  uid: { type: String, required: true },
})

const profile = ref(null)
const profileLoading = ref(true)
const profileError = ref('')

// Each section tracks its own loading/error/data so one failing or empty
// section (e.g. a user who never started onboarding) doesn't blank the rest
// of the page.
const makeSection = () => ref({ loading: true, error: '', data: null })
const onboarding = makeSection()
const bankAccounts = makeSection()
const goals = makeSection()
const referrals = makeSection()
const positions = makeSection()
const orders = makeSection()
const adminAccess = makeSection()

const documentUrlLoading = ref(null) // documentType currently being fetched, or null
const documentUrlError = ref('')

const adminActionLoading = ref(false)
const adminActionError = ref('')

// listAdmins() returns every admin, not just this uid - the admin panel has
// no single-uid lookup endpoint since the underlying list is small (env
// allowlist + a handful of Firestore grants), so filtering client-side here
// avoids adding one just for this.
const loadAdminAccess = async () => {
  await loadSection(adminAccess, async () => {
    const admins = await listAdmins()
    return admins.find((admin) => admin.uid === props.uid) || null
  })
}

const grantAccess = async () => {
  if (adminActionLoading.value) return
  adminActionLoading.value = true
  adminActionError.value = ''
  try {
    await grantAdminAccess(props.uid)
    await loadAdminAccess()
  } catch (err) {
    adminActionError.value = getErrorMessage(err)
  } finally {
    adminActionLoading.value = false
  }
}

const revokeAccess = async () => {
  if (adminActionLoading.value) return
  adminActionLoading.value = true
  adminActionError.value = ''
  try {
    await revokeAdminAccess(props.uid)
    await loadAdminAccess()
  } catch (err) {
    adminActionError.value = getErrorMessage(err)
  } finally {
    adminActionLoading.value = false
  }
}

const loadSection = async (section, fetcher) => {
  section.value = { loading: true, error: '', data: null }
  try {
    section.value = { loading: false, error: '', data: await fetcher() }
  } catch (err) {
    section.value = { loading: false, error: getErrorMessage(err), data: null }
  }
}

const viewDocument = async (documentType) => {
  if (documentUrlLoading.value) return
  documentUrlLoading.value = documentType
  documentUrlError.value = ''
  try {
    const { url } = await getDocumentUrl(props.uid, documentType)
    window.open(url, '_blank', 'noopener')
  } catch (err) {
    documentUrlError.value = getErrorMessage(err)
  } finally {
    documentUrlLoading.value = null
  }
}

const documentTypeLabel = (type) =>
  ({
    identity_verification: 'Identity document',
    address_verification: 'Proof of address',
    date_of_birth_verification: 'Date of birth document',
    tax_id_verification: 'Tax ID document',
  })[type] || type

const agreementLabel = (type) =>
  ({
    customer_agreement: 'Customer agreement',
    account_agreement: 'Account agreement',
    margin_agreement: 'Margin agreement',
  })[type] || type

const load = async () => {
  profileLoading.value = true
  profileError.value = ''
  try {
    profile.value = await getUser(props.uid)
  } catch (err) {
    profileError.value = getErrorMessage(err)
  } finally {
    profileLoading.value = false
  }

  loadSection(onboarding, () => getOnboardingDraft(props.uid))
  loadSection(bankAccounts, () => listBankAccounts(props.uid))
  loadSection(goals, () => listGoals(props.uid))
  loadSection(referrals, () => getReferralSummary(props.uid))
  loadSection(positions, () => getPositions(props.uid))
  loadSection(orders, () => getOrderHistory(props.uid, { limit: 20 }))
  loadAdminAccess()
}

const displayName = (user) => [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email

onMounted(load)
</script>

<template>
  <div class="flex flex-col gap-4">
    <router-link :to="{ name: 'users' }" class="inline-flex w-fit items-center gap-1.5 text-sm text-text-secondary transition hover:text-text">
      <ArrowLeft class="h-4 w-4" />
      Back to users
    </router-link>

    <div v-if="profileError" class="rounded-xl bg-danger-light px-4 py-3 text-sm text-danger dark:bg-danger/15">
      {{ profileError }}
    </div>
    <div v-if="profileLoading" class="rounded-2xl bg-surface p-6 text-center text-sm text-hint dark:border dark:border-border">
      Loading user...
    </div>

    <template v-else-if="profile">
      <div class="rounded-2xl bg-surface p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_1px_3px_rgba(16,24,40,0.06)] dark:border dark:border-border">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 class="text-xl font-semibold text-text">{{ displayName(profile) }}</h2>
            <p class="text-sm text-text-secondary">{{ profile.email }}</p>
            <p v-if="profile.phone" class="text-sm text-hint">{{ profile.phone }}</p>
          </div>
          <div class="flex flex-col items-end gap-1.5">
            <StatusBadge :label="onboardingStatusLabel(profile.onboardingStatus)" :variant="onboardingStatusVariant(profile.onboardingStatus)" />
            <span class="text-xs text-hint">Joined {{ formatDate(profile.createdAt) }}</span>
          </div>
        </div>
        <dl class="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-border pt-4 text-sm sm:grid-cols-4">
          <div>
            <dt class="text-xs text-hint">UID</dt>
            <dd class="truncate font-mono text-xs text-text" :title="profile.uid">{{ profile.uid }}</dd>
          </div>
          <div v-if="profile.alpacaAccountId">
            <dt class="text-xs text-hint">Alpaca account</dt>
            <dd class="truncate font-mono text-xs text-text" :title="profile.alpacaAccountId">{{ profile.alpacaAccountId }}</dd>
          </div>
          <div v-if="profile.alpacaAccountStatus">
            <dt class="text-xs text-hint">Alpaca status</dt>
            <dd class="text-text">{{ profile.alpacaAccountStatus }}</dd>
          </div>
        </dl>
        <div class="mt-4 flex flex-wrap items-center gap-4">
          <router-link
            :to="{ name: 'transactions', query: { uid: profile.uid } }"
            class="inline-flex w-fit items-center gap-1.5 text-xs text-primary underline hover:opacity-80"
          >
            <Receipt class="h-3.5 w-3.5" />
            View all transactions for this user
          </router-link>

          <span v-if="adminAccess.loading" class="text-xs text-hint">Checking admin access...</span>
          <span v-else-if="adminAccess.error" class="text-xs text-danger">{{ adminAccess.error }}</span>
          <template v-else-if="adminAccess.data">
            <StatusBadge
              :label="adminAccess.data.source === 'env' ? 'Admin (static)' : 'Admin (granted)'"
              variant="info"
            />
            <button
              v-if="adminAccess.data.source === 'firestore' && profile.uid !== auth.user?.uid"
              type="button"
              :disabled="adminActionLoading"
              class="inline-flex items-center gap-1.5 rounded-full border border-danger/30 px-3 py-1.5 text-xs font-medium text-danger transition hover:bg-danger-light disabled:opacity-50"
              @click="revokeAccess"
            >
              <ShieldOff class="h-3.5 w-3.5" />
              {{ adminActionLoading ? 'Revoking...' : 'Revoke admin access' }}
            </button>
          </template>
          <button
            v-else
            type="button"
            :disabled="adminActionLoading"
            class="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-text transition hover:bg-black/5 disabled:opacity-50 dark:hover:bg-white/10"
            @click="grantAccess"
          >
            <ShieldCheck class="h-3.5 w-3.5" />
            {{ adminActionLoading ? 'Granting...' : 'Grant admin access' }}
          </button>
          <span v-if="adminActionError" class="text-xs text-danger">{{ adminActionError }}</span>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <!-- KYC & Onboarding -->
        <div class="rounded-2xl bg-surface p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_1px_3px_rgba(16,24,40,0.06)] dark:border dark:border-border lg:col-span-2">
          <h3 class="mb-3 text-sm font-semibold text-text">KYC &amp; onboarding</h3>
          <p class="mb-3 text-xs text-hint">
            Approval happens on Alpaca's side, not here - this is a read-only view of what was submitted.
          </p>
          <div v-if="onboarding.loading" class="text-sm text-hint">Loading...</div>
          <div v-else-if="onboarding.error" class="text-sm text-danger">{{ onboarding.error }}</div>
          <div v-else-if="!onboarding.data?.draft" class="text-sm text-hint">This user hasn't started onboarding yet.</div>
          <div v-else class="flex flex-col gap-4">
            <dl class="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-4">
              <div v-if="onboarding.data.draft.contact">
                <dt class="text-xs text-hint">Contact</dt>
                <dd class="text-text">
                  {{ onboarding.data.draft.contact.city }}, {{ onboarding.data.draft.contact.country }}
                </dd>
              </div>
              <div v-if="onboarding.data.draft.identity">
                <dt class="text-xs text-hint">Legal name</dt>
                <dd class="text-text">{{ onboarding.data.draft.identity.givenName }} {{ onboarding.data.draft.identity.familyName }}</dd>
              </div>
              <div v-if="onboarding.data.draft.identity">
                <dt class="text-xs text-hint">Date of birth</dt>
                <dd class="text-text">{{ onboarding.data.draft.identity.dateOfBirth }}</dd>
              </div>
              <div v-if="onboarding.data.draft.identity">
                <dt class="text-xs text-hint">Citizenship</dt>
                <dd class="text-text">{{ onboarding.data.draft.identity.countryOfCitizenship }}</dd>
              </div>
            </dl>

            <div v-if="onboarding.data.draft.disclosures">
              <p class="mb-1.5 text-xs text-hint">Disclosures</p>
              <div class="flex flex-wrap gap-1.5">
                <StatusBadge
                  v-if="onboarding.data.draft.disclosures.isControlPerson"
                  label="Control person"
                  variant="warning"
                />
                <StatusBadge
                  v-if="onboarding.data.draft.disclosures.isAffiliatedExchangeOrFinra"
                  label="Exchange/FINRA affiliated"
                  variant="warning"
                />
                <StatusBadge
                  v-if="onboarding.data.draft.disclosures.isPoliticallyExposed"
                  label="Politically exposed"
                  variant="warning"
                />
                <StatusBadge
                  v-if="onboarding.data.draft.disclosures.immediateFamilyExposed"
                  label="Family politically exposed"
                  variant="warning"
                />
                <span
                  v-if="!Object.values(onboarding.data.draft.disclosures).some(Boolean)"
                  class="text-xs text-hint"
                >
                  None flagged
                </span>
              </div>
            </div>

            <div v-if="onboarding.data.draft.agreements && Object.keys(onboarding.data.draft.agreements).length">
              <p class="mb-1.5 text-xs text-hint">Agreements accepted</p>
              <ul class="flex flex-col gap-1 text-sm text-text">
                <li v-for="(agreement, type) in onboarding.data.draft.agreements" :key="type">
                  {{ agreementLabel(type) }} - {{ formatDateTime(agreement.acceptedAt) }}
                </li>
              </ul>
            </div>

            <div v-if="onboarding.data.draft.documents?.length">
              <p class="mb-1.5 text-xs text-hint">Documents</p>
              <ul class="flex flex-col gap-1.5">
                <li v-for="doc in onboarding.data.draft.documents" :key="doc.documentType" class="flex items-center gap-2 text-sm">
                  <span class="text-text">{{ documentTypeLabel(doc.documentType) }}</span>
                  <span class="text-xs text-hint">({{ formatDate(doc.uploadedAt) }})</span>
                  <button
                    type="button"
                    :disabled="documentUrlLoading === doc.documentType"
                    class="inline-flex items-center gap-1 text-xs text-primary underline hover:opacity-80 disabled:opacity-50"
                    @click="viewDocument(doc.documentType)"
                  >
                    <ExternalLink class="h-3 w-3" />
                    {{ documentUrlLoading === doc.documentType ? 'Loading...' : 'View' }}
                  </button>
                </li>
              </ul>
              <p v-if="documentUrlError" class="mt-1.5 text-xs text-danger">{{ documentUrlError }}</p>
            </div>
          </div>
        </div>

        <!-- Bank accounts -->
        <div class="rounded-2xl bg-surface p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_1px_3px_rgba(16,24,40,0.06)] dark:border dark:border-border">
          <h3 class="mb-3 text-sm font-semibold text-text">Bank accounts</h3>
          <div v-if="bankAccounts.loading" class="text-sm text-hint">Loading...</div>
          <div v-else-if="bankAccounts.error" class="text-sm text-danger">{{ bankAccounts.error }}</div>
          <div v-else-if="!bankAccounts.data?.length" class="text-sm text-hint">No linked bank accounts.</div>
          <ul v-else class="flex flex-col gap-2">
            <li v-for="account in bankAccounts.data" :key="account.id" class="flex items-center justify-between text-sm">
              <span class="text-text">{{ account.accountHolderName }} - {{ account.bankId }}</span>
              <span class="font-mono text-xs text-hint">****{{ account.last4 }}</span>
            </li>
          </ul>
        </div>

        <!-- Goals -->
        <div class="rounded-2xl bg-surface p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_1px_3px_rgba(16,24,40,0.06)] dark:border dark:border-border">
          <h3 class="mb-3 text-sm font-semibold text-text">Investment goals</h3>
          <div v-if="goals.loading" class="text-sm text-hint">Loading...</div>
          <div v-else-if="goals.error" class="text-sm text-danger">{{ goals.error }}</div>
          <div v-else-if="!goals.data?.length" class="text-sm text-hint">No goals set.</div>
          <ul v-else class="flex flex-col gap-2">
            <li v-for="goal in goals.data" :key="goal.id" class="flex items-center justify-between text-sm">
              <span class="text-text">{{ goal.title }}</span>
              <span class="text-hint">
                {{ formatAmount(goal.saved, 'USD') }} / {{ formatAmount(goal.target, 'USD') }}
                <StatusBadge v-if="goal.completedAt" label="Completed" variant="success" />
              </span>
            </li>
          </ul>
        </div>

        <!-- Referrals -->
        <div class="rounded-2xl bg-surface p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_1px_3px_rgba(16,24,40,0.06)] dark:border dark:border-border">
          <h3 class="mb-3 text-sm font-semibold text-text">Referrals</h3>
          <div v-if="referrals.loading" class="text-sm text-hint">Loading...</div>
          <div v-else-if="referrals.error" class="text-sm text-danger">{{ referrals.error }}</div>
          <template v-else-if="referrals.data">
            <dl class="mb-3 grid grid-cols-3 gap-3 text-sm">
              <div>
                <dt class="text-xs text-hint">Code</dt>
                <dd class="font-mono text-text">{{ referrals.data.referralCode }}</dd>
              </div>
              <div>
                <dt class="text-xs text-hint">Points</dt>
                <dd class="text-text">{{ referrals.data.points }}</dd>
              </div>
              <div>
                <dt class="text-xs text-hint">Referred</dt>
                <dd class="text-text">{{ referrals.data.referredCount }}</dd>
              </div>
            </dl>
            <ul v-if="referrals.data.referrals.length" class="flex flex-col gap-1.5">
              <li v-for="ref in referrals.data.referrals" :key="ref.refereeUid" class="flex items-center justify-between text-sm">
                <span class="text-text">{{ ref.refereeName }}</span>
                <span class="text-xs text-hint">+{{ ref.pointsAwarded }} pts - {{ formatDate(ref.createdAt) }}</span>
              </li>
            </ul>
            <p v-else class="text-sm text-hint">Hasn't referred anyone yet.</p>
          </template>
        </div>

        <!-- Trading -->
        <div class="rounded-2xl bg-surface p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_1px_3px_rgba(16,24,40,0.06)] dark:border dark:border-border lg:col-span-2">
          <h3 class="mb-3 text-sm font-semibold text-text">Trading</h3>

          <p class="mb-1.5 text-xs text-hint">Positions</p>
          <div v-if="positions.loading" class="mb-4 text-sm text-hint">Loading...</div>
          <div v-else-if="positions.error" class="mb-4 text-sm text-danger">{{ positions.error }}</div>
          <div v-else-if="!positions.data?.length" class="mb-4 text-sm text-hint">No open positions.</div>
          <ul v-else class="mb-4 flex flex-col gap-1.5">
            <li v-for="pos in positions.data" :key="pos.symbol" class="flex items-center justify-between text-sm">
              <span class="text-text">{{ pos.symbol }} &times; {{ pos.qty }}</span>
              <span class="text-hint">${{ Number(pos.market_value).toFixed(2) }}</span>
            </li>
          </ul>

          <p class="mb-1.5 text-xs text-hint">Recent orders</p>
          <div v-if="orders.loading" class="text-sm text-hint">Loading...</div>
          <div v-else-if="orders.error" class="text-sm text-danger">{{ orders.error }}</div>
          <div v-else-if="!orders.data?.length" class="text-sm text-hint">No orders yet.</div>
          <ul v-else class="flex flex-col gap-1.5">
            <li v-for="order in orders.data" :key="order.id">
              <router-link
                :to="{ name: 'order-detail', params: { uid: profile.uid, orderId: order.id } }"
                class="flex items-center justify-between text-sm hover:text-primary"
              >
                <span class="text-text capitalize">{{ order.side }} {{ order.symbol }}</span>
                <span class="flex items-center gap-2 text-hint">
                  {{ formatDateTime(order.updatedAt) }}
                  <StatusBadge :label="orderStatusLabel(order.status)" :variant="orderStatusVariant(order.status)" />
                </span>
              </router-link>
            </li>
          </ul>
        </div>
      </div>
    </template>
  </div>
</template>
