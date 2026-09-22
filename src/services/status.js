import { api } from './api'

export const getHealth = () => api.get('/admin/status/health').then((r) => r.data.data)

export const getErrors = ({ from, to, area, limit }) =>
  api.get('/admin/status/errors', { params: { from, to, area, limit } }).then((r) => r.data.data)
