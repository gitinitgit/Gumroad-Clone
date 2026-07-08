import { Router } from 'express';
import { authRouter } from './auth.routes';
import { userRouter } from './user.routes';
import { productRouter } from './product.routes';
import { checkoutRouter } from './checkout.routes';
import { purchaseRouter } from './purchase.routes';
import { webhookRouter } from './webhook.routes';
import { analyticsRouter } from './analytics.routes';
import { adminRouter } from './admin.routes';
import { uploadRouter } from './upload.routes';
import { notificationRouter } from './notification.routes';

export const indexRouter = Router();

indexRouter.use('/auth', authRouter);
indexRouter.use('/users', userRouter);
indexRouter.use('/products', productRouter);
indexRouter.use('/checkout', checkoutRouter);
indexRouter.use('/purchases', purchaseRouter);
indexRouter.use('/webhooks', webhookRouter);
indexRouter.use('/analytics', analyticsRouter);
indexRouter.use('/admin', adminRouter);
indexRouter.use('/upload', uploadRouter);
indexRouter.use('/notifications', notificationRouter);
