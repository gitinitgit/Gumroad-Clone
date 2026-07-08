import { Routes, Route } from 'react-router-dom';
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';

// Layouts
import MainLayout from './components/layout/MainLayout';
import DashboardLayout from './components/layout/DashboardLayout';
import ProtectedRoute from './components/layout/ProtectedRoute';

// Pages
import HomePage from './pages/HomePage';
import DiscoverPage from './pages/DiscoverPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ProductPage from './pages/products/ProductPage';
import ProductCreatePage from './pages/dashboard/ProductCreatePage';
import ProductEditPage from './pages/dashboard/ProductEditPage';
import DashboardHome from './pages/dashboard/DashboardHome';
import ProductsListPage from './pages/dashboard/ProductsListPage';
import SalesPage from './pages/dashboard/SalesPage';
import LibraryPage from './pages/LibraryPage';
import SettingsPage from './pages/dashboard/SettingsPage';
import CheckoutSuccessPage from './pages/checkout/CheckoutSuccessPage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/discover" element={<DiscoverPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<RegisterPage />} />
        <Route path="/products/:slug" element={<ProductPage />} />
        <Route path="/checkout/success" element={<CheckoutSuccessPage />} />
        <Route path="/library" element={<ProtectedRoute><LibraryPage /></ProtectedRoute>} />
      </Route>

      {/* Dashboard routes (creator/admin) */}
      <Route element={<ProtectedRoute requiredRole="creator"><DashboardLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<DashboardHome />} />
        <Route path="/dashboard/products" element={<ProductsListPage />} />
        <Route path="/dashboard/products/new" element={<ProductCreatePage />} />
        <Route path="/dashboard/products/:id/edit" element={<ProductEditPage />} />
        <Route path="/dashboard/sales" element={<SalesPage />} />
        <Route path="/dashboard/settings" element={<SettingsPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
