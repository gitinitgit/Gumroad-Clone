import { Router, Response } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { adminMiddleware } from '../middlewares/admin.middleware';
import { validate } from '../middlewares/validate.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { User } from '../models/User.model';
import { Product } from '../models/Product.model';
import { Purchase } from '../models/Purchase.model';
import { parsePagination } from '../utils/pagination';
import { AuthRequest } from '../types/express.d';
import { z } from 'zod';

export const adminRouter = Router();

// Validation schemas for admin endpoints
const blockUserSchema = z.object({
  isBlocked: z.boolean(),
});

const featureProductSchema = z.object({
  isFeatured: z.boolean(),
});

// All admin routes require auth + admin role
adminRouter.use(authMiddleware, adminMiddleware);

// Admin dashboard
adminRouter.get('/dashboard', asyncHandler(async (_req: AuthRequest, res: Response) => {
  const totalUsers = await User.countDocuments();
  const totalCreators = await User.countDocuments({ role: 'creator' });
  const totalProducts = await Product.countDocuments({ isArchived: false });
  const totalSales = await Purchase.countDocuments();

  const revenueAgg = await Purchase.aggregate([
    { $group: { _id: null, total: { $sum: '$amountCents' }, platform: { $sum: '$platformFeeCents' } } },
  ]);

  ApiResponse.success(res, {
    totalUsers,
    totalCreators,
    totalProducts,
    totalSales,
    totalRevenue: revenueAgg[0]?.total || 0,
    platformRevenue: revenueAgg[0]?.platform || 0,
  }, 'Admin dashboard');
}));

// List users
adminRouter.get('/users', asyncHandler(async (req: AuthRequest, res: Response) => {
  const pagination = parsePagination(req.query as any);
  const users = await User.find()
    .sort({ createdAt: -1 })
    .skip(pagination.skip)
    .limit(pagination.limit);
  const total = await User.countDocuments();
  ApiResponse.paginated(res, users, total, pagination.page, pagination.limit);
}));

// Block/unblock user
adminRouter.patch('/users/:id/block', validate(blockUserSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await User.findByIdAndUpdate(req.params.id, { isBlocked: req.body.isBlocked }, { new: true });
  ApiResponse.success(res, user, `User ${req.body.isBlocked ? 'blocked' : 'unblocked'}`);
}));

// Feature/unfeature product
adminRouter.patch('/products/:id/feature', validate(featureProductSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
  const product = await Product.findByIdAndUpdate(req.params.id, { isFeatured: req.body.isFeatured }, { new: true });
  ApiResponse.success(res, product, `Product ${req.body.isFeatured ? 'featured' : 'unfeatured'}`);
}));

// List all products
adminRouter.get('/products', asyncHandler(async (req: AuthRequest, res: Response) => {
  const pagination = parsePagination(req.query as any);
  const products = await Product.find()
    .populate('creator', 'name email')
    .sort({ createdAt: -1 })
    .skip(pagination.skip)
    .limit(pagination.limit);
  const total = await Product.countDocuments();
  ApiResponse.paginated(res, products, total, pagination.page, pagination.limit);
}));
