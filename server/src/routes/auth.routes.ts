import { Router, Request, Response } from 'express';
import { Webhook } from 'svix';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { User } from '../models/User.model';
import { logger } from '../utils/logger';
import { env } from '../config/env';
import { authMiddleware } from '../middlewares/auth.middleware';
import { AuthRequest } from '../types/express.d';

export const authRouter = Router();

/**
 * POST /api/v1/auth/webhook
 * Clerk webhook endpoint — handles user.created, user.updated, user.deleted events.
 * This syncs Clerk users to our local MongoDB.
 */
authRouter.post(
  '/webhook',
  asyncHandler(async (req: Request, res: Response) => {
    const WEBHOOK_SECRET = env.CLERK_WEBHOOK_SECRET;

    if (!WEBHOOK_SECRET) {
      logger.error('CLERK_WEBHOOK_SECRET not configured');
      return res.status(500).json({ success: false, message: 'Webhook secret not configured' });
    }

    // Verify the webhook signature
    const svixId = req.headers['svix-id'] as string;
    const svixTimestamp = req.headers['svix-timestamp'] as string;
    const svixSignature = req.headers['svix-signature'] as string;

    if (!svixId || !svixTimestamp || !svixSignature) {
      return res.status(400).json({ success: false, message: 'Missing Svix headers' });
    }

    const wh = new Webhook(WEBHOOK_SECRET);
    let event: any;

    try {
      event = wh.verify(JSON.stringify(req.body), {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      });
    } catch (err) {
      logger.error('Clerk webhook verification failed:', err);
      return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
    }

    const { type, data } = event;

    switch (type) {
      case 'user.created': {
        const email = data.email_addresses?.[0]?.email_address || '';
        const username = data.username || email.split('@')[0] || `user-${Date.now().toString(36)}`;

        await User.findOneAndUpdate(
          { clerkId: data.id },
          {
            clerkId: data.id,
            name: `${data.first_name || ''} ${data.last_name || ''}`.trim() || 'User',
            email,
            username,
            avatar: data.image_url || '/assets/images/gumroad-default-avatar-5.png',
            isVerified: true,
          },
          { upsert: true, new: true }
        );

        logger.info(`Clerk webhook: user.created ${data.id} (${email})`);
        break;
      }

      case 'user.updated': {
        const email = data.email_addresses?.[0]?.email_address || '';

        await User.findOneAndUpdate(
          { clerkId: data.id },
          {
            name: `${data.first_name || ''} ${data.last_name || ''}`.trim(),
            email,
            username: data.username || email.split('@')[0],
            avatar: data.image_url || '/assets/images/gumroad-default-avatar-5.png',
          }
        );

        logger.info(`Clerk webhook: user.updated ${data.id}`);
        break;
      }

      case 'user.deleted': {
        await User.findOneAndUpdate(
          { clerkId: data.id },
          { isBlocked: true }
        );

        logger.info(`Clerk webhook: user.deleted ${data.id}`);
        break;
      }

      default:
        logger.info(`Clerk webhook: unhandled event type ${type}`);
    }

    res.status(200).json({ success: true, message: 'Webhook processed' });
  })
);

/**
 * GET /api/v1/auth/sync
 * Called by the client after Clerk sign-in to ensure the local user record exists.
 * Returns the local user + role information.
 */
authRouter.get(
  '/sync',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    // Handle static mode when DB is disconnected
    if (req.user?.userId === 'static-user') {
      return ApiResponse.success(res, {
        _id: 'static-user',
        name: 'Demo Creator',
        username: 'democreator',
        email: 'demo@example.com',
        role: 'creator',
        avatar: '/assets/images/gumroad-default-avatar-5.png',
      }, 'User synced (Static Mode)');
    }

    const user = await User.findById(req.user!.userId);

    if (!user) {
      return ApiResponse.error(res, 404, 'User not found');
    }

    // Update last login
    user.lastLoginAt = new Date();
    await user.save({ validateBeforeSave: false });

    ApiResponse.success(res, user, 'User synced');
  })
);

/**
 * POST /api/v1/auth/set-role
 * Allows a new user to set their role (buyer vs creator) after Clerk sign-up.
 */
authRouter.post(
  '/set-role',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { role } = req.body;

    if (!['buyer', 'creator'].includes(role)) {
      return ApiResponse.error(res, 400, 'Invalid role. Must be "buyer" or "creator"');
    }

    const user = await User.findByIdAndUpdate(
      req.user!.userId,
      { role },
      { new: true }
    );

    ApiResponse.success(res, user, `Role set to ${role}`);
  })
);
