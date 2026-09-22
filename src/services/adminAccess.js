import { api } from './api'

export const listAdmins = () => api.get('/admin/access').then((r) => r.data.data)

export const grantAdminAccess = (uid) => api.post(`/admin/access/${uid}`).then((r) => r.data.data)

export const revokeAdminAccess = (uid) => api.delete(`/admin/access/${uid}`)
