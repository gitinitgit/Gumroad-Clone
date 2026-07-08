import mongoose, { Document, Schema, Model } from 'mongoose';
import { PRODUCT_TYPES, PRODUCT_STATUS } from '../constants/productTypes';

export interface IProductFile {
  _id?: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
  sortOrder: number;
}

export interface IVariant {
  _id?: string;
  name: string;
  priceCents: number;
  description?: string;
  maxPurchases?: number;
}

export interface IProduct extends Document {
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  price: number;
  priceCents: number;
  currency: string;
  compareAtPrice?: number;
  coverImage: string;
  thumbnailUrl?: string;
  previewUrl?: string;
  type: string;
  status: string;
  tags: string[];
  category: string;
  creator: mongoose.Types.ObjectId;
  files: IProductFile[];
  variants: IVariant[];
  customFields: Record<string, any>;
  salesCount: number;
  viewsCount: number;
  avgRating: number;
  reviewCount: number;
  revenue: number;
  isFeatured: boolean;
  isArchived: boolean;
  maxPurchases: number;
  callToAction: string;
  thankYouMessage: string;
  requireShipping: boolean;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const productFileSchema = new Schema<IProductFile>({
  fileName: { type: String, required: true },
  fileUrl: { type: String, required: true },
  fileSize: { type: Number, required: true },
  fileType: { type: String, required: true },
  sortOrder: { type: Number, default: 0 },
});

const variantSchema = new Schema<IVariant>({
  name: { type: String, required: true },
  priceCents: { type: Number, required: true },
  description: String,
  maxPurchases: Number,
});

const productSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: 200,
    },
    slug: {
      type: String,
      unique: true,
      index: true,
    },
    description: {
      type: String,
      default: '',
    },
    shortDescription: {
      type: String,
      maxlength: 300,
      default: '',
    },
    price: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    priceCents: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true,
    },
    compareAtPrice: Number,
    coverImage: {
      type: String,
      default: '/assets/images/cover_placeholder.png',
    },
    thumbnailUrl: String,
    previewUrl: String,
    type: {
      type: String,
      enum: Object.values(PRODUCT_TYPES),
      default: PRODUCT_TYPES.DIGITAL,
    },
    status: {
      type: String,
      enum: Object.values(PRODUCT_STATUS),
      default: PRODUCT_STATUS.DRAFT,
    },
    tags: [{ type: String, lowercase: true, trim: true }],
    category: { type: String, default: '' },
    creator: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    files: [productFileSchema],
    variants: [variantSchema],
    customFields: { type: Schema.Types.Mixed, default: {} },
    salesCount: { type: Number, default: 0 },
    viewsCount: { type: Number, default: 0 },
    avgRating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: false },
    isArchived: { type: Boolean, default: false },
    maxPurchases: { type: Number, default: 0 }, // 0 = unlimited
    callToAction: { type: String, default: 'I want this!' },
    thankYouMessage: { type: String, default: 'Thank you for your purchase!' },
    requireShipping: { type: Boolean, default: false },
    publishedAt: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ status: 1, type: 1 });
productSchema.index({ creator: 1, status: 1 });
productSchema.index({ category: 1, status: 1 });
productSchema.index({ isFeatured: 1, publishedAt: -1 });

// Auto-set priceCents from price
productSchema.pre('save', function (next) {
  if (this.isModified('price')) {
    this.priceCents = Math.round(this.price * 100);
  }
  next();
});

export const Product: Model<IProduct> = mongoose.model<IProduct>('Product', productSchema);
