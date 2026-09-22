import { api } from './api'

export const listGoals = (uid) => api.get(`/goals/admin/${uid}`).then((r) => r.data.data)
