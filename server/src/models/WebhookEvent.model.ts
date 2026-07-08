import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IWebhookEvent extends Document {
  eventId: string;
  eventType: string;
  payload: Record<string, any>;
  status: string;
  attempts: number;
  processedAt?: Date;
  error?: string;
  createdAt: Date;
}

const webhookEventSchema = new Schema<IWebhookEvent>(
  {
    eventId: { type: String, required: true, unique: true },
    eventType: { type: String, required: true },
    payload: { type: Schema.Types.Mixed, required: true },
    status: {
      type: String,
      enum: ['pending', 'processed', 'failed'],
      default: 'pending',
    },
    attempts: { type: Number, default: 0 },
    processedAt: Date,
    error: String,
  },
  { timestamps: true }
);

export const WebhookEvent: Model<IWebhookEvent> = mongoose.model<IWebhookEvent>('WebhookEvent', webhookEventSchema);
