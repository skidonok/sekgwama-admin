import { api } from './api'

export const getUser = (uid) => api.get(`/admin/users/${uid}`).then((r) => r.data.data)
