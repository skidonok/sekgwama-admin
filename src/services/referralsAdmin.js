import { api } from './api'

export const getReferralSummary = (uid) => api.get(`/referrals/admin/${uid}`).then((r) => r.data.data)
