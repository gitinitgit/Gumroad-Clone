import mongoose, { Document, Schema, Model } from 'mongoose';
import { PAYMENT_STATUS } from '../constants/paymentStatus';

export interface IPayment extends Document {
  order: mongoose.Types.ObjectId;
  buyer: mongoose.Types.ObjectId;
  razorpayPaymentId: string;
  razorpayOrderId: string;
  razorpaySignature: string;
  amountCents: number;
  currency: string;
  method: string;
  status: string;
  refundedAmountCents: number;
  metadata: Record<string, any>;
  capturedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    order: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    buyer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    razorpayPaymentId: { type: String, unique: true, sparse: true },
    razorpayOrderId: { type: String, required: true },
    razorpaySignature: { type: String },
    amountCents: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    method: { type: String, default: '' },
    status: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.PENDING,
    },
    refundedAmountCents: { type: Number, default: 0 },
    metadata: { type: Schema.Types.Mixed, default: {} },
    capturedAt: Date,
  },
  { timestamps: true }
);

paymentSchema.index({ buyer: 1, status: 1 });

export const Payment: Model<IPayment> = mongoose.model<IPayment>('Payment', paymentSchema);
