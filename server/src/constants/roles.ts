export const ROLES = {
  BUYER: 'buyer',
  CREATOR: 'creator',
  ADMIN: 'admin',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];
