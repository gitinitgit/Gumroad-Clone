import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { Eye, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Product {
  _id: string;
  name: string;
  slug: string;
  coverImage: string;
  price: number;
  status: string;
  type: string;
  salesCount: number;
  viewsCount: number;
}

export default function ProductsListPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    try {
      const { data } = await api.get('/products/my');
      setProducts(data.data || []);
    } catch {} finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Archive this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success('Product archived');
      setProducts((prev) => prev.filter((p) => p._id !== id));
    } catch {
      toast.error('Failed to archive product');
    }
  };

  const statusColor: Record<string, string> = {
    draft: 'badge bg-gray-200',
    published: 'badge-green',
    unpublished: 'badge bg-red-100 text-gumroad-red',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Products</h1>
        <Link to="/dashboard/products/new" className="btn-primary flex items-center gap-2">
          <img src="/asset/assets/images/add-icon.svg" alt="" className="w-4 h-4 brightness-0" />
          New Product
        </Link>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="flex gap-4"><div className="w-20 h-20 bg-gray-200 rounded-gum" /><div className="flex-1 space-y-2"><div className="h-4 bg-gray-200 rounded w-1/3" /><div className="h-3 bg-gray-200 rounded w-1/4" /></div></div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="card text-center py-16">
          <img
            src="/asset/assets/images/placeholders/start-selling.png"
            alt="Start selling"
            className="w-24 h-24 mx-auto mb-6 opacity-60"
          />
          <p className="text-xl font-bold mb-2">No products yet</p>
          <p className="text-gray-500 mb-6">Create your first product and start selling!</p>
          <Link to="/dashboard/products/new" className="btn-primary">
            <img src="/asset/assets/images/add-icon.svg" alt="" className="w-4 h-4 brightness-0" />
            Create Product
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {products.map((product, i) => (
            <div key={product._id} className="card flex items-center gap-4 animate-fade-in-up" style={{ animationDelay: `${i * 50}ms` }}>
              <img
                src={product.coverImage || '/asset/assets/images/cover_placeholder.png'}
                alt={product.name}
                className="w-20 h-20 rounded-gum border-2 border-gumroad-black object-cover shrink-0"
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm truncate">{product.name}</h3>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                  <span className={statusColor[product.status] || 'badge'}>{product.status}</span>
                  <span className="capitalize">{product.type}</span>
                  <span>₹{product.price}</span>
                  <span>{product.salesCount} sales</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link to={`/products/${product.slug}`} className="p-2 hover:bg-gray-100 rounded-gum" title="View">
                  <Eye size={16} />
                </Link>
                <Link to={`/dashboard/products/${product._id}/edit`} className="p-2 hover:bg-gray-100 rounded-gum" title="Edit">
                  <img src="/asset/assets/images/pencil-icon.svg" alt="Edit" className="w-4 h-4" />
                </Link>
                <button onClick={() => handleDelete(product._id)} className="p-2 hover:bg-red-50 rounded-gum text-gumroad-red" title="Archive">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
