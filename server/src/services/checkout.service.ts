import mongoose from 'mongoose';
import { Order } from '../models/Order.model';
import { Payment } from '../models/Payment.model';
import { Purchase } from '../models/Purchase.model';
import { Product } from '../models/Product.model';
import { User } from '../models/User.model';
import { RazorpayService } from './razorpay.service';
import { StaticProductService } from './staticProduct.service';
import { EmailService } from './email.service';
import { calculateFees } from '../utils/calculateFees';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';
import { PAYMENT_STATUS, ORDER_STATUS } from '../constants/paymentStatus';
import { env } from '../config/env';

interface CheckoutItem {
  productId: string;
  quantity?: number;
}

interface ResolvedProduct {
  _id: string;
  name: string;
  price: number;
  priceCents: number;
  creator?: any;
}

export class CheckoutService {
  /**
   * Resolve products from either DB or static files
   */
  private static async resolveProducts(productIds: string[]): Promise<ResolvedProduct[]> {
    if (env.USE_STATIC_PRODUCTS) {
      // Try static products first
      const resolved: ResolvedProduct[] = [];
      for (const id of productIds) {
        try {
          const product = await StaticProductService.getBySlug(id);
          resolved.push({
            _id: product._id || id,
            name: product.name,
            price: product.price,
            priceCents: product.priceCents || Math.round(product.price * 100),
            creator: product.creator,
          });
        } catch {
          // Not found in static, try DB if available
          try {
            const dbProduct = await Product.findById(id);
            if (dbProduct && dbProduct.status === 'published') {
              resolved.push({
                _id: dbProduct._id.toString(),
                name: dbProduct.name,
                price: dbProduct.price,
                priceCents: dbProduct.priceCents,
                creator: dbProduct.creator,
              });
            }
          } catch {
            // DB not available
          }
        }
      }
      return resolved;
    }

    // Standard DB lookup
    const products = await Product.find({
      _id: { $in: productIds },
      status: 'published',
    });

    return products.map(p => ({
      _id: p._id.toString(),
      name: p.name,
      price: p.price,
      priceCents: p.priceCents,
      creator: p.creator,
    }));
  }

