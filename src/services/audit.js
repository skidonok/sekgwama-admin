import { api, apiBaseUrl, getErrorMessage } from './api'

export const exportAuditLog = ({ from, to, action, uid }) =>
  api
    .get('/admin/audit/export', { params: { from, to, action, uid, format: 'json' } })
    .then((r) => r.data.data)

export const verifyAuditLog = ({ from, to }) =>
  api.get('/admin/audit/verify', { params: { from, to } }).then((r) => r.data.data)

// The CSV export requires a bearer header, so a plain <a href> can't carry
// it. Fetch it as a blob via axios (which does attach the header through the
// request interceptor) and trigger a client-side download instead.
export const downloadAuditLogCsv = async ({ from, to, action, uid }) => {
  try {
    const response = await api.get('/admin/audit/export', {
      params: { from, to, action, uid, format: 'csv' },
      responseType: 'blob',
    })
    const blobUrl = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv' }))
    const link = document.createElement('a')
    link.href = blobUrl
    link.download = `audit-log-${from}-to-${to}.csv`
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(blobUrl)
  } catch (err) {
    // err.response.data is a Blob when responseType is 'blob', so the usual
    // JSON error shape needs to be read out of it before it's usable.
    if (err?.response?.data instanceof Blob) {
      const text = await err.response.data.text()
      try {
        err.response.data = JSON.parse(text)
      } catch {
        // not JSON - leave as-is, getErrorMessage falls back gracefully
      }
    }
    throw new Error(getErrorMessage(err))
  }
}

export { apiBaseUrl }
