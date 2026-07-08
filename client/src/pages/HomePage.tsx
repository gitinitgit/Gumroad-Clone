import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShoppingCart } from 'lucide-react';
import api from '../services/api';

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
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeatured();
  }, []);

  const fetchFeatured = async () => {
    try {
      const { data } = await api.get('/products/featured');
      setFeaturedProducts(data.data || []);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-32 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="text-left">
            <div className="inline-block mb-6">
              <span className="badge-pink text-sm animate-pulse-glow">$</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6 animate-fade-in-up">
              Go from <span className="text-pink">zero</span> to{' '}
              <span className="bg-gumroad-black text-gumroad-white px-3 py-1 rounded-gum inline-block">$1</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-xl mb-10 animate-fade-in-up delay-200">
              Gumroad is the easiest way to sell digital products, memberships, and courses.
              Earn your first dollar online today.
            </p>
            <div className="flex flex-col sm:flex-row items-start gap-4 animate-fade-in-up delay-300">
              <Link to="/signup" className="btn-primary text-lg !px-10 !py-4">
                Start selling <ArrowRight size={20} />
              </Link>
              <Link to="/discover" className="btn-outline text-lg !px-10 !py-4">
                Discover products
              </Link>
            </div>
          </div>

          <div className="hidden lg:block relative animate-fade-in-up delay-400">
            <img
              src="/asset/assets/images/about/new-sale.svg"
              alt="Gumroad - Make a sale"
              className="w-full max-w-md mx-auto"
            />
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-20 px-4 bg-white border-y-2 border-gumroad-black">
        <div className="max-w-5xl mx-auto">
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
                <div key={i} className="card animate-pulse h-64" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredProducts.map((product) => (
                <Link key={product._id} to={`/products/${product.slug}`} className="card-hover">
                  <div className="aspect-video bg-gray-100 rounded-gum mb-4 overflow-hidden border-2 border-gumroad-black">
                    <img src={product.coverImage} alt={product.name} className="w-full h-full object-cover" />
                  </div>
                  <h3 className="font-bold text-sm mb-1 line-clamp-1">{product.name}</h3>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-500">By {product.creator?.name}</span>
                    <span className="badge-pink text-xs">₹{product.price}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>



      {/* Features Grid */}
      <section className="py-20 md:py-28 px-4 relative">
        <div className="max-w-5xl mx-auto relative z-10">
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
