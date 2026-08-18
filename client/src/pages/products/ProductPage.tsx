import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { ShoppingCart, Share2, Heart, ChevronLeft, Plus } from 'lucide-react';
import { useUserStore } from '../../store/auth.store';
import { useCartStore } from '../../store/cart.store';
import { StarRating, toggleWishlistItem, getWishlist } from '../../components/ProductCard';
import ReactMarkdown from 'react-markdown';

interface ReviewData {
  author: string;
  rating: number;
  text: string;
  date: string;
}

interface ProductData {
  _id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  price: number;
  coverImage: string;
  type: string;
  tags: string[];
  category: string;
  isDemo?: boolean;
  creator: { _id: string; name: string; username: string; avatar: string; bio: string };
  avgRating: number;
  reviewCount: number;
  salesCount: number;
  viewsCount: number;
  callToAction: string;
  images?: string[];
  reviews?: ReviewData[];
}

function RatingBreakdown({ reviews }: { reviews: ReviewData[] }) {
  const total = reviews.length;
  const counts = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => Math.floor(r.rating) === star).length,
  }));

  return (
    <div className="rating-breakdown">
      {counts.map(({ star, count }) => {
        const pct = total > 0 ? (count / total) * 100 : 0;
        return (
          <div key={star} className="rating-breakdown__row">
            <span className="rating-breakdown__label">{star} star{star !== 1 ? 's' : ''}</span>
            <div className="rating-breakdown__bar">
              <div className="rating-breakdown__fill" style={{ width: `${pct}%` }} />
            </div>
            <span className="rating-breakdown__pct">{Math.round(pct)}%</span>
          </div>
        );
      })}
    </div>
  );
}

