import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import * as userController from '../controllers/user.controller';

export const userRouter = Router();

// Protected routes
userRouter.get('/me', authMiddleware, userController.getMe);
userRouter.patch('/me', authMiddleware, userController.updateProfile);
userRouter.patch('/me/password', authMiddleware, userController.changePassword);
userRouter.patch('/me/payment-settings', authMiddleware, userController.updatePaymentSettings);
userRouter.patch('/me/upgrade-creator', authMiddleware, userController.upgradeToCreator);

// Public profile
userRouter.get('/:username', userController.getPublicProfile);
