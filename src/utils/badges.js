// Maps domain status/outcome strings to a badge visual variant. Centralized
// so every list/detail view colors the same status the same way.

export const FRAUD_STATUSES = ['submitted', 'under_review', 'resolved', 'dismissed']

const FRAUD_STATUS_VARIANTS = {
  submitted: 'warning',
  under_review: 'info',
  resolved: 'success',
  dismissed: 'neutral',
}

const FRAUD_STATUS_LABELS = {
  submitted: 'Submitted',
  under_review: 'Under Review',
  resolved: 'Resolved',
  dismissed: 'Dismissed',
}

export const fraudStatusVariant = (status) => FRAUD_STATUS_VARIANTS[status] || 'neutral'
export const fraudStatusLabel = (status) => FRAUD_STATUS_LABELS[status] || status

const OUTCOME_VARIANTS = {
  success: 'success',
  failure: 'danger',
  blocked: 'warning',
}

export const outcomeVariant = (outcome) => OUTCOME_VARIANTS[outcome] || 'neutral'
