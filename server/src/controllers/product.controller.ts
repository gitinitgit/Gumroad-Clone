import { Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { ProductService } from '../services/product.service';
import { StaticProductService } from '../services/staticProduct.service';
import { CacheService, CACHE_TTL } from '../services/cache.service';
import { AuthRequest } from '../types/express.d';
import { parsePagination } from '../utils/pagination';
import { env } from '../config/env';

export const createProduct = asyncHandler(async (req: AuthRequest, res: Response) => {
  const product = await ProductService.create(req.user!.userId, req.body);
  ApiResponse.created(res, product, 'Product created');
});

export const getMyProducts = asyncHandler(async (req: AuthRequest, res: Response) => {
  const pagination = parsePagination(req.query as any);
  const { products, total } = await ProductService.getByCreator(req.user!.userId, pagination);
  ApiResponse.paginated(res, products, total, pagination.page, pagination.limit, 'Products retrieved');
});

export const getProduct = asyncHandler(async (req: AuthRequest, res: Response) => {
  const product = await ProductService.getById(req.params.id);
  ApiResponse.success(res, product, 'Product retrieved');
});

export const getProductBySlug = asyncHandler(async (req: AuthRequest, res: Response) => {
  const slug = req.params.slug;
  const cacheKey = `product:${slug}`;

  // Check cache first
  const cached = await CacheService.get(cacheKey);
  if (cached) {
    return ApiResponse.success(res, cached, 'Product retrieved');
  }

  let product;
  try {
    product = await ProductService.getBySlug(slug);
  } catch (error) {
    // Fallback to static mock data if not found in DB
    product = await StaticProductService.getBySlug(slug);
  }

  // Cache the result
  await CacheService.set(cacheKey, product, CACHE_TTL.PRODUCT_BY_SLUG);

  ApiResponse.success(res, product, 'Product retrieved');
});

export const getPublicProducts = asyncHandler(async (req: AuthRequest, res: Response) => {
  const pagination = parsePagination(req.query as any);
  const query = {
    ...pagination,
    search: req.query.search as string,
    type: req.query.type as string,
    category: req.query.category as string,
    sort: req.query.sort as string,
    minPrice: req.query.minPrice ? Number(req.query.minPrice) : undefined,
    maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : undefined,
    minRating: req.query.minRating ? Number(req.query.minRating) : undefined,
  };

  // Build a stable cache key from query params
  const cacheKey = `discover:${pagination.page}:${pagination.limit}:${query.search || ''}:${query.type || ''}:${query.category || ''}:${query.sort || ''}:${query.minPrice ?? ''}:${query.maxPrice ?? ''}`;

  const cached = await CacheService.get<{ products: any[]; total: number }>(cacheKey);
  if (cached) {
    return ApiResponse.paginated(res, cached.products, cached.total, pagination.page, pagination.limit, 'Products retrieved');
  }

  // Merge DB and Static products
  const dbData = await ProductService.getPublicProducts(query).catch(() => ({ products: [], total: 0 }));
  const staticData = await StaticProductService.getPublicProducts(query).catch(() => ({ products: [], total: 0 }));

  const products = [...dbData.products, ...staticData.products];
  const total = dbData.total + staticData.total;

  await CacheService.set(cacheKey, { products, total }, CACHE_TTL.DISCOVER_PRODUCTS);

  ApiResponse.paginated(res, products, total, pagination.page, pagination.limit, 'Products retrieved');
});

export const updateProduct = asyncHandler(async (req: AuthRequest, res: Response) => {
  const product = await ProductService.update(req.params.id, req.user!.userId, req.body);
  ApiResponse.success(res, product, 'Product updated');
});

export const updateProductStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const product = await ProductService.updateStatus(req.params.id, req.user!.userId, req.body.status);
  ApiResponse.success(res, product, `Product ${req.body.status}`);
});

export const deleteProduct = asyncHandler(async (req: AuthRequest, res: Response) => {
  await ProductService.delete(req.params.id, req.user!.userId);
  ApiResponse.success(res, null, 'Product archived');
});

export const addProductFile = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.file) {
    return ApiResponse.error(res, 400, 'No file uploaded');
  }
  const fileData = {
    fileName: req.file.originalname,
    fileUrl: `/uploads/${req.file.filename}`,
    fileSize: req.file.size,
    fileType: req.file.mimetype,
    sortOrder: req.body.sortOrder || 0,
  };
  const product = await ProductService.addFile(req.params.id, req.user!.userId, fileData);
  ApiResponse.success(res, product, 'File added');
});

export const removeProductFile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const product = await ProductService.removeFile(req.params.id, req.user!.userId, req.params.fileId);
  ApiResponse.success(res, product, 'File removed');
});

export const getFeaturedProducts = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const cacheKey = 'featured';
  const cached = await CacheService.get(cacheKey);
  if (cached) {
    return ApiResponse.success(res, cached, 'Featured products retrieved');
  }

  // Merge DB and Static featured products
  const dbProducts = await ProductService.getFeatured().catch(() => []);
  const staticProducts = await StaticProductService.getFeatured().catch(() => []);
  const products = [...dbProducts, ...staticProducts];

  await CacheService.set(cacheKey, products, CACHE_TTL.FEATURED_PRODUCTS);
  ApiResponse.success(res, products, 'Featured products retrieved');
});

export const getTrendingProducts = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const cacheKey = 'trending';
  const cached = await CacheService.get(cacheKey);
  if (cached) {
    return ApiResponse.success(res, cached, 'Trending products retrieved');
  }

  // Merge DB and Static trending products
  const dbProducts = await ProductService.getFeatured().catch(() => []); // fallback logic
  const staticProducts = await StaticProductService.getTrending().catch(() => []);
  const products = [...dbProducts, ...staticProducts];

  await CacheService.set(cacheKey, products, CACHE_TTL.TRENDING_PRODUCTS);
  ApiResponse.success(res, products, 'Trending products retrieved');
});

export const getCategories = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const cacheKey = 'categories';
  const cached = await CacheService.get(cacheKey);
  if (cached) {
    return ApiResponse.success(res, cached, 'Categories retrieved');
  }

  let categories;
  if (env.USE_STATIC_PRODUCTS) {
    categories = await StaticProductService.getCategories();
  } else {
    categories = ['Design', 'Development', 'AI', 'Business', 'Education'];
  }

  await CacheService.set(cacheKey, categories, CACHE_TTL.CATEGORIES);
  ApiResponse.success(res, categories, 'Categories retrieved');
});
