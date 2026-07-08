import crypto from 'crypto';
import { razorpayInstance } from '../config/razorpay';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';

interface CreateRazorpayOrderInput {
  amountCents: number;
  currency?: string;
  receipt: string;
  notes?: Record<string, string>;
}

export class RazorpayService {
  /**
   * Create a Razorpay order
   */
  static async createOrder(input: CreateRazorpayOrderInput) {
    if (!razorpayInstance) {
      throw ApiError.internal('Payment service not configured. Please check Razorpay credentials.');
    }
    try {
      const order = await razorpayInstance.orders.create({
        amount: input.amountCents,
        currency: input.currency || 'INR',
        receipt: input.receipt,
        notes: input.notes || {},
      });
      return order;
    } catch (error: any) {
      logger.error('Razorpay order creation failed:', error);
      throw ApiError.internal('Failed to create payment order');
    }
  }

  /**
   * Verify payment signature (HMAC SHA256)
   */
  static verifyPaymentSignature(
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string
  ): boolean {
    const body = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    return expectedSignature === razorpaySignature;
  }

  /**
   * Fetch payment details from Razorpay
   */
  static async fetchPayment(paymentId: string) {
    if (!razorpayInstance) {
      throw ApiError.internal('Payment service not configured.');
    }
    try {
      return await razorpayInstance.payments.fetch(paymentId);
    } catch (error: any) {
      logger.error('Razorpay fetch payment failed:', error);
      throw ApiError.internal('Failed to fetch payment details');
    }
  }

  /**
   * Process a refund
   */
  static async createRefund(paymentId: string, amountCents?: number) {
    if (!razorpayInstance) {
      throw ApiError.internal('Payment service not configured.');
    }
    try {
      const refundParams: any = {};
      if (amountCents) {
        refundParams.amount = amountCents;
      }
      return await razorpayInstance.payments.refund(paymentId, refundParams);
    } catch (error: any) {
      logger.error('Razorpay refund failed:', error);
      throw ApiError.internal('Failed to process refund');
    }
  }

  /**
   * Verify webhook signature
   */
  static verifyWebhookSignature(body: string | Buffer, signature: string): boolean {
    const expectedSignature = crypto
      .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
      .update(body)
      .digest('hex');

    return expectedSignature === signature;
  }
}
