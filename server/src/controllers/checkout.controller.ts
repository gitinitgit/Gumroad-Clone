import { Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { CheckoutService } from '../services/checkout.service';
import { AuthRequest } from '../types/express.d';

export const createOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { items } = req.body;
  const result = await CheckoutService.createOrder(req.user!.userId, items);
  ApiResponse.success(res, result, 'Razorpay order created');
});

export const verifyPayment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
  const result = await CheckoutService.verifyPayment(
    req.user!.userId,
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature
  );
  ApiResponse.success(res, result, 'Payment verified successfully');
});