export default function ProductPage() {
  const { slug } = useParams();
  const [product, setProduct] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const { localUser } = useUserStore();
  const { addItem, items: cartItems } = useCartStore();

  const isInCart = cartItems.some((i) => i.slug === slug);

  useEffect(() => {
    if (slug) {
      fetchProduct();
      setWishlisted(getWishlist().includes(slug));
    }
  }, [slug]);

  const fetchProduct = async () => {
    try {
      const { data } = await api.get(`/products/slug/${slug}`);
      setProduct(data.data);
    } catch {
      toast.error('Product not found');
    } finally {
      setLoading(false);
    }
  };

  const handleBuy = async () => {
    if (!localUser) {
      toast.error('Please log in to purchase');
      return;
    }

    if (!(window as any).Razorpay) {
      toast.error('Payment system is loading. Please try again.');
      return;
    }

    setBuying(true);
    try {
      const { data } = await api.post('/checkout/create-order', {
        items: [{ productId: product!._id }],
      });

      const { razorpayOrderId, razorpayKeyId, amount } = data.data;

      const options = {
        key: razorpayKeyId,
        amount,
        currency: 'INR',
        name: 'Gumroad',
        description: product!.name,
        order_id: razorpayOrderId,
        handler: async (response: any) => {
          try {
            await api.post('/checkout/verify-payment', {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            toast.success('Purchase successful! 🎉');
            window.location.href = '/checkout/success';
          } catch {
            toast.error('Payment verification failed');
          }
        },
        prefill: {},
        theme: { color: '#ff90e8' },
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to initiate payment. Please try again.';
      toast.error(message);
    } finally {
      setBuying(false);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;
    addItem({
      _id: product._id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      coverImage: product.coverImage,
      creator: {
        name: product.creator?.name || 'Creator',
        avatar: product.creator?.avatar || '/asset/assets/images/gumroad-default-avatar-5.png',
      },
    });
    toast.success('Added to cart!');
  };

  const handleWishlist = () => {
    if (!slug) return;
    const newState = toggleWishlistItem(slug);
    setWishlisted(newState);
    window.dispatchEvent(new CustomEvent('wishlist-changed'));
    toast.success(newState ? 'Added to wishlist' : 'Removed from wishlist');
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    } catch {
      toast.error('Failed to copy link');
    }
  };

  if (loading) {
    return (
      <div className="pdp-loading">
        <div className="pdp-loading__image" />
        <div className="pdp-loading__info">
          <div className="pdp-loading__title" />
          <div className="pdp-loading__text" />
          <div className="pdp-loading__text pdp-loading__text--short" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="pdp-not-found">
        <h1>Product not found</h1>
        <Link to="/discover" className="btn-primary">Browse Products</Link>
      </div>
    );
  }

  const images = product.images && product.images.length > 0 ? product.images : [product.coverImage];
  const reviews = product.reviews || [];

  return (
    <div className="pdp">
      {/* Breadcrumb */}
      <div className="pdp-breadcrumb">
        <Link to="/discover" className="pdp-breadcrumb__link">
          <ChevronLeft size={16} /> Discover
        </Link>
        {product.category && (
          <>
            <span className="pdp-breadcrumb__sep">/</span>
            <span className="pdp-breadcrumb__current">{product.category}</span>
          </>
        )}
      </div>

      <div className="pdp-layout">
        {/* ─── Left Column: Product Details ─── */}
        <div className="pdp-main">
          {/* Image Gallery */}
          <div className="pdp-gallery">
            <div className="pdp-gallery__main">
              <img
                src={images[selectedImage] || '/asset/assets/images/cover_placeholder.png'}
                alt={product.name}
                className="pdp-gallery__image"
              />
            </div>
            {images.length > 1 && (
              <div className="pdp-gallery__thumbs">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`pdp-gallery__thumb ${i === selectedImage ? 'pdp-gallery__thumb--active' : ''}`}
                  >
                    <img src={img} alt={`${product.name} view ${i + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Title + Creator */}
          <div className="pdp-header">
            {(product.isDemo || product.tags?.some(t => t.toLowerCase() === 'demo')) && (
              <span className="pdp-demo-badge">Demo Product</span>
            )}
            <h1 className="pdp-header__title">{product.name}</h1>
            <div className="pdp-header__meta">
              <div className="pdp-creator">
                <img
                  src={product.creator?.avatar || '/asset/assets/images/gumroad-default-avatar-5.png'}
                  alt={product.creator?.name}
                  className="pdp-creator__avatar"
                />
                <span className="pdp-creator__name">{product.creator?.name}</span>
              </div>
              {product.avgRating > 0 && (
                <div className="pdp-header__rating">
                  <StarRating rating={product.avgRating} count={product.reviewCount} />
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="pdp-description">
            <div className="prose">
              <ReactMarkdown>{product.description || 'No description provided.'}</ReactMarkdown>
            </div>
          </div>

          {/* Ratings & Reviews */}
          {(reviews.length > 0 || product.avgRating > 0) && (
            <div className="pdp-reviews">
              <h2 className="pdp-reviews__title">Ratings</h2>

              <div className="pdp-reviews__summary">
                <div className="pdp-reviews__score">
                  <span className="pdp-reviews__avg">★ {product.avgRating.toFixed(1)}</span>
                  <span className="pdp-reviews__total">({product.reviewCount} rating{product.reviewCount !== 1 ? 's' : ''})</span>
                </div>
                {reviews.length > 0 && <RatingBreakdown reviews={reviews} />}
              </div>

              {/* Individual Reviews */}
              {reviews.length > 0 && (
                <div className="pdp-reviews__list">
                  {reviews.map((review, i) => (
                    <div key={i} className="pdp-review">
                      <div className="pdp-review__header">
                        <StarRating rating={review.rating} />
                        <span className="pdp-review__date">
                          {new Date(review.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <p className="pdp-review__text">{review.text}</p>
                      <p className="pdp-review__author">{review.author}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ─── Right Column: Purchase Card ─── */}
        <aside className="pdp-sidebar">
          <div className="pdp-purchase-card">
            {/* Price */}
            <div className="pdp-purchase-card__price">
              {product.price === 0 ? 'Free' : `₹${product.price.toLocaleString('en-IN')}`}
            </div>

            {/* Buy Button */}
            <button
              onClick={handleBuy}
              disabled={buying}
              className="pdp-purchase-card__buy"
              id="buy-button"
            >
              <ShoppingCart size={18} />
              {buying ? 'Processing...' : product.callToAction || 'I want this!'}
            </button>

            {/* Add to Cart */}
            <button
              onClick={handleAddToCart}
              disabled={isInCart}
              className="pdp-purchase-card__add-cart"
              id="add-to-cart"
            >
              <Plus size={16} />
              {isInCart ? 'Already in cart' : 'Add to cart'}
            </button>

            {/* Add to Wishlist */}
            <button
              onClick={handleWishlist}
              className={`pdp-purchase-card__wishlist ${wishlisted ? 'pdp-purchase-card__wishlist--active' : ''}`}
            >
              <Heart size={16} fill={wishlisted ? '#ff90e8' : 'none'} />
              {wishlisted ? 'In your wishlist' : 'Add to wishlist'}
            </button>

            {/* Share */}
            <button onClick={handleShare} className="pdp-purchase-card__share">
              <Share2 size={16} />
              Share
            </button>

            {/* Info */}
            <div className="pdp-purchase-card__info">
              <p>No refunds allowed</p>
            </div>

            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <div className="pdp-purchase-card__tags">
                {product.tags.map((tag) => (
                  <Link key={tag} to={`/discover?search=${tag}`} className="pdp-tag">
                    {tag}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
