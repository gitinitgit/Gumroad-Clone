import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, SlidersHorizontal, X, Heart } from 'lucide-react';
import api from '../services/api';
import ProductCard, { StarRating, getWishlist } from '../components/ProductCard';

interface Product {
  _id: string;
  name: string;
  slug: string;
  price: number;
  coverImage: string;
  type: string;
  category?: string;
  creator: { name: string; username?: string; avatar: string };
  avgRating: number;
  reviewCount?: number;
  salesCount?: number;
  isFeatured?: boolean;
  isTrending?: boolean;
  isDemo?: boolean;
  tags?: string[];
}

const CATEGORIES = [
  { key: 'all', label: 'All', icon: '/asset/assets/images/discover/search.svg', banner: '' },
  { key: 'Design', label: 'Design', icon: '/asset/assets/images/discover/design.svg', banner: '/asset/assets/images/discover/category_illustrations/design.jpg' },
  { key: 'Development', label: 'Development', icon: '/asset/assets/images/discover/software.svg', banner: '/asset/assets/images/discover/category_illustrations/software.jpg' },
  { key: 'AI', label: 'AI', icon: '/asset/assets/images/discover/games.svg', banner: '/asset/assets/images/discover/category_illustrations/software.jpg' },
  { key: 'Business', label: 'Business', icon: '/asset/assets/images/discover/writing.svg', banner: '/asset/assets/images/discover/category_illustrations/writing.jpg' },
  { key: 'Education', label: 'Education', icon: '/asset/assets/images/discover/education.svg', banner: '/asset/assets/images/discover/category_illustrations/education.jpg' },
];

const SORT_OPTIONS = [
  { value: 'popular', label: 'Popular' },
  { value: 'latest', label: 'Latest' },
  { value: 'price_asc', label: 'Price: Low → High' },
  { value: 'price_desc', label: 'Price: High → Low' },
  { value: 'rating', label: 'Top Rated' },
];

const TABS = [
  { key: 'trending', label: 'Trending' },
  { key: 'best-sellers', label: 'Best Sellers' },
  { key: 'hot-new', label: 'Hot & New' },
];

const PRODUCTS_PER_PAGE = 10;

