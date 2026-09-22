import { api } from './api'

export const sendLegalUpdate = ({ kind, effectiveDate, summary, documentUrl, confirm }) =>
  api
    .post('/notifications/admin/legal-update', { kind, effectiveDate, summary, documentUrl, confirm })
    .then((r) => r.data.data)

export const sendRegulatoryNotice = ({ subject, summary, effectiveDate, documentUrl, confirm }) =>
  api
    .post('/notifications/admin/regulatory-notice', { subject, summary, effectiveDate, documentUrl, confirm })
    .then((r) => r.data.data)

export const sendPromotionalCampaign = ({ headline, bodyLines, ctaLabel, ctaUrl, confirm }) =>
  api
    .post('/notifications/admin/promotional-campaign', { headline, bodyLines, ctaLabel, ctaUrl, confirm })
    .then((r) => r.data.data)
