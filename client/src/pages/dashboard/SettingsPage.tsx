import { useState } from 'react';
import { useUserStore } from '../../store/auth.store';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Save } from 'lucide-react';

export default function SettingsPage() {
  const { localUser: user, updateLocalUser: updateUser } = useUserStore();
  const [form, setForm] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    username: user?.username || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await api.patch('/users/me', form);
      updateUser(data.data);
      toast.success('Settings saved');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <div className="card space-y-5 bg-noise">
        <h2 className="font-bold flex items-center gap-2">
          <img src="/asset/assets/images/nav/settings.svg" alt="" className="w-5 h-5 opacity-60" />
          Profile
        </h2>
        <div>
          <label className="label">Name</label>
          <input className="input" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
        </div>
        <div>
          <label className="label">Username</label>
          <input className="input" value={form.username} onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))} />
        </div>
        <div>
          <label className="label">Bio</label>
          <textarea className="input min-h-[80px]" value={form.bio} onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))} />
        </div>
        <button onClick={handleSave} className="btn-primary" disabled={saving}>
          <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