export default function DiscoverPage() {
  // Main state
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [displayedProducts, setDisplayedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Filters
  const [category, setCategory] = useState('all');
  const [activeTab, setActiveTab] = useState('trending');
  const [sort, setSort] = useState('popular');
  const [search, setSearch] = useState('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [minRating, setMinRating] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [showWishlist, setShowWishlist] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Carousel
  const carouselRef = useRef<HTMLDivElement>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);

  // Wishlist
  const [wishlistSlugs, setWishlistSlugs] = useState<string[]>([]);

  // Refresh wishlist on changes
  useEffect(() => {
    const refresh = () => setWishlistSlugs(getWishlist());
    refresh();
    window.addEventListener('wishlist-changed', refresh);
    return () => window.removeEventListener('wishlist-changed', refresh);
  }, []);

  // Fetch featured products
  useEffect(() => {
    api.get('/products/featured').then(({ data }) => {
      setFeaturedProducts(data.data || []);
    }).catch(() => {});
  }, []);

  // Fetch products when filters change
  useEffect(() => {
    setPage(1);
    setHasMore(true);
    fetchProducts(1, true);
  }, [category, activeTab, sort, search]);

  const fetchProducts = async (pageNum: number, reset: boolean = false) => {
    if (reset) setLoading(true);
    else setLoadingMore(true);

    try {
      const params: any = {
        limit: PRODUCTS_PER_PAGE,
        page: pageNum,
        sort: activeTab === 'best-sellers' ? 'popular' : activeTab === 'hot-new' ? 'latest' : sort,
      };
      if (category !== 'all') params.category = category;
      if (search) params.search = search;
      if (priceRange[0] > 0) params.minPrice = priceRange[0];
      if (priceRange[1] < 10000) params.maxPrice = priceRange[1];
      if (minRating > 0) params.minRating = minRating;

      const { data } = await api.get('/products/discover', { params });
      const products: Product[] = data.data || [];
      const total = data.total || 0;

      if (reset) {
        setAllProducts(products);
        setDisplayedProducts(products);
      } else {
        const merged = [...allProducts, ...products];
        setAllProducts(merged);
        setDisplayedProducts(merged);
      }

      setHasMore(pageNum * PRODUCTS_PER_PAGE < total);
    } catch {
      if (reset) {
        setAllProducts([]);
        setDisplayedProducts([]);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchProducts(nextPage);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts(1, true);
  };

  const applyFilters = () => {
    setPage(1);
    setHasMore(true);
    fetchProducts(1, true);
    setShowFilters(false);
  };

  // Carousel controls
  const scrollCarousel = (dir: 'left' | 'right') => {
    if (!carouselRef.current) return;
    const cardWidth = 280 + 16; // card width + gap
    const scrollAmount = dir === 'left' ? -cardWidth * 2 : cardWidth * 2;
    carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });

    const maxIndex = Math.max(0, featuredProducts.length - 3);
    if (dir === 'left') {
      setCarouselIndex(Math.max(0, carouselIndex - 2));
    } else {
      setCarouselIndex(Math.min(maxIndex, carouselIndex + 2));
    }
  };

  // Wishlist products
  const wishlistProducts = allProducts.filter(p => wishlistSlugs.includes(p.slug));

  return (
    <div className="discover-page">
      {/* ─── Category Navigation ─── */}
      <div className="discover-categories">
        <div className="discover-categories__inner">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setCategory(cat.key)}
              className={`discover-categories__item ${category === cat.key ? 'discover-categories__item--active' : ''}`}
              id={`category-${cat.key}`}
            >
              {cat.icon && <img src={cat.icon} alt="" className="discover-categories__icon" />}
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Featured Carousel ─── */}
      {featuredProducts.length > 0 && !showWishlist && (
        <section className="discover-carousel">
          <div className="discover-carousel__header">
            <h2 className="discover-carousel__title">Featured</h2>
            <div className="discover-carousel__nav">
              <button
                onClick={() => scrollCarousel('left')}
                className="discover-carousel__btn"
                disabled={carouselIndex === 0}
                aria-label="Previous"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={() => scrollCarousel('right')}
                className="discover-carousel__btn"
                disabled={carouselIndex >= featuredProducts.length - 3}
                aria-label="Next"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
          <div className="discover-carousel__track" ref={carouselRef}>
            {featuredProducts.map((product) => (
              <div key={product._id} className="discover-carousel__slide">
                <ProductCard product={product} variant="carousel" />
              </div>
            ))}
          </div>
          {/* Dot Indicators */}
          <div className="discover-carousel__dots">
            {featuredProducts.map((_, i) => (
              <span
                key={i}
                className={`discover-carousel__dot ${i === carouselIndex ? 'discover-carousel__dot--active' : ''}`}
              />
            ))}
          </div>
        </section>
      )}

      {/* ─── Category Banner ─── */}
      {category !== 'all' && (() => {
        const activeCat = CATEGORIES.find(c => c.key === category);
        return activeCat?.banner ? (
          <section className="discover-category-banner">
            <div className="discover-category-banner__inner">
              <img
                src={activeCat.banner}
                alt={activeCat.label}
                className="discover-category-banner__image"
              />
              <div className="discover-category-banner__overlay">
                <img src={activeCat.icon} alt="" className="discover-category-banner__icon" />
                <h2 className="discover-category-banner__title">{activeCat.label}</h2>
              </div>
            </div>
          </section>
        ) : null;
      })()}

      {/* ─── Main Content Area ─── */}
      <div className="discover-main">
        {/* Filters Sidebar (Desktop) */}
        <aside className="discover-sidebar">
          <div className="discover-sidebar__section">
            <h3 className="discover-sidebar__heading">Sort By</h3>
            <div className="discover-sidebar__options">
              {SORT_OPTIONS.map((opt) => (
                <label key={opt.value} className="discover-sidebar__radio">
                  <input
                    type="radio"
                    name="sort"
                    value={opt.value}
                    checked={sort === opt.value}
                    onChange={() => setSort(opt.value)}
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="discover-sidebar__section">
            <h3 className="discover-sidebar__heading">Price Range</h3>
            <div className="discover-sidebar__price-inputs">
              <input
                type="number"
                className="discover-sidebar__input"
                placeholder="Min"
                value={priceRange[0] || ''}
                onChange={(e) => setPriceRange([Number(e.target.value) || 0, priceRange[1]])}
              />
              <span className="discover-sidebar__separator">—</span>
              <input
                type="number"
                className="discover-sidebar__input"
                placeholder="Max"
                value={priceRange[1] >= 10000 ? '' : priceRange[1]}
                onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value) || 10000])}
              />
            </div>
          </div>

          <div className="discover-sidebar__section">
            <h3 className="discover-sidebar__heading">Minimum Rating</h3>
            <div className="discover-sidebar__options">
              {[0, 3, 3.5, 4, 4.5].map((r) => (
                <label key={r} className="discover-sidebar__radio">
                  <input
                    type="radio"
                    name="rating"
                    value={r}
                    checked={minRating === r}
                    onChange={() => setMinRating(r)}
                  />
                  <span>{r === 0 ? 'Any' : `${r}+ ★`}</span>
                </label>
              ))}
            </div>
          </div>

          <button className="discover-sidebar__apply" onClick={applyFilters}>
            Apply Filters
          </button>
        </aside>

        {/* Right Content */}
        <div className="discover-content">
          {/* Search + Filter Toggle Row */}
          <div className="discover-toolbar">
            <form onSubmit={handleSearch} className="discover-search">
              <svg className="discover-search__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
              </svg>
              <input
                type="text"
                className="discover-search__input"
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                id="discover-search"
              />
            </form>

            <button
              className="discover-filter-toggle"
              onClick={() => setShowFilters(!showFilters)}
              aria-label="Toggle filters"
            >
              <SlidersHorizontal size={18} />
              <span>Filters</span>
            </button>

            <button
              className={`discover-wishlist-toggle ${showWishlist ? 'discover-wishlist-toggle--active' : ''}`}
              onClick={() => setShowWishlist(!showWishlist)}
              aria-label="Toggle wishlist"
            >
              <Heart size={18} fill={showWishlist ? '#ff90e8' : 'none'} />
              <span>Wishlist{wishlistSlugs.length > 0 ? ` (${wishlistSlugs.length})` : ''}</span>
            </button>
          </div>

          {/* Tabs */}
          {!showWishlist && (
            <div className="discover-tabs">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`discover-tabs__item ${activeTab === tab.key ? 'discover-tabs__item--active' : ''}`}
                  id={`tab-${tab.key}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          {/* Wishlist View */}
          {showWishlist ? (
            <div className="discover-section">
              <h2 className="discover-section__title">
                <Heart size={20} fill="#ff90e8" stroke="#ff90e8" />
                My Wishlist
              </h2>
              {wishlistProducts.length === 0 ? (
                <div className="discover-empty">
                  <Heart size={48} className="discover-empty__icon" />
                  <p className="discover-empty__text">Your wishlist is empty</p>
                  <p className="discover-empty__sub">Click the heart icon on any product to add it here</p>
                </div>
              ) : (
                <div className="discover-grid">
                  {wishlistProducts.map((product, i) => (
                    <div key={product._id} className="animate-fade-in-up" style={{ animationDelay: `${i * 40}ms` }}>
                      <ProductCard product={product} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Products Grid */}
              {loading ? (
                <div className="discover-grid">
                  {[...Array(PRODUCTS_PER_PAGE)].map((_, i) => (
                    <div key={i} className="product-card-skeleton">
                      <div className="product-card-skeleton__image" />
                      <div className="product-card-skeleton__title" />
                      <div className="product-card-skeleton__meta" />
                      <div className="product-card-skeleton__price" />
                    </div>
                  ))}
                </div>
              ) : displayedProducts.length === 0 ? (
                <div className="discover-empty">
                  <svg className="discover-empty__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="48" height="48">
                    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                  </svg>
                  <p className="discover-empty__text">No products found</p>
                  <p className="discover-empty__sub">Try adjusting your search or filters</p>
                </div>
              ) : (
                <>
                  <div className="discover-grid">
                    {displayedProducts.map((product, i) => (
                      <div key={product._id} className="animate-fade-in-up" style={{ animationDelay: `${i * 40}ms` }}>
                        <ProductCard product={product} />
                      </div>
                    ))}
                  </div>

                  {/* Load More */}
                  {hasMore && (
                    <div className="discover-load-more">
                      <button
                        onClick={handleLoadMore}
                        disabled={loadingMore}
                        className="discover-load-more__btn"
                        id="load-more"
                      >
                        {loadingMore ? 'Loading...' : 'Load more'}
                      </button>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* ─── Mobile Filter Drawer ─── */}
      {showFilters && (
        <>
          <div className="filter-overlay" onClick={() => setShowFilters(false)} />
          <div className="filter-drawer">
            <div className="filter-drawer__header">
              <h3 className="filter-drawer__title">Filters</h3>
              <button onClick={() => setShowFilters(false)} className="filter-drawer__close">
                <X size={20} />
              </button>
            </div>

            <div className="filter-drawer__body">
              <div className="discover-sidebar__section">
                <h3 className="discover-sidebar__heading">Sort By</h3>
                <div className="discover-sidebar__options">
                  {SORT_OPTIONS.map((opt) => (
                    <label key={opt.value} className="discover-sidebar__radio">
                      <input
                        type="radio"
                        name="mobile-sort"
                        value={opt.value}
                        checked={sort === opt.value}
                        onChange={() => setSort(opt.value)}
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="discover-sidebar__section">
                <h3 className="discover-sidebar__heading">Price Range</h3>
                <div className="discover-sidebar__price-inputs">
                  <input
                    type="number"
                    className="discover-sidebar__input"
                    placeholder="Min"
                    value={priceRange[0] || ''}
                    onChange={(e) => setPriceRange([Number(e.target.value) || 0, priceRange[1]])}
                  />
                  <span className="discover-sidebar__separator">—</span>
                  <input
                    type="number"
                    className="discover-sidebar__input"
                    placeholder="Max"
                    value={priceRange[1] >= 10000 ? '' : priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value) || 10000])}
                  />
                </div>
              </div>

              <div className="discover-sidebar__section">
                <h3 className="discover-sidebar__heading">Minimum Rating</h3>
                <div className="discover-sidebar__options">
                  {[0, 3, 3.5, 4, 4.5].map((r) => (
                    <label key={r} className="discover-sidebar__radio">
                      <input
                        type="radio"
                        name="mobile-rating"
                        value={r}
                        checked={minRating === r}
                        onChange={() => setMinRating(r)}
                      />
                      <span>{r === 0 ? 'Any' : `${r}+ ★`}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="filter-drawer__footer">
              <button className="filter-drawer__apply" onClick={applyFilters}>
                Apply Filters
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
