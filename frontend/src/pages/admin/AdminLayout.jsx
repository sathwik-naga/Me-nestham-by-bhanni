import React, { useEffect } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { 
  LayoutDashboard, ShoppingBag, FolderTree, ClipboardList, 
  Users, Tag, ShieldAlert, BarChart3, LogOut, ArrowLeft, User
} from "lucide-react";

export default function AdminLayout() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Route-gating: Admin role protection
  useEffect(() => {
    if (!user) {
      navigate("/auth?redirect=/admin");
    } else if (!isAdmin) {
      alert("Role Denied: You must be an administrator to access the admin portal.");
      navigate("/");
    }
  }, [user, isAdmin, navigate]);

  if (!user || !isAdmin) return null;

  const adminMenu = [
    { path: "/admin", label: "Dashboard", icon: <LayoutDashboard size={16} />, exact: true },
    { path: "/admin/products", label: "Products", icon: <ShoppingBag size={16} /> },
    { path: "/admin/categories", label: "Categories", icon: <FolderTree size={16} /> },
    { path: "/admin/orders", label: "Orders", icon: <ClipboardList size={16} /> },
    { path: "/admin/customers", label: "Customers", icon: <Users size={16} /> },
    { path: "/admin/coupons", label: "Coupons", icon: <Tag size={16} /> },
    { path: "/admin/inventory", label: "Inventory", icon: <ShieldAlert size={16} /> },
    { path: "/admin/analytics", label: "Analytics", icon: <BarChart3 size={16} /> }
  ];

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen flex bg-brand-secondary dark:bg-[#151210] font-accent text-left">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-brand-card border-r border-brand-border shrink-0 hidden md:flex flex-col justify-between py-6">
        <div>
          {/* Header logo */}
          <div className="px-6 mb-8">
            <Link to="/" className="flex items-center gap-2">
              <img src="/src/assets/logo.svg" alt="Me Nestham Logo" className="w-8 h-8" />
              <div className="flex flex-col">
                <span className="font-serif text-base font-bold text-brand-primary">Bhanni Admin</span>
                <span className="text-[8px] uppercase tracking-widest text-brand-text-muted font-bold">Management Portal</span>
              </div>
            </Link>
          </div>

          {/* Links list */}
          <div className="flex flex-col gap-1 px-3">
            {adminMenu.map((item) => {
              const isActive = item.exact 
                ? location.pathname === item.path 
                : location.pathname.startsWith(item.path) && item.path !== "/admin";
                
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-brand-primary text-white font-bold shadow-md"
                      : "text-brand-text hover:bg-brand-secondary hover:dark:bg-[#2D2723]"
                  }`}
                >
                  {item.icon} {item.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Footer info/Actions */}
        <div className="px-3 flex flex-col gap-2">
          <Link 
            to="/" 
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold text-brand-text hover:bg-brand-secondary hover:dark:bg-[#2D2723]"
          >
            <ArrowLeft size={16} /> Back to Storefront
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold text-brand-error hover:bg-brand-error/10"
          >
            <LogOut size={16} /> Admin Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-x-hidden min-h-screen">
        {/* Top Header bar */}
        <header className="bg-brand-card border-b border-brand-border py-4 px-6 md:px-10 flex items-center justify-between">
          <h2 className="font-serif font-bold text-base text-brand-text">
            {location.pathname === "/admin" ? "Overview Dashboard" : 
             location.pathname.startsWith("/admin/products") ? "Product Management" : 
             location.pathname.startsWith("/admin/categories") ? "Categories Hub" :
             location.pathname.startsWith("/admin/orders") ? "Order Center" : 
             location.pathname.startsWith("/admin/customers") ? "Customer Directory" : 
             location.pathname.startsWith("/admin/coupons") ? "Promo Coupons" :
             location.pathname.startsWith("/admin/inventory") ? "Inventory Control" : "Analytics Suite"}
          </h2>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <span className="text-[10px] text-brand-text-muted">Role: <span className="font-bold text-brand-accent uppercase bg-brand-secondary px-2 py-0.5 rounded border">{user.role}</span></span>
            <div className="flex items-center gap-2 border-l border-brand-border pl-4">
              <User size={16} className="text-brand-primary" />
              <span className="text-brand-text">{user.name}</span>
            </div>
          </div>
        </header>

        {/* Main Panel Content Scroll */}
        <main className="flex-1 p-6 md:p-10 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
