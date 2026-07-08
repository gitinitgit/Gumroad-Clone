import { Link } from 'react-router-dom';
import { useUser, useAuth, SignedIn, SignedOut, UserButton } from '@clerk/clerk-react';
import { useUserStore } from '../../store/auth.store';
import { useCartStore } from '../../store/cart.store';
import { X, ShoppingCart } from 'lucide-react';
import { useState, useEffect } from 'react';
import { setAuthInterceptor } from '../../services/api';

export default function Navbar() {
  const { isSignedIn } = useUser();
  const { getToken } = useAuth();
  const { syncUser } = useUserStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [interceptorSet, setInterceptorSet] = useState(false);
  const { toggleCart, getCount } = useCartStore();
  const cartCount = getCount();

  // Set up the auth interceptor once
  useEffect(() => {
    if (!interceptorSet) {
      setAuthInterceptor(getToken);
      setInterceptorSet(true);
    }
  }, [getToken, interceptorSet]);

  // Sync user on sign in
  useEffect(() => {
    if (isSignedIn && interceptorSet) {
      syncUser();
    }
  }, [isSignedIn, interceptorSet, syncUser]);

  return (
    <nav className="sticky top-0 z-50 bg-gumroad-white border-b-2 border-gumroad-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo — Gumroad G mark + wordmark */}
          <Link to="/" className="flex items-center gap-2">
            <img
              src="/asset/assets/images/logo-g.svg"
              alt="Gumroad"
              className="w-8 h-8"
            />
            <img
              src="/asset/assets/images/logo.svg"
              alt="Gumroad"
              className="hidden sm:block h-5"
            />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/discover" className="text-sm font-medium hover:text-pink transition-colors flex items-center gap-1.5">
              <img src="/asset/assets/images/nav/search.svg" alt="" className="w-4 h-4 opacity-60" />
              Discover
            </Link>

            {/* Cart Button */}
            <button
              onClick={toggleCart}
              className="relative p-2 hover:text-pink transition-colors"
              aria-label="Cart"
              id="nav-cart"
            >
              <ShoppingCart size={20} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-pink text-gumroad-black text-[10px] font-bold rounded-full flex items-center justify-center border border-gumroad-black">
                  {cartCount}
                </span>
              )}
            </button>

            <SignedIn>
              <Link to="/dashboard" className="text-sm font-medium hover:text-pink transition-colors flex items-center gap-1.5">
                <img src="/asset/assets/images/nav/home.svg" alt="" className="w-4 h-4 opacity-60" />
                Dashboard
              </Link>
              <Link to="/library" className="text-sm font-medium hover:text-pink transition-colors flex items-center gap-1.5">
                <img src="/asset/assets/images/nav/book-open.svg" alt="" className="w-4 h-4 opacity-60" />
                Library
              </Link>

              {/* Clerk UserButton */}
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: 'w-9 h-9 border-2 border-[#242423]',
                    userButtonPopoverCard: 'border-2 border-[#242423] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]',
                  },
                }}
              />
            </SignedIn>

            <SignedOut>
              <div className="flex items-center gap-3">
                <Link to="/login" className="btn-outline text-sm !py-2 !px-4">Log in</Link>
                <Link to="/signup" className="btn-primary text-sm !py-2 !px-4">Start selling</Link>
              </div>
            </SignedOut>
          </div>

          {/* Mobile menu button — using original Gumroad hamburger */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={toggleCart}
              className="relative p-2"
              aria-label="Cart"
            >
              <ShoppingCart size={20} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-pink text-gumroad-black text-[10px] font-bold rounded-full flex items-center justify-center border border-gumroad-black">
                  {cartCount}
                </span>
              )}
            </button>
            <button
              className="p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X size={24} />
              ) : (
                <img src="/asset/assets/images/hamburger.svg" alt="Menu" className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t-2 border-gumroad-black bg-gumroad-white px-4 py-4 space-y-3 animate-fade-in-up">
          <Link to="/discover" className="flex items-center gap-2 text-sm font-medium py-2" onClick={() => setMobileMenuOpen(false)}>
            <img src="/asset/assets/images/nav/search.svg" alt="" className="w-4 h-4 opacity-60" />
            Discover
          </Link>
          <SignedIn>
            <Link to="/library" className="flex items-center gap-2 text-sm font-medium py-2" onClick={() => setMobileMenuOpen(false)}>
              <img src="/asset/assets/images/nav/book-open.svg" alt="" className="w-4 h-4 opacity-60" />
              Library
            </Link>
            <Link to="/dashboard" className="flex items-center gap-2 text-sm font-medium py-2" onClick={() => setMobileMenuOpen(false)}>
              <img src="/asset/assets/images/nav/home.svg" alt="" className="w-4 h-4 opacity-60" />
              Dashboard
            </Link>
            <div className="pt-2">
              <UserButton afterSignOutUrl="/" />
            </div>
          </SignedIn>
          <SignedOut>
            <Link to="/login" className="block text-sm font-medium py-2" onClick={() => setMobileMenuOpen(false)}>Log in</Link>
            <Link to="/signup" className="btn-primary w-full text-center" onClick={() => setMobileMenuOpen(false)}>Start selling</Link>
          </SignedOut>
        </div>
      )}
    </nav>
  );
}
