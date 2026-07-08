import { Router, Response } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { uploadSingle, uploadCover } from '../middlewares/upload.middleware';
import { uploadLimiter } from '../middlewares/rateLimit.middleware';
import { AuthRequest } from '../types/express.d';

export const uploadRouter = Router();

uploadRouter.use(authMiddleware, uploadLimiter);

// Upload a file
uploadRouter.post(
  '/file',
  uploadSingle,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.file) {
      return ApiResponse.error(res, 400, 'No file provided');
    }

    ApiResponse.success(res, {
      fileName: req.file.originalname,
      fileUrl: `/uploads/${req.file.filename}`,
      fileSize: req.file.size,
      fileType: req.file.mimetype,
    }, 'File uploaded');
  })
);

// Upload a cover image
uploadRouter.post(
  '/cover',
  uploadCover,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.file) {
      return ApiResponse.error(res, 400, 'No image provided');
    }

    ApiResponse.success(res, {
      coverUrl: `/uploads/${req.file.filename}`,
    }, 'Cover uploaded');
  })
);
