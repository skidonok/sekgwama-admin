import { api } from './api'

export const getUser = (uid) => api.get(`/admin/users/${uid}`).then((r) => r.data.data)

export const listUsers = ({ pageSize, cursor } = {}) =>
  api.get('/admin/users', { params: { pageSize, cursor } }).then((r) => r.data.data)
