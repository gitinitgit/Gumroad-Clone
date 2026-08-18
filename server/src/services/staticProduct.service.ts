import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import slugify from 'slugify';
import { logger } from '../utils/logger';

function getProductsDir(): string {
  const candidates = [
    path.join(__dirname, '../../content/products'),
    path.join(__dirname, '../content/products'),
    path.join(process.cwd(), 'server/content/products'),
    path.join(process.cwd(), 'content/products'),
    path.resolve('/app/server/content/products'),
    path.resolve('/app/content/products'),
  ];
  for (const dir of candidates) {
    if (fs.existsSync(dir)) {
      return dir;
    }
  }
  return candidates[0];
}

export interface StaticReview {
  author: string;
  rating: number;
  text: string;
  date: string;
}

export interface StaticProduct {
  _id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  price: number;
  priceCents: number;
  currency: string;
  coverImage: string;
  type: string;
  status: string;
  tags: string[];
  category: string;
  creator: {
    _id: string;
    name: string;
    username: string;
    avatar: string;
    bio: string;
  };
  salesCount: number;
  viewsCount: number;
  avgRating: number;
  reviewCount: number;
  revenue: number;
  isFeatured: boolean;
  isTrending: boolean;
  isArchived: boolean;
  isDemo: boolean;
  callToAction: string;
  images: string[];
  reviews: StaticReview[];
  createdAt: Date;
  updatedAt: Date;
}

export class StaticProductService {
  private static cache: StaticProduct[] | null = null;
  private static lastReadTime = 0;
  private static CACHE_TTL = 5000; // 5 seconds

  private static async getAllRaw(): Promise<StaticProduct[]> {
    const now = Date.now();
    if (this.cache && (now - this.lastReadTime) < this.CACHE_TTL) {
      return this.cache;
    }

    const productsDir = getProductsDir();
    if (!fs.existsSync(productsDir)) {
      logger.warn(`Static products directory not found. Checked: ${productsDir}`);
      return [];
    }

    const files = fs.readdirSync(productsDir);
    const mdFiles = files.filter(f => f.endsWith('.md'));

    const products = mdFiles.map(file => {
      try {
        const filePath = path.join(productsDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const { data, content: body } = matter(content);
        
        const slug = data.slug || 
                     (data.name ? slugify(data.name, { lower: true, strict: true }) : null) || 
                     file.replace('.md', '');
        
        return {
          _id: slug,
          name: data.name || 'Untitled Product',
          slug,
          description: body || '',
          shortDescription: data.shortDescription || '',
          price: data.price || 0,
          priceCents: Math.round((data.price || 0) * 100),
          currency: data.currency || 'INR',
          coverImage: data.coverImage || '/asset/assets/images/cover_placeholder.png',
          type: data.type || 'digital',
          status: data.status || 'published',
          tags: data.tags || ['Demo'],
          category: data.category || '',
          creator: {
            _id: 'static-user',
            name: data.creator?.name || 'Demo Creator',
            username: data.creator?.username || 'democreator',
            avatar: data.creator?.avatar || '/asset/assets/images/gumroad-default-avatar-5.png',
            bio: data.creator?.bio || 'Static content creator',
          },
          salesCount: data.salesCount || 0,
          viewsCount: data.viewsCount || 0,
          avgRating: data.avgRating || 0,
          reviewCount: data.reviewCount || 0,
          revenue: 0,
          isFeatured: !!data.isFeatured,
          isTrending: !!data.isTrending,
          isArchived: false,
          isDemo: data.isDemo !== undefined ? !!data.isDemo : true,
          callToAction: data.callToAction || 'I want this!',
          images: data.images || [data.coverImage || '/asset/assets/images/cover_placeholder.png'],
          reviews: (data.reviews || []).map((r: any) => ({
            author: r.author || 'Anonymous',
            rating: r.rating || 5,
            text: r.text || '',
            date: r.date || new Date().toISOString().split('T')[0],
          })),
          createdAt: new Date(),
          updatedAt: new Date(),
        } as StaticProduct;
      } catch (err) {
        logger.error(`Error parsing static product file ${file}:`, err);
        return null;
      }
    }).filter(p => p !== null) as StaticProduct[];

    this.cache = products;
    this.lastReadTime = now;
    return products;
  }

  static async getPublicProducts(query: any) {
    let products = await this.getAllRaw();

    // Filter by status
    products = products.filter(p => p.status === 'published');

    // Filter by type
    if (query.type && query.type !== 'all') {
      products = products.filter(p => p.type === query.type);
    }

    // Filter by category
    if (query.category && query.category !== 'all') {
      products = products.filter(p => 
        p.category.toLowerCase() === query.category.toLowerCase()
      );
    }

    // Search
    if (query.search) {
      const search = query.search.toLowerCase();
      products = products.filter(p => 
        p.name.toLowerCase().includes(search) || 
        p.description.toLowerCase().includes(search) ||
        p.tags.some((t: string) => t.toLowerCase().includes(search)) ||
        p.category.toLowerCase().includes(search)
      );
    }

    // Price range filters
    if (query.minPrice !== undefined) {
      products = products.filter(p => p.price >= query.minPrice);
    }
    if (query.maxPrice !== undefined) {
      products = products.filter(p => p.price <= query.maxPrice);
    }

    // Rating filter
    if (query.minRating !== undefined) {
      products = products.filter(p => p.avgRating >= query.minRating);
    }

    // Sorting
    if (query.sort === 'price_asc') {
      products.sort((a, b) => a.price - b.price);
    } else if (query.sort === 'price_desc') {
      products.sort((a, b) => b.price - a.price);
    } else if (query.sort === 'rating') {
      products.sort((a, b) => b.avgRating - a.avgRating);
    } else if (query.sort === 'popular') {
      products.sort((a, b) => b.salesCount - a.salesCount);
    } else if (query.sort === 'featured') {
      products.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
    } else {
      // Default: latest (by name since static products don't have real dates)
      products.sort((a, b) => b.salesCount - a.salesCount);
    }

    const total = products.length;
    const page = query.page || 1;
    const limit = query.limit || 20;
    const start = (page - 1) * limit;
    const paginatedProducts = products.slice(start, start + limit);

    return { products: paginatedProducts, total };
  }

  static async getBySlug(slug: string): Promise<StaticProduct> {
    const products = await this.getAllRaw();
    const normalizedTarget = slug.toLowerCase().replace(/[^a-z0-9]/g, '');
    const product = products.find(p => 
      p.slug === slug || 
      p._id === slug ||
      (p.slug && p.slug.toLowerCase().replace(/[^a-z0-9]/g, '') === normalizedTarget) ||
      (p.name && p.name.toLowerCase().replace(/[^a-z0-9]/g, '') === normalizedTarget)
    );
    if (!product) throw new Error('Product not found');
    return product;
  }

  static async getFeatured(limit: number = 8) {
    const products = await this.getAllRaw();
    return products
      .filter(p => p.isFeatured && p.status === 'published')
      .slice(0, limit);
  }

  static async getTrending(limit: number = 8) {
    const products = await this.getAllRaw();
    return products
      .filter(p => p.isTrending && p.status === 'published')
      .sort((a, b) => b.salesCount - a.salesCount)
      .slice(0, limit);
  }

  static async getCategories(): Promise<string[]> {
    const products = await this.getAllRaw();
    const categories = new Set(products.map(p => p.category).filter(Boolean));
    return Array.from(categories);
  }
}
