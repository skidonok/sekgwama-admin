import { api } from './api'

export const listBankAccounts = (uid) => api.get(`/bank-accounts/admin/${uid}`).then((r) => r.data.data)
