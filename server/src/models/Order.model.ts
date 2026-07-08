import mongoose, { Document, Schema, Model } from 'mongoose';
import { ORDER_STATUS } from '../constants/paymentStatus';

export interface IOrderItem {
  product: mongoose.Types.ObjectId;
  quantity: number;
  priceCents: number;
  name: string;
}

export interface IOrder extends Document {
  buyer: mongoose.Types.ObjectId;
  items: IOrderItem[];
  totalAmountCents: number;
  discountCents: number;
  taxCents: number;
  finalAmountCents: number;
  currency: string;
  razorpayOrderId: string;
  status: string;
  coupon?: mongoose.Types.ObjectId;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>({
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, default: 1, min: 1 },
  priceCents: { type: Number, required: true },
  name: { type: String, required: true },
});

const orderSchema = new Schema<IOrder>(
  {
    buyer: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: [orderItemSchema],
    totalAmountCents: { type: Number, required: true },
    discountCents: { type: Number, default: 0 },
    taxCents: { type: Number, default: 0 },
    finalAmountCents: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    razorpayOrderId: { type: String, unique: true, sparse: true },
    status: {
      type: String,
      enum: Object.values(ORDER_STATUS),
      default: ORDER_STATUS.CREATED,
    },
    coupon: { type: Schema.Types.ObjectId, ref: 'Coupon' },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

// Compound index for payment verification lookup
orderSchema.index({ razorpayOrderId: 1, buyer: 1 });

export const Order: Model<IOrder> = mongoose.model<IOrder>('Order', orderSchema);
