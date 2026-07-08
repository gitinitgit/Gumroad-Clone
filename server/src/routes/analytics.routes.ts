import { Router, Response } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { creatorMiddleware } from '../middlewares/admin.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { Purchase } from '../models/Purchase.model';
import { Product } from '../models/Product.model';
import { AuthRequest } from '../types/express.d';

export const analyticsRouter = Router();

// Creator dashboard stats
analyticsRouter.get(
  '/dashboard',
  authMiddleware,
  creatorMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;

    // Total revenue
    const revenueAgg = await Purchase.aggregate([
      { $match: { seller: userId, status: 'active' } },
      { $group: { _id: null, total: { $sum: '$creatorEarningsCents' }, count: { $sum: 1 } } },
    ]);

    const totalRevenue = revenueAgg[0]?.total || 0;
    const totalSales = revenueAgg[0]?.count || 0;

    // Products count
    const totalProducts = await Product.countDocuments({ creator: userId, isArchived: false });
    const publishedProducts = await Product.countDocuments({ creator: userId, status: 'published' });

    // Sales last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentSalesAgg = await Purchase.aggregate([
      { $match: { seller: userId, status: 'active', createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, revenue: { $sum: '$creatorEarningsCents' }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    // Top products
    const topProducts = await Purchase.aggregate([
      { $match: { seller: userId, status: 'active' } },
      { $group: { _id: '$product', revenue: { $sum: '$creatorEarningsCents' }, sales: { $sum: 1 } } },
      { $sort: { revenue: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: '$product' },
      {
        $project: {
          name: '$product.name',
          coverImage: '$product.coverImage',
          slug: '$product.slug',
          revenue: 1,
          sales: 1,
        },
      },
    ]);

    ApiResponse.success(res, {
      totalRevenue,
      totalSales,
      totalProducts,
      publishedProducts,
      recentSales: recentSalesAgg,
      topProducts,
    }, 'Dashboard analytics retrieved');
  })
);
