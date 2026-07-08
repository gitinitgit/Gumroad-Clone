import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Trash2, Save, Globe, EyeOff } from 'lucide-react';

export default function ProductEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data } = await api.get(`/products/${id}`);
        setProduct(data.data);
      } catch { toast.error('Product not found'); navigate('/dashboard/products'); }
      finally { setLoading(false); }
    };
    if (id) fetchProduct();
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch(`/products/${id}`, {
        name: product.name,
        description: product.description,
        price: product.price,
        coverImage: product.coverImage,
        callToAction: product.callToAction,
        tags: product.tags,
      });
      toast.success('Product saved');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const handlePublish = async (status: string) => {
    try {
      await api.patch(`/products/${id}/status`, { status });
      setProduct((p: any) => ({ ...p, status }));
      toast.success(`Product ${status}`);
    } catch { toast.error('Status update failed'); }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      await api.post(`/products/${id}/files`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('File uploaded');
      const { data } = await api.get(`/products/${id}`);
      setProduct(data.data);
    } catch { toast.error('Upload failed'); }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('cover', file);
    try {
      const { data } = await api.post('/upload/cover', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      await api.patch(`/products/${id}`, { coverImage: data.data.coverUrl });
      setProduct((p: any) => ({ ...p, coverImage: data.data.coverUrl }));
      toast.success('Cover updated');
    } catch { toast.error('Cover upload failed'); }
  };

  if (loading || !product) {
    return <div className="animate-pulse"><div className="h-8 bg-gray-200 rounded w-1/3 mb-6" /><div className="card"><div className="h-40 bg-gray-200 rounded" /></div></div>;
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Edit Product</h1>
        <div className="flex gap-2">
          {product.status !== 'published' ? (
            <button onClick={() => handlePublish('published')} className="btn-primary text-sm"><Globe size={16} /> Publish</button>
          ) : (
            <button onClick={() => handlePublish('unpublished')} className="btn-outline text-sm"><EyeOff size={16} /> Unpublish</button>
          )}
          <button onClick={handleSave} className="btn-dark text-sm" disabled={saving}>
            <Save size={16} /> {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Cover Image — with Gumroad placeholder */}
      <div className="card">
        <label className="label mb-3">Cover Image</label>
        <div className="relative group">
          <img
            src={product.coverImage || '/asset/assets/images/cover_placeholder.png'}
            alt="Cover"
            className="w-full aspect-video object-cover rounded-gum border-2 border-gumroad-black"
          />
          <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-gum cursor-pointer">
            <span className="btn-primary text-sm flex items-center gap-2">
              <img src="/asset/assets/images/file_upload.svg" alt="" className="w-4 h-4 brightness-0" />
              Change Cover
            </span>
            <input type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
          </label>
        </div>
      </div>

      {/* Details */}
      <div className="card space-y-4">
        <div>
          <label className="label">Name</label>
          <input className="input" value={product.name} onChange={(e) => setProduct({ ...product, name: e.target.value })} />
        </div>
        <div>
          <label className="label">Description</label>
          <textarea className="input min-h-[150px]" value={product.description} onChange={(e) => setProduct({ ...product, description: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Price (₹)</label>
            <input type="number" className="input" min="0" value={product.price} onChange={(e) => setProduct({ ...product, price: Number(e.target.value) })} />
          </div>
          <div>
            <label className="label">Call to Action</label>
            <input className="input" value={product.callToAction} onChange={(e) => setProduct({ ...product, callToAction: e.target.value })} />
          </div>
        </div>
      </div>

      {/* Files */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <label className="label !mb-0">Product Files</label>
          <label className="btn-outline text-sm cursor-pointer flex items-center gap-2">
            <img src="/asset/assets/images/file_upload.svg" alt="" className="w-4 h-4" />
            Upload File
            <input type="file" className="hidden" onChange={handleFileUpload} />
          </label>
        </div>
        {product.files?.length > 0 ? (
          <div className="space-y-2">
            {product.files.map((file: any) => (
              <div key={file._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-gum border border-gray-200">
                <div className="flex items-center gap-3">
                  <img src="/asset/assets/images/folder.svg" alt="" className="w-5 h-5 opacity-60" />
                  <div>
                    <p className="text-sm font-bold">{file.fileName}</p>
                    <p className="text-xs text-gray-500">{(file.fileSize / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                <button
                  onClick={async () => {
                    await api.delete(`/products/${id}/files/${file._id}`);
                    setProduct((p: any) => ({ ...p, files: p.files.filter((f: any) => f._id !== file._id) }));
                    toast.success('File removed');
                  }}
                  className="text-gumroad-red hover:bg-red-50 p-2 rounded-gum"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <img src="/asset/assets/images/file_upload.svg" alt="" className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm text-gray-500">No files uploaded yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
