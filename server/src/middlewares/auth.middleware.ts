import { Response, NextFunction } from 'express';
import { clerkClient, getAuth } from '@clerk/express';
import { AuthRequest } from '../types/express.d';
import { ApiError } from '../utils/ApiError';
import { User } from '../models/User.model';
import { env } from '../config/env';
import mongoose from 'mongoose';

/**
 * Helper to check if MongoDB is connected.
 */
const isDbConnected = () => mongoose.connection.readyState === 1;

/**
 * Clerk authentication middleware.
 * Verifies the Clerk session token, then loads or creates
 * the local MongoDB user record from the Clerk profile.
 */
export const authMiddleware = async (req: AuthRequest, _res: Response, next: NextFunction) => {
  try {
    const authData = getAuth(req);
    const clerkUserId = authData.userId;

    if (!clerkUserId) {
      throw ApiError.unauthorized('Authentication required');
    }

    // Skip DB if not connected and in static mode
    if (!isDbConnected() && env.USE_STATIC_PRODUCTS) {
      (req as any).user = {
        userId: 'static-user',
        clerkId: clerkUserId,
        role: 'creator',
      };
      return next();
    }

    // Find or create local user from Clerk
    let user = await User.findOne({ clerkId: clerkUserId });

    if (!user) {
      try {
        const clerkUser = await clerkClient.users.getUser(clerkUserId);
        const email = clerkUser.emailAddresses[0]?.emailAddress || `user-${clerkUserId}@gumroad.local`;
        const baseUsername = clerkUser.username || email.split('@')[0] || `user_${Date.now().toString(36)}`;
        let username = baseUsername.toLowerCase().replace(/[^a-z0-9_]/g, '');

        const existingUserWithUsername = await User.findOne({ username });
        if (existingUserWithUsername) {
          username = `${username}_${Date.now().toString(36).slice(-4)}`;
        }

        user = await User.findOneAndUpdate(
          { clerkId: clerkUserId },
          {
            $setOnInsert: {
              clerkId: clerkUserId,
              name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || clerkUser.username || 'Creator',
              email,
              username,
              avatar: clerkUser.imageUrl || '/assets/images/gumroad-default-avatar-5.png',
              role: 'creator',
              isVerified: true,
            },
          },
          { upsert: true, new: true }
        );
      } catch {
        // Fallback user creation if Clerk API call fails
        const fallbackUsername = `creator_${clerkUserId.slice(-6)}`;
        user = await User.findOneAndUpdate(
          { clerkId: clerkUserId },
          {
            $setOnInsert: {
              clerkId: clerkUserId,
              name: 'Creator',
              email: `user-${clerkUserId.slice(-6)}@gumroad.local`,
              username: fallbackUsername,
              avatar: '/assets/images/gumroad-default-avatar-5.png',
              role: 'creator',
              isVerified: true,
            },
          },
          { upsert: true, new: true }
        );
      }
    }

    if (!user) {
      throw ApiError.unauthorized('Failed to load user profile');
    }

    (req as any).user = {
      userId: (user as any)._id.toString(),
      clerkId: clerkUserId,
      role: user.role || 'creator',
    };

    next();
  } catch (error: any) {
    if (error instanceof ApiError) {
      next(error);
    } else {
      next(ApiError.unauthorized('Invalid or expired session'));
    }
  }
};

/**
 * Optional auth — does not fail if not signed in, but attaches user if session present.
 */
export const optionalAuth = async (req: AuthRequest, _res: Response, next: NextFunction) => {
  try {
    const { userId: clerkUserId } = getAuth(req);

    if (clerkUserId) {
      if (!isDbConnected() && env.USE_STATIC_PRODUCTS) {

        req.user = {
          userId: 'static-user',
          clerkId: clerkUserId,
          role: 'creator',
        };
        return next();
      }


      const user = await User.findOne({ clerkId: clerkUserId });
      if (user) {
        req.user = {
          userId: user._id.toString(),
          clerkId: clerkUserId,
          role: user.role,
        };
      }
    }
  } catch (err: any) {
    // Silently ignore auth errors in optional auth
  }


  next();
};
