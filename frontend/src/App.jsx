import React, { useState, useEffect, lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Outlet } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import BottomNav from "./components/BottomNav";
import CartDrawer from "./components/CartDrawer";
import AIShoppingAssistant from "./components/AIShoppingAssistant";
import ProtectedRoute from "./components/ProtectedRoute";
import CookieConsent from "./components/CookieConsent";
import PageSkeletonLoader from "./components/Skeletons/PageSkeletonLoader";
import useAnalytics from "./hooks/useAnalytics";
import { getProducts } from "./services/supabase/products";
import { getCategories } from "./services/supabase/categories";
import { prefetchRoute } from "./utils/performance";

// Lazily loaded Consumer Pages
const Home = lazy(() => import("./pages/Home"));
const Shop = lazy(() => import("./pages/Shop"));
const Categories = lazy(() => import("./pages/Categories"));
const CategoryDetail = lazy(() => import("./pages/CategoryDetail"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const CartPage = lazy(() => import("./pages/CartPage"));
const Checkout = lazy(() => import("./pages/Checkout"));
const OrderConfirmation = lazy(() => import("./pages/OrderConfirmation"));
const OrderTracking = lazy(() => import("./pages/OrderTracking"));
const Auth = lazy(() => import("./pages/Auth"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const Profile = lazy(() => import("./pages/Profile"));
const Contact = lazy(() => import("./pages/Contact"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Policies = lazy(() => import("./pages/Policies"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));

// Lazily loaded Admin Pages & Layout
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminProducts = lazy(() => import("./pages/admin/AdminProducts"));
const AdminCategories = lazy(() => import("./pages/admin/AdminCategories"));
const AdminOrders = lazy(() => import("./pages/admin/AdminOrders"));
const AdminCustomers = lazy(() => import("./pages/admin/AdminCustomers"));
const AdminCoupons = lazy(() => import("./pages/admin/AdminCoupons"));
const AdminInventory = lazy(() => import("./pages/admin/AdminInventory"));
const AdminAnalytics = lazy(() => import("./pages/admin/AdminAnalytics"));
const AdminEmailLogs = lazy(() => import("./pages/admin/AdminEmailLogs"));
const AdminContactMessages = lazy(() => import("./pages/admin/AdminContactMessages"));

// Consumer Layout Wrapper
function StorefrontLayout() {
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  useAnalytics();

  useEffect(() => {
    // Opportunistically prefetch high-traffic routes after initial storefront load
    prefetchRoute(() => import("./pages/Shop"));
    prefetchRoute(() => import("./pages/Categories"));
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-brand-bg text-brand-text">
      {/* Sticky header */}
      <Header onCartClick={() => setCartDrawerOpen(true)} />
      
      {/* Scrollable page body */}
      <div className="flex-1 pb-16 lg:pb-0">
        <Outlet />
      </div>
      
      {/* Slide-out cart drawer */}
      <CartDrawer isOpen={cartDrawerOpen} onClose={() => setCartDrawerOpen(false)} />
      
      {/* Floating chatbot assistant */}
      <AIShoppingAssistant />
      
      {/* Mobile-only bottom nav */}
      <BottomNav />
      
      {/* Cookie Privacy Consent Banner */}
      <CookieConsent />

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default function App() {
  useEffect(() => {
    async function syncBackendData() {
      try {
        const [mappedProducts, categoriesData] = await Promise.all([
          getProducts(),
          getCategories(),
        ]);

        // Map categories to frontend structure
        const mappedCategories = categoriesData.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          description: c.description || "",
          image: c.image_url || "/placeholder.png",
          productCount: mappedProducts.filter((p) => p.category === c.slug).length,
        }));

        localStorage.setItem("mn_products", JSON.stringify(mappedProducts));
        localStorage.setItem("mn_categories", JSON.stringify(mappedCategories));
      } catch (err) {
        console.error("Failed to sync products and categories from backend:", err);
      }
    }
    syncBackendData();
  }, []);

  return (
    <Router>
      <Suspense fallback={<PageSkeletonLoader />}>
        <Routes>
          {/* Customer / Public routes */}
          <Route path="/" element={<StorefrontLayout />}>
            <Route index element={<Home />} />
            <Route path="shop" element={<Shop />} />
            <Route path="categories" element={<Categories />} />
            <Route path="categories/:slug" element={<CategoryDetail />} />
            <Route path="products/:slug" element={<ProductDetail />} />
            <Route path="cart" element={<CartPage />} />
            <Route path="checkout" element={
              <ProtectedRoute>
                <Checkout />
              </ProtectedRoute>
            } />
            <Route path="order-confirmation/:orderId" element={<OrderConfirmation />} />
            <Route path="orders/:orderId/track" element={
              <ProtectedRoute>
                <OrderTracking />
              </ProtectedRoute>
            } />
            <Route path="auth" element={<Auth />} />
            <Route path="auth/callback" element={<AuthCallback />} />
            <Route path="forgot-password" element={<ForgotPassword />} />
            <Route path="reset-password" element={<ResetPassword />} />
            <Route path="profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="contact" element={<Contact />} />
            <Route path="faq" element={<FAQ />} />
            <Route path="policies/:policyType" element={<Policies />} />
            <Route path="*" element={<NotFound />} />
          </Route>

          {/* Gated admin routes */}
          <Route path="/admin" element={
            <ProtectedRoute adminOnly={true}>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<AdminDashboard />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="customers" element={<AdminCustomers />} />
            <Route path="coupons" element={<AdminCoupons />} />
            <Route path="inventory" element={<AdminInventory />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="emails" element={<AdminEmailLogs />} />
            <Route path="contact-messages" element={<AdminContactMessages />} />
          </Route>
        </Routes>
      </Suspense>
    </Router>
  );
}
