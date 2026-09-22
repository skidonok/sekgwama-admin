import { api } from './api'

export const listSubjects = () => api.get('/academy/admin/subjects').then((r) => r.data.data)

export const listAiBuddyWaitlist = () => api.get('/admin/users/ai-buddy-waitlist').then((r) => r.data.data)
