export const EMAIL_TYPES = {
  WELCOME: 'welcome',
  PURCHASE_RECEIPT: 'purchase_receipt',
  PASSWORD_RESET: 'password_reset',
  PAYOUT_SENT: 'payout_sent',
  REFUND_PROCESSED: 'refund_processed',
  PAYMENT_FAILED: 'payment_failed',
  NEW_SALE: 'new_sale',
  NEW_REVIEW: 'new_review',
} as const;

export type EmailType = (typeof EMAIL_TYPES)[keyof typeof EMAIL_TYPES];
