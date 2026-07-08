import { useState, useEffect } from 'react';
import api from '../../services/api';

interface Sale {
  _id: string;
  product: { name: string; coverImage: string };
  buyer: { name: string; email: string; avatar: string };
  amountCents: number;
  creatorEarningsCents: number;
  createdAt: string;
}

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSales = async () => {
      try {
        const { data } = await api.get('/purchases/sales');
        setSales(data.data || []);
      } catch {} finally { setLoading(false); }
    };
    fetchSales();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Sales</h1>

      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="card animate-pulse"><div className="h-16 bg-gray-200 rounded" /></div>)}</div>
      ) : sales.length === 0 ? (
        <div className="card text-center py-16">
          <img
            src="/asset/assets/images/placeholders/sales.png"
            alt="No sales"
            className="w-32 h-32 mx-auto mb-6 opacity-50"
          />
          <p className="text-xl font-bold mb-2">No sales yet</p>
          <p className="text-gray-500">When someone buys your product, it will appear here.</p>
        </div>
      ) : (
        <div className="card overflow-hidden !p-0">
          <table className="w-full">
            <thead className="bg-gray-50 border-b-2 border-gumroad-black">
              <tr>
                <th className="text-left text-xs font-bold p-4">Product</th>
                <th className="text-left text-xs font-bold p-4">Buyer</th>
                <th className="text-right text-xs font-bold p-4">Amount</th>
                <th className="text-right text-xs font-bold p-4">Earnings</th>
                <th className="text-right text-xs font-bold p-4">Date</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((sale) => (
                <tr key={sale._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <img src={sale.product?.coverImage || '/asset/assets/images/cover_placeholder.png'} alt="" className="w-10 h-10 rounded-gum border border-gumroad-black object-cover" />
                      <span className="text-sm font-bold">{sale.product?.name}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <img src={sale.buyer?.avatar || '/asset/assets/images/gumroad-default-avatar-5.png'} alt="" className="w-6 h-6 rounded-full" />
                      <div>
                        <p className="text-sm">{sale.buyer?.name}</p>
                        <p className="text-xs text-gray-400">{sale.buyer?.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-right text-sm">₹{(sale.amountCents / 100).toFixed(0)}</td>
                  <td className="p-4 text-right text-sm font-bold text-green">₹{(sale.creatorEarningsCents / 100).toFixed(0)}</td>
                  <td className="p-4 text-right text-xs text-gray-500">{new Date(sale.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
