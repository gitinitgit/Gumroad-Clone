import { Router, Response } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { AuthRequest } from '../types/express.d';

export const notificationRouter = Router();

notificationRouter.use(authMiddleware);

// Placeholder — notifications will be stored in a Notification model
notificationRouter.get(
  '/',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    // TODO: Implement with Notification model
    ApiResponse.success(res, [], 'Notifications retrieved');
  })
);

notificationRouter.patch(
  '/:id/read',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    // TODO: Mark notification as read
    ApiResponse.success(res, null, 'Notification marked as read');
  })
);
