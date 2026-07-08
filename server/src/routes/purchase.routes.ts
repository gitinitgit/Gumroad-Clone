import { Router, Response } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { Purchase } from '../models/Purchase.model';
import { parsePagination } from '../utils/pagination';
import { AuthRequest } from '../types/express.d';
import { ApiError } from '../utils/ApiError';

export const purchaseRouter = Router();

// Get buyer's purchases (library)
purchaseRouter.get(
  '/library',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const pagination = parsePagination(req.query as any);
    const purchases = await Purchase.find({ buyer: req.user!.userId, status: 'active' })
      .populate('product', 'name slug coverImage type creator files')
      .populate('seller', 'name username avatar')
      .sort({ createdAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit);

    const total = await Purchase.countDocuments({ buyer: req.user!.userId, status: 'active' });
    ApiResponse.paginated(res, purchases, total, pagination.page, pagination.limit, 'Library retrieved');
  })
);

// Get seller's sales
purchaseRouter.get(
  '/sales',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const pagination = parsePagination(req.query as any);
    const sales = await Purchase.find({ seller: req.user!.userId })
      .populate('product', 'name slug coverImage type')
      .populate('buyer', 'name email avatar')
      .sort({ createdAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit);

    const total = await Purchase.countDocuments({ seller: req.user!.userId });
    ApiResponse.paginated(res, sales, total, pagination.page, pagination.limit, 'Sales retrieved');
  })
);

// Download product file (check purchase access)
purchaseRouter.get(
  '/:purchaseId/download/:fileId',
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const purchase = await Purchase.findOne({
      _id: req.params.purchaseId,
      buyer: req.user!.userId,
      status: 'active',
    }).populate('product');

    if (!purchase) {
      throw ApiError.notFound('Purchase not found');
    }

    const product = purchase.product as any;
    const file = product.files?.find((f: any) => f._id.toString() === req.params.fileId);

    if (!file) {
      throw ApiError.notFound('File not found');
    }

    // Increment download count
    purchase.downloadCount += 1;
    await purchase.save();

    ApiResponse.success(res, { downloadUrl: file.fileUrl, fileName: file.fileName }, 'Download URL retrieved');
  })
);
