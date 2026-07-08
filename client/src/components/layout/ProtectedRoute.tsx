import { useUser, RedirectToSignIn } from '@clerk/clerk-react';
import { useUserStore } from '../../store/auth.store';
import { ArrowRight } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useState } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { isLoaded, isSignedIn } = useUser();
  const { localUser, isLoading, updateLocalUser } = useUserStore();
  const [upgrading, setUpgrading] = useState(false);

  // Wait for Clerk to load
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-pink border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Not signed in — redirect to Clerk sign-in
  if (!isSignedIn) {
    return <RedirectToSignIn />;
  }

  // If role is required, wait for local user sync
  if (requiredRole && isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-pink border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Check role — show upgrade prompt instead of silent redirect
  if (requiredRole && localUser && localUser.role !== requiredRole && localUser.role !== 'admin') {
    const handleUpgrade = async () => {
      setUpgrading(true);
      try {
        const { data } = await api.patch('/users/me/upgrade-creator');
        updateLocalUser({ role: 'creator' });
        toast.success('Welcome to the creator dashboard! 🎉');
      } catch {
        toast.error('Failed to upgrade account');
      } finally {
        setUpgrading(false);
      }
    };

    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gumroad-white">
        <div className="card max-w-md text-center animate-fade-in-up">
          <img
            src="/asset/assets/images/about/exciting.svg"
            alt="Become a creator"
            className="w-20 h-20 mx-auto mb-6"
          />
          <h1 className="text-2xl font-bold mb-3">Become a Creator</h1>
          <p className="text-gray-500 mb-6 leading-relaxed">
            Upgrade your account to start selling digital products, track analytics, and grow your business.
          </p>
          <button
            onClick={handleUpgrade}
            disabled={upgrading}
            className="btn-primary w-full text-lg !py-4 mb-3"
          >
            {upgrading ? 'Upgrading...' : 'Start selling'} <ArrowRight size={20} />
          </button>
          <a href="/" className="text-sm text-gray-500 hover:text-pink transition-colors">
            ← Back to store
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