  /**
   * Create an order and Razorpay order
   */
  static async createOrder(buyerId: string, items: CheckoutItem[]) {
    const productIds = items.map((item) => item.productId);
    const products = await this.resolveProducts(productIds);

    if (products.length !== items.length) {
      throw ApiError.badRequest('One or more products are unavailable');
    }

    // Build order items and calculate totals
    const orderItems = products.map((product) => ({
      product: product._id,
      quantity: 1,
      priceCents: product.priceCents,
      name: product.name,
    }));

    const totalAmountCents = orderItems.reduce((sum, item) => sum + item.priceCents * item.quantity, 0);

    if (totalAmountCents <= 0) {
      throw ApiError.badRequest('Order total must be greater than zero');
    }

    // For static products without DB, create a Razorpay order directly
    if (env.USE_STATIC_PRODUCTS) {
      try {
        // Try to create a DB order
        const order = await Order.create({
          buyer: buyerId,
          items: orderItems,
          totalAmountCents,
          discountCents: 0,
          taxCents: 0,
          finalAmountCents: totalAmountCents,
          currency: 'INR',
          status: ORDER_STATUS.CREATED,
        });

        const razorpayOrder = await RazorpayService.createOrder({
          amountCents: totalAmountCents,
          currency: 'INR',
          receipt: order._id.toString(),
          notes: {
            orderId: order._id.toString(),
            buyerId: buyerId,
          },
        });

        order.razorpayOrderId = razorpayOrder.id;
        order.status = ORDER_STATUS.ATTEMPTED;
        await order.save();

        return {
          orderId: order._id,
          razorpayOrderId: razorpayOrder.id,
          razorpayKeyId: env.RAZORPAY_KEY_ID,
          amount: totalAmountCents,
          currency: 'INR',
          items: orderItems,
        };
      } catch (dbError) {
        // DB not available — create Razorpay order without internal order
        logger.warn('DB not available for order creation, creating Razorpay-only order');
        const receiptId = `static_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

        const razorpayOrder = await RazorpayService.createOrder({
          amountCents: totalAmountCents,
          currency: 'INR',
          receipt: receiptId,
          notes: {
            buyerId: buyerId,
            products: productIds.join(','),
          },
        });

        return {
          orderId: receiptId,
          razorpayOrderId: razorpayOrder.id,
          razorpayKeyId: env.RAZORPAY_KEY_ID,
          amount: totalAmountCents,
          currency: 'INR',
          items: orderItems,
        };
      }
    }

    // Standard DB flow
    const order = await Order.create({
      buyer: buyerId,
      items: orderItems,
      totalAmountCents,
      discountCents: 0,
      taxCents: 0,
      finalAmountCents: totalAmountCents,
      currency: 'INR',
      status: ORDER_STATUS.CREATED,
    });

    const razorpayOrder = await RazorpayService.createOrder({
      amountCents: totalAmountCents,
      currency: 'INR',
      receipt: order._id.toString(),
      notes: {
        orderId: order._id.toString(),
        buyerId: buyerId,
      },
    });

    order.razorpayOrderId = razorpayOrder.id;
    order.status = ORDER_STATUS.ATTEMPTED;
    await order.save();

    return {
      orderId: order._id,
      razorpayOrderId: razorpayOrder.id,
      razorpayKeyId: env.RAZORPAY_KEY_ID,
      amount: totalAmountCents,
      currency: 'INR',
      items: orderItems,
    };
  }

  /**
   * Verify Razorpay payment and create purchases
   */
  static async verifyPayment(
    buyerId: string,
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string
  ) {
    // 1. Verify signature
    const isValid = RazorpayService.verifyPaymentSignature(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    );

    if (!isValid) {
      throw ApiError.badRequest('Invalid payment signature');
    }

    // For static mode when DB might not be available
    if (env.USE_STATIC_PRODUCTS) {
      try {
        const order = await Order.findOne({ razorpayOrderId, buyer: buyerId });
        if (order) {
          return await this.processDBPayment(order, buyerId, razorpayOrderId, razorpayPaymentId, razorpaySignature);
        }
      } catch {
        // DB not available - just verify the signature was valid
        logger.info(`Static mode payment verified: ${razorpayPaymentId}`);
        return {
          orderId: 'static',
          paymentId: razorpayPaymentId,
          purchases: [],
          totalAmount: 0,
        };
      }
    }

    // Standard DB flow
    const order = await Order.findOne({ razorpayOrderId, buyer: buyerId });
    if (!order) throw ApiError.notFound('Order not found');
    return await this.processDBPayment(order, buyerId, razorpayOrderId, razorpayPaymentId, razorpaySignature);
  }

  private static async processDBPayment(
    order: any,
    buyerId: string,
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string
  ) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Atomic idempotency guard: only proceed if order is not already paid
      const lockedOrder = await Order.findOneAndUpdate(
        {
          _id: order._id,
          buyer: buyerId,
          status: { $nin: [ORDER_STATUS.PAID] },
        },
        { status: ORDER_STATUS.PAID },
        { session, new: true }
      );

      if (!lockedOrder) {
        await session.abortTransaction();
        throw ApiError.conflict('Payment already processed');
      }

      const payment = await Payment.create(
        [{
          order: lockedOrder._id,
          buyer: buyerId,
          razorpayPaymentId,
          razorpayOrderId,
          razorpaySignature,
          amountCents: lockedOrder.finalAmountCents,
          currency: lockedOrder.currency,
          status: PAYMENT_STATUS.CAPTURED,
          capturedAt: new Date(),
        }],
        { session }
      );

      const purchases = [];
      for (const item of lockedOrder.items) {
        try {
          const product = await Product.findById(item.product).session(session);
          if (!product) continue;

          const fees = calculateFees(item.priceCents);

          const purchase = await Purchase.create(
            [{
              buyer: buyerId,
              product: item.product,
              seller: product.creator,
              order: lockedOrder._id,
              payment: payment[0]._id,
              amountCents: item.priceCents,
              platformFeeCents: fees.platformFeeCents,
              creatorEarningsCents: fees.creatorEarningsCents,
              currency: lockedOrder.currency,
              status: 'active',
            }],
            { session }
          );

          // Atomic increment — prevents lost updates under concurrency
          await Product.updateOne(
            { _id: item.product },
            { $inc: { salesCount: 1, revenue: fees.creatorEarningsCents } },
            { session }
          );

          purchases.push(purchase[0]);
        } catch (itemErr) {
          logger.warn(`Could not process purchase for item ${item.product}:`, itemErr);
        }
      }

      await session.commitTransaction();

      logger.info(`Payment verified: ${razorpayPaymentId} for order ${lockedOrder._id}`);

      // Fire-and-forget: dispatch email receipt
      try {
        const user = await User.findById(buyerId);
        if (user && user.email) {
          const primaryProductName = lockedOrder.items[0]?.name || 'Your Purchase';
          
          EmailService.sendPurchaseReceipt(user.email, {
            productName: primaryProductName,
            amountCents: lockedOrder.finalAmountCents,
            currency: lockedOrder.currency,
            orderId: lockedOrder._id.toString(),
            date: new Date(),
            libraryUrl: `${env.CLIENT_URL}/library`,
            buyerName: user.name.split(' ')[0], // First name
          });
        }
      } catch (emailErr) {
        logger.error('Failed to trigger receipt email:', emailErr);
      }

      return {
        orderId: lockedOrder._id,
        paymentId: payment[0]._id,
        purchases: purchases.map((p) => p._id),
        totalAmount: lockedOrder.finalAmountCents,
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}
