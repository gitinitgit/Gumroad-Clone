import { Outlet, NavLink } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { useUserStore } from '../../store/auth.store';
import { Link } from 'react-router-dom';

const sidebarLinks = [
  { to: '/dashboard', icon: '/asset/assets/images/nav/home.svg', label: 'Overview', end: true },
  { to: '/dashboard/products', icon: '/asset/assets/images/nav/box-bankers.svg', label: 'Products' },
  { to: '/dashboard/sales', icon: '/asset/assets/images/nav/money-circle.svg', label: 'Sales' },
  { to: '/dashboard/settings', icon: '/asset/assets/images/nav/settings.svg', label: 'Settings' },
];

export default function DashboardLayout() {
  const { user: clerkUser } = useUser();
  const { localUser } = useUserStore();

  const displayName = localUser?.name || clerkUser?.fullName || 'Creator';
  const displayUsername = localUser?.username || clerkUser?.username || '';
  const displayAvatar = clerkUser?.imageUrl || localUser?.avatar || '/asset/assets/images/gumroad-default-avatar-5.png';

  return (
    <div className="min-h-screen bg-gumroad-white flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r-2 border-gumroad-black flex flex-col shrink-0 sticky top-0 h-screen">
        {/* Header — Gumroad G logo + back link */}
        <div className="p-4 border-b-2 border-gumroad-black">
          <Link to="/" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gumroad-black mb-3">
            <img src="/asset/assets/images/caret-left.svg" alt="" className="w-3 h-3 opacity-50" />
            Back to store
          </Link>
          <div className="flex items-center gap-3">
            <img
              src={displayAvatar}
              alt={displayName}
              className="w-10 h-10 rounded-full border-2 border-gumroad-black object-cover"
            />
            <div>
              <p className="font-bold text-sm">{displayName}</p>
              {displayUsername && <p className="text-xs text-gray-500">@{displayUsername}</p>}
            </div>
          </div>
        </div>

        {/* Nav Links — using Gumroad nav SVG icons */}
        <nav className="flex-1 p-3 space-y-1">
          {sidebarLinks.map(({ to, icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''}`
              }
            >
              <img src={icon} alt="" className="w-[18px] h-[18px] opacity-70" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t-2 border-gumroad-black flex items-center gap-2">
          <img src="/asset/assets/images/logo-g.svg" alt="Gumroad" className="w-5 h-5" />
          <span className="text-xs text-gray-400">Gumroad Clone v1.0</span>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-h-screen overflow-y-auto">
        <div className="max-w-6xl mx-auto p-6 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
