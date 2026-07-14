import React, { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { useTheme } from "../context/ThemeContext";
import { db } from "../services/db";
import { 
  Search, Heart, ShoppingCart, User, Sun, Moon, 
  Menu, X, ChevronDown, LogOut, Settings, LayoutDashboard, ShoppingBag
} from "lucide-react";

export default function Header({ onCartClick }) {
  const { user, logout, isAdmin } = useAuth();
  const { cartCount } = useCart();
  const { wishlistCount } = useWishlist();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [announcementDismissed, setAnnouncementDismissed] = useState(false);

  const categories = db.getCategories();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
    setProfileDropdownOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full transition-shadow duration-300">
      {/* Announcement Bar */}
      {!announcementDismissed && (
        <div className="bg-brand-primary text-brand-secondary text-xs px-4 py-2 flex items-center justify-between font-accent font-medium">
          <div className="flex-1 text-center font-semibold tracking-wide">
            ✨ Free Shipping on Orders Above ₹499! Use Code <span className="underline">WELCOME10</span> for 10% Off ✨
          </div>
          <button 
            onClick={() => setAnnouncementDismissed(true)} 
            className="hover:opacity-80 transition-opacity p-0.5"
            aria-label="Dismiss announcement"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Main Navigation Bar */}
      <nav className="glass border-b border-brand-border py-4 px-6 md:px-12 flex items-center justify-between">
        {/* Left Side: Brand Logo and Title */}
        <Link to="/" className="flex items-center gap-3 group">
          <img src="/src/assets/logo.svg" alt="Me Nestham Brand Mark" className="w-10 h-10 group-hover:scale-105 transition-transform" />
          <div className="flex flex-col">
            <span className="font-serif text-lg md:text-xl font-bold tracking-tight text-brand-primary group-hover:text-brand-accent transition-colors">
              Me Nestham
            </span>
            <span className="text-[9px] uppercase tracking-widest text-brand-text-muted font-accent font-bold">
              By Bhanni
            </span>
          </div>
        </Link>

        {/* Center: Desktop Navigation Links */}
        <div className="hidden lg:flex items-center gap-8 font-accent font-medium text-sm">
          <NavLink to="/" className={({ isActive }) => `hover:text-brand-primary transition-colors ${isActive ? 'text-brand-primary font-semibold' : ''}`}>
            Home
          </NavLink>
          
          <NavLink to="/shop" className={({ isActive }) => `hover:text-brand-primary transition-colors ${isActive ? 'text-brand-primary font-semibold' : ''}`}>
            Shop
          </NavLink>

          {/* Categories Mega Dropdown */}
          <div className="relative group/menu">
            <button className="flex items-center gap-1 hover:text-brand-primary transition-colors py-1">
              Categories <ChevronDown size={14} />
            </button>
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[480px] bg-brand-card border border-brand-border rounded-xl shadow-xl opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all duration-300 grid grid-cols-2 p-6 gap-4">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  to={`/categories/${cat.slug}`}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-brand-secondary hover:dark:bg-[#2D2723] transition-colors"
                >
                  <img src={cat.image} alt={cat.name} className="w-12 h-12 rounded-md object-cover" />
                  <div>
                    <h4 className="font-serif text-sm font-bold text-brand-primary">{cat.name}</h4>
                    <p className="text-[11px] text-brand-text-muted line-clamp-1">{cat.description}</p>
                  </div>
                </Link>
              ))}
              <div className="col-span-2 border-t border-brand-border pt-3 mt-1 text-center">
                <Link to="/categories" className="text-xs font-semibold text-brand-accent hover:underline">
                  Browse All Categories &rarr;
                </Link>
              </div>
            </div>
          </div>

          <NavLink to="/about" className={({ isActive }) => `hover:text-brand-primary transition-colors ${isActive ? 'text-brand-primary font-semibold' : ''}`}>
            About
          </NavLink>
          <NavLink to="/contact" className={({ isActive }) => `hover:text-brand-primary transition-colors ${isActive ? 'text-brand-primary font-semibold' : ''}`}>
            Contact
          </NavLink>
        </div>

        {/* Right Side: Search, Wishlist, Cart, Profile, Theme Toggle */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Search Trigger */}
          <button 
            onClick={() => setSearchOpen(!searchOpen)} 
            className="p-2 hover:bg-brand-secondary hover:dark:bg-[#2D2723] rounded-full transition-colors relative"
            aria-label="Open Search"
          >
            <Search size={20} />
          </button>

          {/* Theme Toggle */}
          <button 
            onClick={toggleTheme} 
            className="p-2 hover:bg-brand-secondary hover:dark:bg-[#2D2723] rounded-full transition-colors text-brand-text"
            aria-label="Toggle Theme"
          >
            {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {/* Wishlist Link */}
          <Link 
            to="/profile?tab=wishlist" 
            className="p-2 hover:bg-brand-secondary hover:dark:bg-[#2D2723] rounded-full transition-colors relative"
            aria-label="View Wishlist"
          >
            <Heart size={20} />
            {wishlistCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-brand-accent text-white text-[9px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
                {wishlistCount}
              </span>
            )}
          </Link>

          {/* Cart Trigger */}
          <button 
            onClick={onCartClick} 
            className="p-2 hover:bg-brand-secondary hover:dark:bg-[#2D2723] rounded-full transition-colors relative"
            aria-label="Open Cart"
          >
            <ShoppingCart size={20} />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-brand-primary text-white text-[9px] w-5 h-5 rounded-full flex items-center justify-center font-bold animate-bounce">
                {cartCount}
              </span>
            )}
          </button>

          {/* Profile Dropdown */}
          <div className="relative">
            {user ? (
              <>
                <button 
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-1 p-2 hover:bg-brand-secondary hover:dark:bg-[#2D2723] rounded-full transition-colors"
                >
                  <User size={20} className="text-brand-primary" />
                  <ChevronDown size={14} className="text-brand-text-muted hidden md:block" />
                </button>

                {profileDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setProfileDropdownOpen(false)}></div>
                    <div className="absolute right-0 mt-2 w-48 bg-brand-card border border-brand-border rounded-xl shadow-xl z-50 py-2 font-accent text-sm">
                      <div className="px-4 py-2 border-b border-brand-border">
                        <p className="font-semibold text-brand-primary truncate">{user.name}</p>
                        <p className="text-xs text-brand-text-muted truncate">{user.email}</p>
                      </div>
                      
                      {isAdmin && (
                        <Link 
                          to="/admin" 
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 hover:bg-brand-secondary hover:dark:bg-[#2D2723] text-brand-accent font-semibold transition-colors"
                        >
                          <LayoutDashboard size={16} /> Admin Panel
                        </Link>
                      )}

                      <Link 
                        to="/profile" 
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 hover:bg-brand-secondary hover:dark:bg-[#2D2723] transition-colors"
                      >
                        <User size={16} /> My Profile
                      </Link>

                      <Link 
                        to="/profile?tab=orders" 
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 hover:bg-brand-secondary hover:dark:bg-[#2D2723] transition-colors"
                      >
                        <ShoppingBag size={16} /> My Orders
                      </Link>

                      <button 
                        onClick={handleLogout}
                        className="w-full text-left flex items-center gap-2 px-4 py-2 hover:bg-brand-secondary hover:dark:bg-[#2D2723] text-brand-error border-t border-brand-border mt-1 transition-colors"
                      >
                        <LogOut size={16} /> Logout
                      </button>
                    </div>
                  </>
                )}
              </>
            ) : (
              <Link 
                to="/auth" 
                className="p-2 hover:bg-brand-secondary hover:dark:bg-[#2D2723] rounded-full transition-colors flex items-center"
                aria-label="Login"
              >
                <User size={20} />
              </Link>
            )}
          </div>

          {/* Mobile Hamburger Trigger */}
          <button 
            onClick={() => setMobileMenuOpen(true)} 
            className="lg:hidden p-2 hover:bg-brand-secondary hover:dark:bg-[#2D2723] rounded-full transition-colors"
            aria-label="Open Navigation Menu"
          >
            <Menu size={20} />
          </button>
        </div>
      </nav>

      {/* Expandable Search Drawer */}
      {searchOpen && (
        <div className="absolute top-full left-0 w-full bg-brand-card border-b border-brand-border p-4 shadow-lg z-30 transition-all">
          <form onSubmit={handleSearchSubmit} className="max-w-3xl mx-auto flex items-center gap-3">
            <Search className="text-brand-primary shrink-0" size={22} />
            <input
              type="text"
              placeholder="Search handcrafted jewelry, clay pottery, Madhubani paintings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-brand-secondary dark:bg-[#25211E] text-brand-text px-4 py-3 rounded-lg border border-brand-border focus:border-brand-primary outline-none text-sm transition-all"
              autoFocus
            />
            <button 
              type="submit" 
              className="bg-brand-primary text-white font-accent font-semibold px-5 py-2.5 rounded-lg hover:bg-brand-accent transition-colors"
            >
              Search
            </button>
            <button 
              type="button" 
              onClick={() => setSearchOpen(false)} 
              className="p-2 hover:bg-brand-secondary hover:dark:bg-[#25211E] rounded-full"
            >
              <X size={20} />
            </button>
          </form>
        </div>
      )}

      {/* Mobile Drawer Navigation Menu */}
      {mobileMenuOpen && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 lg:hidden" onClick={() => setMobileMenuOpen(false)}></div>
          <div className="fixed top-0 left-0 bottom-0 w-[80%] max-w-sm bg-brand-bg z-50 shadow-2xl p-6 lg:hidden flex flex-col justify-between font-accent overflow-y-auto">
            <div>
              <div className="flex items-center justify-between mb-8">
                <Link to="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2">
                  <img src="/src/assets/logo.svg" alt="Me Nestham Logo" className="w-8 h-8" />
                  <span className="font-serif text-lg font-bold text-brand-primary">Me Nestham</span>
                </Link>
                <button onClick={() => setMobileMenuOpen(false)} className="p-1 hover:bg-brand-secondary hover:dark:bg-[#25211E] rounded-full">
                  <X size={22} />
                </button>
              </div>

              {/* User Greeting CTA */}
              <div className="p-4 bg-brand-secondary dark:bg-[#221E1C] border border-brand-border rounded-xl mb-6">
                {user ? (
                  <div>
                    <p className="text-xs text-brand-text-muted">Welcome back,</p>
                    <p className="font-bold text-brand-primary truncate">{user.name}</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs text-brand-text-muted mb-2">Shop premium handicrafts</p>
                    <Link 
                      to="/auth" 
                      onClick={() => setMobileMenuOpen(false)}
                      className="inline-block text-xs bg-brand-primary text-white font-semibold px-4 py-2 rounded-lg"
                    >
                      Login / Signup
                    </Link>
                  </div>
                )}
              </div>

              {/* Links List */}
              <div className="flex flex-col gap-5 font-semibold text-sm border-b border-brand-border pb-6 mb-6">
                <Link to="/" onClick={() => setMobileMenuOpen(false)} className="hover:text-brand-primary flex items-center gap-3">
                  🏠 Home
                </Link>
                <Link to="/shop" onClick={() => setMobileMenuOpen(false)} className="hover:text-brand-primary flex items-center gap-3">
                  🛍️ Shop All Products
                </Link>
                <Link to="/categories" onClick={() => setMobileMenuOpen(false)} className="hover:text-brand-primary flex items-center gap-3">
                  📂 Browse Categories
                </Link>
                <Link to="/profile?tab=wishlist" onClick={() => setMobileMenuOpen(false)} className="hover:text-brand-primary flex items-center gap-3">
                  ❤️ Wishlist ({wishlistCount})
                </Link>
                <Link to="/profile?tab=orders" onClick={() => setMobileMenuOpen(false)} className="hover:text-brand-primary flex items-center gap-3">
                  📦 My Orders
                </Link>
                <Link to="/profile" onClick={() => setMobileMenuOpen(false)} className="hover:text-brand-primary flex items-center gap-3">
                  👤 My Profile
                </Link>
                <Link to="/about" onClick={() => setMobileMenuOpen(false)} className="hover:text-brand-primary flex items-center gap-3">
                  ℹ️ About Us
                </Link>
                <Link to="/contact" onClick={() => setMobileMenuOpen(false)} className="hover:text-brand-primary flex items-center gap-3">
                  📞 Contact support
                </Link>
              </div>

              {/* Categories nested list */}
              <div className="mb-6">
                <h4 className="text-xs font-bold text-brand-text-muted uppercase tracking-wider mb-3">Shop Categories</h4>
                <div className="flex flex-col gap-3 text-xs pl-3">
                  {categories.map(cat => (
                    <Link 
                      key={cat.id} 
                      to={`/categories/${cat.slug}`} 
                      onClick={() => setMobileMenuOpen(false)}
                      className="hover:text-brand-primary text-brand-text font-medium"
                    >
                      • {cat.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between border-t border-brand-border pt-4 text-xs text-brand-text-muted">
                <span>Theme:</span>
                <button 
                  onClick={toggleTheme} 
                  className="bg-brand-secondary dark:bg-[#25211E] px-3 py-1.5 rounded-lg border border-brand-border font-semibold text-brand-text"
                >
                  {theme === "dark" ? "☀️ Light Mode" : "🌙 Dark Mode"}
                </button>
              </div>
              <div className="mt-4 text-[10px] text-center text-brand-text-muted">
                © 2026 Me Nestham. All policies apply.
              </div>
            </div>
          </div>
        </>
      )}
    </header>
  );
}
