import { useState, useEffect } from 'react';
import api from '../../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardStats {
  totalRevenue: number;
  totalSales: number;
  totalProducts: number;
  publishedProducts: number;
  recentSales: Array<{ _id: string; revenue: number; count: number }>;
  topProducts: Array<{ name: string; revenue: number; sales: number; coverImage: string }>;
}

const statCards = [
  { key: 'revenue', label: 'Revenue', icon: '/asset/assets/images/nav/money-circle.svg', color: 'bg-green/20' },
  { key: 'sales', label: 'Sales', icon: '/asset/assets/images/nav/cart.svg', color: 'bg-pink/20' },
  { key: 'products', label: 'Products', icon: '/asset/assets/images/nav/box-bankers.svg', color: 'bg-purple/20' },
  { key: 'published', label: 'Published', icon: '/asset/assets/images/nav/send-out.svg', color: 'bg-orange/20' },
];

export default function DashboardHome() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get('/analytics/dashboard');
        setStats(data.data);
      } catch {} finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const getStatValue = (key: string) => {
    switch (key) {
      case 'revenue': return `₹${((stats?.totalRevenue || 0) / 100).toFixed(0)}`;
      case 'sales': return stats?.totalSales || 0;
      case 'products': return stats?.totalProducts || 0;
      case 'published': return stats?.publishedProducts || 0;
      default: return 0;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card animate-pulse"><div className="h-20 bg-gray-200 rounded" /></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold animate-fade-in-up">Dashboard</h1>

      {/* Stats Cards — with Gumroad nav icons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <div key={stat.key} className="card animate-fade-in-up" style={{ animationDelay: `${i * 100}ms` }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500">{stat.label}</span>
              <div className={`w-10 h-10 rounded-gum flex items-center justify-center ${stat.color}`}>
                <img src={stat.icon} alt="" className="w-5 h-5 opacity-70" />
              </div>
            </div>
            <p className="text-3xl font-bold">{getStatValue(stat.key)}</p>
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
      {stats?.recentSales && stats.recentSales.length > 0 && (
        <div className="card animate-fade-in-up delay-200">
          <h2 className="font-bold mb-4">Revenue — Last 30 Days</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats.recentSales}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e1" />
              <XAxis dataKey="_id" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v / 100).toFixed(0)}`} />
              <Tooltip formatter={(value: number) => [`₹${(value / 100).toFixed(0)}`, 'Revenue']} />
              <Line type="monotone" dataKey="revenue" stroke="#ff90e8" strokeWidth={3} dot={{ fill: '#ff90e8', strokeWidth: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Empty state when no data */}
      {(!stats?.recentSales || stats.recentSales.length === 0) && (
        <div className="card text-center py-12 animate-fade-in-up delay-200">
          <img
            src="/asset/assets/images/placeholders/dashboard.png"
            alt="Dashboard"
            className="w-32 h-32 mx-auto mb-4 opacity-50"
          />
          <h2 className="font-bold mb-2">No sales data yet</h2>
          <p className="text-sm text-gray-500">Once you start selling, your revenue chart will appear here.</p>
        </div>
      )}

      {/* Top Products */}
      {stats?.topProducts && stats.topProducts.length > 0 && (
        <div className="card animate-fade-in-up delay-300">
          <h2 className="font-bold mb-4">Top Products</h2>
          <div className="space-y-3">
            {stats.topProducts.map((product, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-gum hover:bg-gray-50 transition-colors">
                <span className="text-lg font-bold text-gray-300 w-6">#{i + 1}</span>
                <img
                  src={product.coverImage || '/asset/assets/images/cover_placeholder.png'}
                  alt={product.name}
                  className="w-12 h-12 rounded-gum border-2 border-gumroad-black object-cover"
                />
                <div className="flex-1">
                  <p className="font-bold text-sm">{product.name}</p>
                  <p className="text-xs text-gray-500">{product.sales} sales</p>
                </div>
                <span className="font-bold text-green">₹{(product.revenue / 100).toFixed(0)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
