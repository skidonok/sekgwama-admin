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

export const PAYMENT_STATUSES = ['pending', 'S', 'F', 'E']

const PAYMENT_STATUS_VARIANTS = {
  pending: 'warning',
  S: 'success',
  F: 'danger',
  E: 'danger',
}

const PAYMENT_STATUS_LABELS = {
  pending: 'Pending',
  S: 'Successful',
  F: 'Failed',
  E: 'Error',
}

export const paymentStatusVariant = (status) => PAYMENT_STATUS_VARIANTS[status] || 'neutral'
export const paymentStatusLabel = (status) => PAYMENT_STATUS_LABELS[status] || status

export const PAYMENT_PURPOSES = ['deposit', 'buy_order']

const PAYMENT_PURPOSE_LABELS = {
  deposit: 'Deposit',
  buy_order: 'Buy order',
}

export const paymentPurposeLabel = (purpose) => PAYMENT_PURPOSE_LABELS[purpose] || purpose

const PAYMENT_METHOD_LABELS = {
  VISA: 'Visa',
  MASTERCARD: 'Mastercard',
  BANK_EFT: 'Bank EFT',
}

export const paymentMethodLabel = (method) => PAYMENT_METHOD_LABELS[method] || method

const ONBOARDING_STATUS_VARIANTS = {
  not_started: 'neutral',
  in_progress: 'info',
  submitted: 'info',
  approval_pending: 'warning',
  approved: 'success',
  active: 'success',
  rejected: 'danger',
  action_required: 'warning',
}

const ONBOARDING_STATUS_LABELS = {
  not_started: 'Not started',
  in_progress: 'In progress',
  submitted: 'Submitted',
  approval_pending: 'Approval pending',
  approved: 'Approved',
  active: 'Active',
  rejected: 'Rejected',
  action_required: 'Action required',
}

export const onboardingStatusVariant = (status) => ONBOARDING_STATUS_VARIANTS[status] || 'neutral'
export const onboardingStatusLabel = (status) => ONBOARDING_STATUS_LABELS[status] || status || 'Unknown'
