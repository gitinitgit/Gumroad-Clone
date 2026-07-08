import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import * as checkoutController from '../controllers/checkout.controller';

export const checkoutRouter = Router();

checkoutRouter.post('/create-order', authMiddleware, checkoutController.createOrder);
checkoutRouter.post('/verify-payment', authMiddleware, checkoutController.verifyPayment);
