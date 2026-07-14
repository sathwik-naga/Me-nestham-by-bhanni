import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Outlet } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import BottomNav from "./components/BottomNav";
import CartDrawer from "./components/CartDrawer";
import AIShoppingAssistant from "./components/AIShoppingAssistant";
import ProtectedRoute from "./components/ProtectedRoute";
import { getProducts } from "./services/supabase/products";
import { getCategories } from "./services/supabase/categories";

// Consumer Pages
import Home from "./pages/Home";
import Shop from "./pages/Shop";
import Categories from "./pages/Categories";
import CategoryDetail from "./pages/CategoryDetail";
import ProductDetail from "./pages/ProductDetail";
import CartPage from "./pages/CartPage";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import OrderTracking from "./pages/OrderTracking";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import About from "./pages/About";
import Contact from "./pages/Contact";
import FAQ from "./pages/FAQ";
import Policies from "./pages/Policies";

// Admin Panel Pages
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminCustomers from "./pages/admin/AdminCustomers";
import AdminCoupons from "./pages/admin/AdminCoupons";
import AdminInventory from "./pages/admin/AdminInventory";
import AdminAnalytics from "./pages/admin/AdminAnalytics";

// Consumer Layout Wrapper
function StorefrontLayout() {
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);

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
          <Route path="orders/:orderId/track" element={<OrderTracking />} />
          <Route path="auth" element={<Auth />} />
          <Route path="profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          <Route path="about" element={<About />} />
          <Route path="contact" element={<Contact />} />
          <Route path="faq" element={<FAQ />} />
          <Route path="policies/:policyType" element={<Policies />} />
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
        </Route>
      </Routes>
    </Router>
  );
}
