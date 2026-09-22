import { api } from './api'

export const getOnboardingDraft = (uid) => api.get(`/onboarding/admin/${uid}`).then((r) => r.data.data)

export const getDocumentUrl = (uid, documentType) =>
  api.get(`/onboarding/admin/${uid}/documents/${documentType}/url`).then((r) => r.data.data)
