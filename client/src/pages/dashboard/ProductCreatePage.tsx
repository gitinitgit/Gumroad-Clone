import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';

const PRODUCT_TYPES = [
  { key: 'digital', label: 'Digital', icon: '/asset/assets/images/native_types/digital.png' },
  { key: 'course', label: 'Course', icon: '/asset/assets/images/native_types/course.png' },
  { key: 'ebook', label: 'E-Book', icon: '/asset/assets/images/native_types/ebook.png' },
  { key: 'membership', label: 'Membership', icon: '/asset/assets/images/native_types/membership.png' },
  { key: 'newsletter', label: 'Newsletter', icon: '/asset/assets/images/native_types/newsletter.png' },
  { key: 'podcast', label: 'Podcast', icon: '/asset/assets/images/native_types/podcast.png' },
  { key: 'audiobook', label: 'Audiobook', icon: '/asset/assets/images/native_types/audiobook.png' },
  { key: 'physical', label: 'Physical', icon: '/asset/assets/images/native_types/physical.png' },
  { key: 'bundle', label: 'Bundle', icon: '/asset/assets/images/native_types/bundle.png' },
  { key: 'coffee', label: 'Coffee', icon: '/asset/assets/images/native_types/coffee.png' },
];

export default function ProductCreatePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: 0,
    type: 'digital',
    tags: '',
    callToAction: 'I want this!',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      };
      const { data } = await api.post('/products', payload);
      toast.success('Product created!');
      navigate(`/dashboard/products/${data.data._id}/edit`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6 animate-fade-in-up">New Product</h1>

      <form onSubmit={handleSubmit} className="card space-y-5 animate-fade-in-up delay-200">
        {/* Product Type — with Gumroad native type icons */}
        <div>
          <label className="label">Product type</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {PRODUCT_TYPES.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setForm((p) => ({ ...p, type: t.key }))}
                className={`flex items-center gap-2 p-3 rounded-gum border-2 border-gumroad-black text-sm font-bold transition-all ${
                  form.type === t.key ? 'bg-pink shadow-gum-sm' : 'bg-white hover:bg-gray-50'
                }`}
              >
                <img src={t.icon} alt="" className="w-5 h-5" />
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="product-name" className="label">Name</label>
          <input
            id="product-name"
            className="input"
            placeholder="My awesome product"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            required
          />
        </div>

        <div>
          <label htmlFor="product-desc" className="label">Description</label>
          <textarea
            id="product-desc"
            className="input min-h-[120px]"
            placeholder="What is this product about?"
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="product-price" className="label">Price (₹)</label>
            <input
              id="product-price"
              type="number"
              className="input"
              min="0"
              step="1"
              value={form.price}
              onChange={(e) => setForm((p) => ({ ...p, price: Number(e.target.value) }))}
              required
            />
          </div>
          <div>
            <label htmlFor="product-cta" className="label">Button text</label>
            <input
              id="product-cta"
              className="input"
              value={form.callToAction}
              onChange={(e) => setForm((p) => ({ ...p, callToAction: e.target.value }))}
            />
          </div>
        </div>

        <div>
          <label htmlFor="product-tags" className="label">Tags (comma separated)</label>
          <input
            id="product-tags"
            className="input"
            placeholder="design, template, ui"
            value={form.tags}
            onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" className="btn-primary flex-1" disabled={loading}>
            {loading ? 'Creating...' : 'Create Product'}
          </button>
          <button type="button" className="btn-outline" onClick={() => navigate(-1)}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
