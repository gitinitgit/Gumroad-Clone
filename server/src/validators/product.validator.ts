import { z } from 'zod';
import { PRODUCT_TYPES, PRODUCT_STATUS } from '../constants/productTypes';

export const createProductSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().optional().default(''),
  shortDescription: z.string().max(300).optional().default(''),
  price: z.number().min(0, 'Price must be 0 or more'),
  currency: z.string().length(3).optional().default('INR'),
  compareAtPrice: z.number().min(0).optional(),
  coverImage: z.string().optional(),
  type: z.enum(Object.values(PRODUCT_TYPES) as [string, ...string[]]).optional().default('digital'),
  tags: z.array(z.string()).optional().default([]),
  category: z.string().optional().default(''),
  callToAction: z.string().optional().default('I want this!'),
  thankYouMessage: z.string().optional().default('Thank you for your purchase!'),
  requireShipping: z.boolean().optional().default(false),
  maxPurchases: z.number().int().min(0).optional().default(0),
});

export const updateProductSchema = createProductSchema.partial();

export const publishProductSchema = z.object({
  status: z.enum([PRODUCT_STATUS.PUBLISHED, PRODUCT_STATUS.UNPUBLISHED, PRODUCT_STATUS.DRAFT]),
});
