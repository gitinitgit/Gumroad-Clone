export const ROLES = { BUYER: 'buyer', CREATOR: 'creator', ADMIN: 'admin' } as const;
export type Role = (typeof ROLES)[keyof typeof ROLES];

export const PRODUCT_TYPES = {
  DIGITAL: 'digital', COURSE: 'course', EBOOK: 'ebook', MEMBERSHIP: 'membership',
  SERVICE: 'service', BUNDLE: 'bundle', NEWSLETTER: 'newsletter', PODCAST: 'podcast',
  AUDIOBOOK: 'audiobook', PHYSICAL: 'physical', COFFEE: 'coffee',
} as const;
export type ProductType = (typeof PRODUCT_TYPES)[keyof typeof PRODUCT_TYPES];

export const PAYMENT_STATUS = {
  PENDING: 'pending', CREATED: 'created', CAPTURED: 'captured',
  FAILED: 'failed', REFUNDED: 'refunded',
} as const;
export type PaymentStatus = (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS];
