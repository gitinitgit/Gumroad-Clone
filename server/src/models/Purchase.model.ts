import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IPurchase extends Document {
  buyer: mongoose.Types.ObjectId;
  product: mongoose.Types.ObjectId;
  seller: mongoose.Types.ObjectId;
  order: mongoose.Types.ObjectId;
  payment: mongoose.Types.ObjectId;
  amountCents: number;
  platformFeeCents: number;
  creatorEarningsCents: number;
  currency: string;
  status: string;
  downloadCount: number;
  maxDownloads: number;
  accessExpiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const purchaseSchema = new Schema<IPurchase>(
  {
    buyer: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    seller: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    order: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    payment: { type: Schema.Types.ObjectId, ref: 'Payment', required: true },
    amountCents: { type: Number, required: true },
    platformFeeCents: { type: Number, default: 0 },
    creatorEarningsCents: { type: Number, default: 0 },
    currency: { type: String, default: 'INR' },
    status: {
      type: String,
      enum: ['active', 'refunded', 'disputed', 'expired'],
      default: 'active',
    },
    downloadCount: { type: Number, default: 0 },
    maxDownloads: { type: Number, default: 0 }, // 0 = unlimited
    accessExpiresAt: Date,
  },
  { timestamps: true }
);

purchaseSchema.index({ buyer: 1, product: 1 });
purchaseSchema.index({ seller: 1, createdAt: -1 });

export const Purchase: Model<IPurchase> = mongoose.model<IPurchase>('Purchase', purchaseSchema);
