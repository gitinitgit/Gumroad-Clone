import { Router } from 'express';
import { authMiddleware, optionalAuth } from '../middlewares/auth.middleware';
import { creatorMiddleware } from '../middlewares/admin.middleware';
import { validate } from '../middlewares/validate.middleware';
import { uploadSingle } from '../middlewares/upload.middleware';
import { createProductSchema, updateProductSchema, publishProductSchema } from '../validators/product.validator';
import * as productController from '../controllers/product.controller';

export const productRouter = Router();

// Public routes
productRouter.get('/discover', optionalAuth, productController.getPublicProducts);
productRouter.get('/featured', productController.getFeaturedProducts);
productRouter.get('/trending', productController.getTrendingProducts);
productRouter.get('/categories', productController.getCategories);
productRouter.get('/slug/:slug', optionalAuth, productController.getProductBySlug);

// Protected — any authenticated user can create products (auto-upgraded to creator)
productRouter.post('/', authMiddleware, validate(createProductSchema), productController.createProduct);

// Protected — creator/admin routes for managing existing products
productRouter.get('/my', authMiddleware, productController.getMyProducts);
productRouter.get('/:id', authMiddleware, productController.getProduct);
productRouter.patch('/:id', authMiddleware, creatorMiddleware, validate(updateProductSchema), productController.updateProduct);
productRouter.patch('/:id/status', authMiddleware, creatorMiddleware, validate(publishProductSchema), productController.updateProductStatus);
productRouter.delete('/:id', authMiddleware, creatorMiddleware, productController.deleteProduct);

// File management
productRouter.post('/:id/files', authMiddleware, creatorMiddleware, uploadSingle, productController.addProductFile);
productRouter.delete('/:id/files/:fileId', authMiddleware, creatorMiddleware, productController.removeProductFile);

