import { api } from './api'

export const listTransactions = ({ status, purpose, uid, limit, cursor } = {}) =>
  api.get('/payments/admin', { params: { status, purpose, uid, limit, cursor } }).then((r) => r.data.data)

export const getTransaction = (uid, paymentId) =>
  api.get(`/payments/admin/${uid}/${paymentId}`).then((r) => r.data.data)
