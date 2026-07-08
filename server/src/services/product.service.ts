import { Product, IProduct } from '../models/Product.model';
import { User } from '../models/User.model';
import { ApiError } from '../utils/ApiError';
import { generateSlug } from '../utils/generateSlug';
import { sanitizeProductContent, sanitizePlainText } from '../utils/sanitize';
import { PRODUCT_STATUS } from '../constants/productTypes';
import { ROLES } from '../constants/roles';
import { CacheService } from './cache.service';

interface CreateProductInput {
  name: string;
  description?: string;
  shortDescription?: string;
  price: number;
  currency?: string;
  coverImage?: string;
  type?: string;
  tags?: string[];
  category?: string;
  callToAction?: string;
  thankYouMessage?: string;
  requireShipping?: boolean;
  maxPurchases?: number;
}

interface ProductQuery {
  page: number;
  limit: number;
  skip: number;
  search?: string;
  type?: string;
  category?: string;
  sort?: string;
  minPrice?: number;
  maxPrice?: number;
}

export class ProductService {
  static async create(creatorId: string, input: CreateProductInput): Promise<IProduct> {
    const slug = generateSlug(input.name);

    // Sanitize user-supplied content to prevent stored XSS
    const sanitizedInput = {
      ...input,
      name: sanitizePlainText(input.name),
      description: input.description ? sanitizeProductContent(input.description) : '',
      shortDescription: input.shortDescription ? sanitizePlainText(input.shortDescription) : '',
      callToAction: input.callToAction ? sanitizePlainText(input.callToAction) : undefined,
      thankYouMessage: input.thankYouMessage ? sanitizeProductContent(input.thankYouMessage) : undefined,
    };

    const product = await Product.create({
      ...sanitizedInput,
      slug,
      creator: creatorId,
    });

    // Auto-upgrade buyer to creator on first product creation
    await User.findOneAndUpdate(
      { _id: creatorId, role: ROLES.BUYER },
      { role: ROLES.CREATOR }
    );

    // Invalidate discovery caches since a new product exists
    await CacheService.delPattern('discover:*');

    return product;
  }

  static async getById(productId: string): Promise<IProduct> {
    const product = await Product.findById(productId).populate('creator', 'name username avatar');
    if (!product) throw ApiError.notFound('Product not found');
    return product;
  }

  static async getBySlug(slug: string): Promise<IProduct> {
    const product = await Product.findOne({ slug, status: PRODUCT_STATUS.PUBLISHED })
      .populate('creator', 'name username avatar bio socialLinks');
    if (!product) throw ApiError.notFound('Product not found');

    // Increment view count
    product.viewsCount += 1;
    await product.save({ validateBeforeSave: false });

    return product;
  }

  static async getByCreator(creatorId: string, query: ProductQuery) {
    const filter: any = { creator: creatorId, isArchived: false };

    const products = await Product.find(filter)
      .sort({ createdAt: -1 })
      .skip(query.skip)
      .limit(query.limit);

    const total = await Product.countDocuments(filter);

    return { products, total };
  }

  static async getPublicProducts(query: ProductQuery) {
    const filter: any = { status: PRODUCT_STATUS.PUBLISHED, isArchived: false };

    if (query.search) {
      filter.$text = { $search: query.search };
    }
    if (query.type) {
      filter.type = query.type;
    }
    if (query.category) {
      filter.category = query.category;
    }
    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      filter.price = {};
      if (query.minPrice !== undefined) filter.price.$gte = query.minPrice;
      if (query.maxPrice !== undefined) filter.price.$lte = query.maxPrice;
    }

    let sortObj: any = { createdAt: -1 };
    if (query.sort === 'popular') sortObj = { salesCount: -1 };
    if (query.sort === 'price_asc') sortObj = { price: 1 };
    if (query.sort === 'price_desc') sortObj = { price: -1 };
    if (query.sort === 'rating') sortObj = { avgRating: -1 };
    if (query.sort === 'featured') sortObj = { isFeatured: -1, publishedAt: -1 };

    const products = await Product.find(filter)
      .populate('creator', 'name username avatar')
      .sort(sortObj)
      .skip(query.skip)
      .limit(query.limit);

    const total = await Product.countDocuments(filter);

    return { products, total };
  }

  static async update(productId: string, creatorId: string, updates: Partial<CreateProductInput>): Promise<IProduct> {
    const product = await Product.findOne({ _id: productId, creator: creatorId });
    if (!product) throw ApiError.notFound('Product not found or not authorized');

    // Sanitize user-supplied content on updates
    const sanitizedUpdates = { ...updates };
    if (sanitizedUpdates.name) sanitizedUpdates.name = sanitizePlainText(sanitizedUpdates.name);
    if (sanitizedUpdates.description) sanitizedUpdates.description = sanitizeProductContent(sanitizedUpdates.description);
    if (sanitizedUpdates.shortDescription) sanitizedUpdates.shortDescription = sanitizePlainText(sanitizedUpdates.shortDescription);
    if (sanitizedUpdates.callToAction) sanitizedUpdates.callToAction = sanitizePlainText(sanitizedUpdates.callToAction);
    if (sanitizedUpdates.thankYouMessage) sanitizedUpdates.thankYouMessage = sanitizeProductContent(sanitizedUpdates.thankYouMessage);

    Object.assign(product, sanitizedUpdates);
    await product.save();

    // Invalidate caches for this product
    await CacheService.del(`product:${product.slug}`);
    await CacheService.delPattern('discover:*');
    await CacheService.del('featured');
    await CacheService.del('trending');

    return product;
  }

  static async updateStatus(productId: string, creatorId: string, status: string): Promise<IProduct> {
    const product = await Product.findOne({ _id: productId, creator: creatorId });
    if (!product) throw ApiError.notFound('Product not found');

    product.status = status;
    if (status === PRODUCT_STATUS.PUBLISHED && !product.publishedAt) {
      product.publishedAt = new Date();
    }
    await product.save();

    // Invalidate caches — product visibility changed
    await CacheService.del(`product:${product.slug}`);
    await CacheService.delPattern('discover:*');
    await CacheService.del('featured');
    await CacheService.del('trending');

    return product;
  }

  static async delete(productId: string, creatorId: string): Promise<void> {
    const product = await Product.findOne({ _id: productId, creator: creatorId });
    if (!product) throw ApiError.notFound('Product not found');

    product.isArchived = true;
    product.status = PRODUCT_STATUS.UNPUBLISHED;
    await product.save();

    // Invalidate caches — product removed from public view
    await CacheService.del(`product:${product.slug}`);
    await CacheService.delPattern('discover:*');
    await CacheService.del('featured');
    await CacheService.del('trending');
  }

  static async addFile(productId: string, creatorId: string, file: any): Promise<IProduct> {
    const product = await Product.findOne({ _id: productId, creator: creatorId });
    if (!product) throw ApiError.notFound('Product not found');

    product.files.push(file);
    await product.save();
    return product;
  }

  static async removeFile(productId: string, creatorId: string, fileId: string): Promise<IProduct> {
    const product = await Product.findOne({ _id: productId, creator: creatorId });
    if (!product) throw ApiError.notFound('Product not found');

    product.files = product.files.filter((f: any) => f._id.toString() !== fileId);
    await product.save();
    return product;
  }

  static async getFeatured(limit: number = 8) {
    return Product.find({ isFeatured: true, status: PRODUCT_STATUS.PUBLISHED })
      .populate('creator', 'name username avatar')
      .sort({ publishedAt: -1 })
      .limit(limit);
  }
}
