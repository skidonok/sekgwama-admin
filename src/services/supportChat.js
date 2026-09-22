import { api } from './api'

export const listSupportThreads = () => api.get('/support-chat/admin/threads').then((r) => r.data.data)

export const listSupportMessages = (uid) =>
  api.get(`/support-chat/admin/${uid}/messages`).then((r) => r.data.data)

export const sendSupportMessage = (uid, body) =>
  api.post(`/support-chat/admin/${uid}/messages`, { body }).then((r) => r.data.data)
