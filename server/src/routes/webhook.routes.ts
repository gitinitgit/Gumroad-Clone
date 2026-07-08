import { Request, Response, Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { RazorpayService } from '../services/razorpay.service';
import { WebhookEvent } from '../models/WebhookEvent.model';
import { logger } from '../utils/logger';

export const webhookRouter = Router();

webhookRouter.post(
  '/razorpay',
  asyncHandler(async (req: Request, res: Response) => {
    const signature = req.headers['x-razorpay-signature'] as string;
    const body = req.body;

    // Verify webhook signature
    if (!signature || !RazorpayService.verifyWebhookSignature(body, signature)) {
      logger.warn('Invalid webhook signature');
      return res.status(400).json({ success: false, message: 'Invalid signature' });
    }

    const event = JSON.parse(body.toString());
    const eventId = event.event || `${event.entity?.id}-${Date.now()}`;

    // Idempotency check
    const existing = await WebhookEvent.findOne({ eventId });
    if (existing) {
      return res.status(200).json({ success: true, message: 'Already processed' });
    }

    // Store the event
    await WebhookEvent.create({
      eventId,
      eventType: event.event,
      payload: event,
      status: 'processed',
      processedAt: new Date(),
    });

    // Handle different event types
    switch (event.event) {
      case 'payment.captured':
        logger.info(`Webhook: Payment captured ${event.payload?.payment?.entity?.id}`);
        break;
      case 'payment.failed':
        logger.info(`Webhook: Payment failed ${event.payload?.payment?.entity?.id}`);
        break;
      case 'refund.processed':
        logger.info(`Webhook: Refund processed ${event.payload?.refund?.entity?.id}`);
        break;
      default:
        logger.info(`Webhook: Unhandled event ${event.event}`);
    }

    res.status(200).json({ success: true });
  })
);
