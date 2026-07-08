import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useState, useEffect } from 'react';

interface ProductCardProps {
  product: {
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
  };
  variant?: 'grid' | 'carousel';
}

// Map product types to native_type icons from Gumroad assets
const TYPE_ICONS: Record<string, string> = {
  course: '/asset/assets/images/native_types/course.png',
  digital: '/asset/assets/images/native_types/digital.png',
  ebook: '/asset/assets/images/native_types/ebook.png',
  membership: '/asset/assets/images/native_types/membership.png',
  bundle: '/asset/assets/images/native_types/bundle.png',
  physical: '/asset/assets/images/native_types/physical.png',
  audiobook: '/asset/assets/images/native_types/audiobook.png',
  podcast: '/asset/assets/images/native_types/podcast.png',
  newsletter: '/asset/assets/images/native_types/newsletter.png',
  coffee: '/asset/assets/images/native_types/coffee.png',
  call: '/asset/assets/images/native_types/call.png',
  commission: '/asset/assets/images/native_types/commission.png',
};

function getWishlist(): string[] {
  try {
    return JSON.parse(localStorage.getItem('gumroad_wishlist') || '[]');
  } catch {
    return [];
  }
}

function toggleWishlistItem(slug: string): boolean {
  const list = getWishlist();
  const idx = list.indexOf(slug);
  if (idx > -1) {
    list.splice(idx, 1);
    localStorage.setItem('gumroad_wishlist', JSON.stringify(list));
    return false;
  } else {
    list.push(slug);
    localStorage.setItem('gumroad_wishlist', JSON.stringify(list));
    return true;
  }
}

function StarRating({ rating, count }: { rating: number; count?: number }) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    if (i <= Math.floor(rating)) {
      stars.push(
        <img key={i} src="/asset/assets/images/ratings/star-100-default.svg" alt="★" className="star-rating__svg" />
      );
    } else if (i === Math.ceil(rating) && rating % 1 >= 0.3) {
      stars.push(
        <img key={i} src="/asset/assets/images/ratings/star-50-default.svg" alt="½★" className="star-rating__svg" />
      );
    } else {
      stars.push(
        <img key={i} src="/asset/assets/images/ratings/star-0-default.svg" alt="☆" className="star-rating__svg" />
      );
    }
  }

  return (
    <div className="star-rating">
      {stars}
      {count !== undefined && (
        <span className="star-rating__count">({count})</span>
      )}
    </div>
  );
}

export { StarRating, getWishlist, toggleWishlistItem };

export default function ProductCard({ product, variant = 'grid' }: ProductCardProps) {
  const [wishlisted, setWishlisted] = useState(false);

  useEffect(() => {
    setWishlisted(getWishlist().includes(product.slug));
  }, [product.slug]);

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newState = toggleWishlistItem(product.slug);
    setWishlisted(newState);
    window.dispatchEvent(new CustomEvent('wishlist-changed'));
  };

  const isCarousel = variant === 'carousel';
  const typeIcon = TYPE_ICONS[product.type] || TYPE_ICONS.digital;

  return (
    <Link
      to={`/products/${product.slug}`}
      className={`product-card ${isCarousel ? 'product-card--carousel' : ''}`}
      id={`product-${product.slug}`}
    >
      {/* Cover Image */}
      <div className="product-card__image-wrap">
        <img
          src={product.coverImage || '/asset/assets/images/cover_placeholder.png'}
          alt={product.name}
          className="product-card__image"
          loading="lazy"
        />
        <button
          onClick={handleWishlist}
          className={`product-card__wishlist ${wishlisted ? 'product-card__wishlist--active' : ''}`}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart size={16} fill={wishlisted ? '#ff90e8' : 'none'} stroke={wishlisted ? '#ff90e8' : 'currentColor'} />
        </button>
        {/* Type Badge */}
        {typeIcon && (
          <div className="product-card__type-badge">
            <img src={typeIcon} alt={product.type} className="product-card__type-icon" />
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="product-card__info">
        <h3 className="product-card__title">{product.name}</h3>

        {/* Creator Row */}
        <div className="product-card__creator">
          <img
            src={product.creator?.avatar || '/asset/assets/images/gumroad-default-avatar-5.png'}
            alt={product.creator?.name}
            className="product-card__creator-avatar"
          />
          <span className="product-card__creator-name">{product.creator?.name}</span>
        </div>

        {/* Rating */}
        {product.avgRating > 0 && (
          <StarRating rating={product.avgRating} count={product.reviewCount} />
        )}

        {/* Price */}
        <div className="product-card__price-row">
          <span className="product-card__price">
            {product.price === 0 ? 'Free' : `₹${product.price.toLocaleString('en-IN')}`}
          </span>
        </div>
      </div>
    </Link>
  );
}
