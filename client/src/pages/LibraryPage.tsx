import { useState, useEffect } from 'react';
import api from '../services/api';
import { Download, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Purchase {
  _id: string;
  product: {
    _id: string;
    name: string;
    slug: string;
    coverImage: string;
    type: string;
    files: Array<{ _id: string; fileName: string; fileSize: number }>;
  };
  seller: { name: string; username: string; avatar: string };
  amountCents: number;
  createdAt: string;
}

export default function LibraryPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLibrary = async () => {
      try {
        const { data } = await api.get('/purchases/library');
        setPurchases(data.data || []);
      } catch {} finally { setLoading(false); }
    };
    fetchLibrary();
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-8 animate-fade-in-up">My Library</h1>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => <div key={i} className="card animate-pulse"><div className="h-40 bg-gray-200 rounded-gum mb-3" /><div className="h-4 bg-gray-200 rounded w-3/4" /></div>)}
        </div>
      ) : purchases.length === 0 ? (
        <div className="card text-center py-20">
          <img
            src="/asset/assets/images/placeholders/library.png"
            alt="Empty library"
            className="w-40 h-40 mx-auto mb-6 opacity-50"
          />
          <p className="text-xl font-bold mb-2">Your library is empty</p>
          <p className="text-gray-500 mb-6">Products you purchase will appear here</p>
          <Link to="/discover" className="btn-primary">Browse Products</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {purchases.map((purchase, i) => (
            <div key={purchase._id} className="card animate-fade-in-up" style={{ animationDelay: `${i * 50}ms` }}>
              <img
                src={purchase.product?.coverImage || '/asset/assets/images/cover_placeholder.png'}
                alt={purchase.product?.name}
                className="w-full aspect-[4/3] object-cover rounded-gum border-2 border-gumroad-black mb-4"
              />
              <h3 className="font-bold text-sm mb-1">{purchase.product?.name}</h3>
              <div className="flex items-center gap-2 mb-3">
                <img src={purchase.seller?.avatar || '/asset/assets/images/gumroad-default-avatar-5.png'} alt="" className="w-5 h-5 rounded-full" />
                <span className="text-xs text-gray-500">{purchase.seller?.name}</span>
              </div>
              <div className="flex gap-2">
                {purchase.product?.files?.map((file) => (
                  <a
                    key={file._id}
                    href={`/api/v1/purchases/${purchase._id}/download/${file._id}`}
                    className="btn-primary text-xs !py-2 !px-3 flex-1"
                  >
                    <Download size={14} /> {file.fileName.slice(0, 15)}
                  </a>
                ))}
                <Link to={`/products/${purchase.product?.slug}`} className="btn-outline text-xs !py-2 !px-3">
                  <ExternalLink size={14} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
