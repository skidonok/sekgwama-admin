import { api } from './api'

export const listFraudReports = (status) =>
  api.get('/fraud-reports/admin', { params: status ? { status } : undefined }).then((r) => r.data.data)

export const getFraudReport = (uid, reportId) =>
  api.get(`/fraud-reports/admin/${uid}/${reportId}`).then((r) => r.data.data)

export const sendFraudReportMessage = (uid, reportId, body) =>
  api.post(`/fraud-reports/admin/${uid}/${reportId}/messages`, { body }).then((r) => r.data.data)

export const updateFraudReportStatus = (uid, reportId, status) =>
  api.patch(`/fraud-reports/admin/${uid}/${reportId}/status`, { status }).then((r) => r.data.data)
