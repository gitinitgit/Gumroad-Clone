import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import api from '../services/api';
import ProductCard from '../components/ProductCard';

const FALLBACK_FEATURED = [
  {
    _id: 'full-stack-nextjs-build-and-deploy',
    name: 'Full-Stack Next.js — Build & Deploy',
    slug: 'full-stack-nextjs-build-and-deploy',
    price: 6999,
    coverImage: '/asset/assets/images/products/fullstack-nextjs.png',
    type: 'course',
    category: 'Development',
    creator: { name: 'Kiran Mehta', avatar: '/asset/assets/images/gumroad-default-avatar-5.png' },
    avgRating: 4.9,
    reviewCount: 237,
    isFeatured: true,
    isDemo: true,
    tags: ['demo', 'nextjs', 'react'],
  },
  {
    _id: 'figma-masterclass-zero-to-pro',
    name: 'Figma Masterclass — Zero to Pro',
    slug: 'figma-masterclass-zero-to-pro',
    price: 2499,
    coverImage: '/asset/assets/images/products/figma-masterclass.png',
    type: 'course',
    category: 'Design',
    creator: { name: 'David Park', avatar: '/asset/assets/images/gumroad-default-avatar-5.png' },
    avgRating: 4.8,
    reviewCount: 156,
    isFeatured: true,
    isDemo: true,
    tags: ['demo', 'figma', 'design'],
  },
  {
    _id: 'react-component-library-pro',
    name: 'React Component Library Pro',
    slug: 'react-component-library-pro',
    price: 3499,
    coverImage: '/asset/assets/images/products/react-components.png',
    type: 'digital',
    category: 'Development',
    creator: { name: 'Jordan Blake', avatar: '/asset/assets/images/gumroad-default-avatar-5.png' },
    avgRating: 4.6,
    reviewCount: 67,
    isFeatured: true,
    isDemo: true,
    tags: ['demo', 'react', 'typescript'],
  },
];

const features = [
  {
    icon: '/asset/assets/images/features/easy.svg',
    title: 'Start in minutes',
    desc: "Upload your product, set a price, and share the link. That's it.",
    color: 'bg-pink/10',
  },
  {
    icon: '/asset/assets/images/features/price-tag.svg',
    title: 'Razorpay Payments',
    desc: 'Accept UPI, cards, netbanking — all major Indian payment methods.',
    color: 'bg-purple/10',
  },
  {
    icon: '/asset/assets/images/features/sales-graph.svg',
    title: 'Built-in analytics',
    desc: 'Track sales, revenue, and product performance in real time.',
    color: 'bg-green/10',
  },
  {
    icon: '/asset/assets/images/features/thumbsup.svg',
    title: 'Secure delivery',
    desc: 'Files are delivered securely to buyers after payment.',
    color: 'bg-orange/10',
  },
];

const creatorCategories = [
  { icon: '/asset/assets/images/features/books-and-writing.svg', label: 'Books & Writing' },
  { icon: '/asset/assets/images/features/design-and-tech.svg', label: 'Design & Tech' },
  { icon: '/asset/assets/images/features/drawing-and-painting.svg', label: 'Drawing & Painting' },
  { icon: '/asset/assets/images/features/games.svg', label: 'Games' },
];

interface Product {
  _id: string;
  name: string;
  slug: string;
  price: number;
  coverImage: string;
  creator: { name: string; avatar: string };
}

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<any[]>(FALLBACK_FEATURED);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeatured();
  }, []);

  const fetchFeatured = async () => {
    try {
      const { data } = await api.get('/products/featured');
      if (data.data && data.data.length > 0) {
        setFeaturedProducts(data.data);
      } else {
        setFeaturedProducts(FALLBACK_FEATURED);
      }
    } catch {
      setFeaturedProducts(FALLBACK_FEATURED);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden min-h-screen flex items-center px-4">
        <div className="max-w-5xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="text-left">
            <p className="text-lg md:text-xl text-gray-600 max-w-xl mb-8">
              Gumroad is the easiest way to sell digital products,
              memberships, and courses.
            </p>
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <Link to="/signup" className="btn-primary text-lg !px-10 !py-4">
                Start selling <ArrowRight size={20} />
              </Link>
              <Link to="/discover" className="btn-outline text-lg !px-10 !py-4">
                Discover products
              </Link>
            </div>
          </div>

          <div className="hidden lg:flex justify-center">
            <img
              src="/asset/assets/images/about/new-sale.svg"
              alt="Gumroad - Make a sale"
              className="w-full max-w-md"
            />
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="min-h-screen flex items-center px-4 bg-white border-y-2 border-gumroad-black">
        <div className="max-w-5xl mx-auto w-full">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-3xl font-bold mb-2">Featured Products</h2>
              <p className="text-gray-500">Handpicked digital goods for you</p>
            </div>
            <Link to="/discover" className="text-pink font-bold flex items-center gap-1 hover:underline">
              View all <ArrowRight size={16} />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="product-card-skeleton" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredProducts.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>



      {/* Features Grid */}
      <section className="min-h-screen flex items-center px-4 relative">
        <div className="max-w-5xl mx-auto w-full relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Everything you need to sell</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-14">
            {features.map((feature) => (
              <div key={feature.title} className="card-hover">
                <div className={`w-16 h-16 ${feature.color} rounded-gum border-2 border-gumroad-black flex items-center justify-center mb-4 p-2`}>
                  <img src={feature.icon} alt={feature.title} className="w-full h-full object-contain" />
                </div>
                <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
