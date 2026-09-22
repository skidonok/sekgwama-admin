import { api } from './api'

export const listWebhookDeliveries = ({ provider, limit, cursor } = {}) =>
  api.get('/admin/webhooks', { params: { provider, limit, cursor } }).then((r) => r.data.data)
