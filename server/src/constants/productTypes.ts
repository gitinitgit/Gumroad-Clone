export const PRODUCT_TYPES = {
  DIGITAL: 'digital',
  COURSE: 'course',
  EBOOK: 'ebook',
  MEMBERSHIP: 'membership',
  SERVICE: 'service',
  BUNDLE: 'bundle',
  NEWSLETTER: 'newsletter',
  PODCAST: 'podcast',
  AUDIOBOOK: 'audiobook',
  PHYSICAL: 'physical',
  COFFEE: 'coffee',
} as const;

export type ProductType = (typeof PRODUCT_TYPES)[keyof typeof PRODUCT_TYPES];

export const PRODUCT_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  UNPUBLISHED: 'unpublished',
} as const;

export type ProductStatus = (typeof PRODUCT_STATUS)[keyof typeof PRODUCT_STATUS];
