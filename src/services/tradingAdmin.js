import { api } from './api'

export const getPositions = (uid) => api.get(`/trading/admin/${uid}/positions`).then((r) => r.data.data)

export const getOrderHistory = (uid, { limit } = {}) =>
  api.get(`/trading/admin/${uid}/orders`, { params: { limit } }).then((r) => r.data.data)

export const listAllOrders = ({ limit, cursor } = {}) =>
  api.get('/trading/admin/orders', { params: { limit, cursor } }).then((r) => r.data.data)

export const getOrder = (uid, orderId) => api.get(`/trading/admin/${uid}/orders/${orderId}`).then((r) => r.data.data)
