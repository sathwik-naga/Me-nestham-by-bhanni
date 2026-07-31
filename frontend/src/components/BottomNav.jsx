import React from "react";
import { NavLink } from "react-router-dom";
import { Home, ShoppingBag, Heart, User, Search } from "lucide-react";
import { useWishlist } from "../context/WishlistContext";

export default function BottomNav() {
  const { wishlistCount } = useWishlist();

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-brand-bg/95 backdrop-blur-md border-t border-brand-border py-2.5 px-6 flex items-center justify-between z-40 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] font-accent">
      <NavLink
        to="/"
        className={({ isActive }) =>
          `flex flex-col items-center gap-1 text-[10px] transition-colors ${
            isActive ? "text-brand-primary font-bold" : "text-brand-text-muted"
          }`
        }
      >
        <Home size={20} />
        <span>Home</span>
      </NavLink>

      <NavLink
        to="/shop"
        className={({ isActive }) =>
          `flex flex-col items-center gap-1 text-[10px] transition-colors ${
            isActive ? "text-brand-primary font-bold" : "text-brand-text-muted"
          }`
        }
      >
        <ShoppingBag size={20} />
        <span>Shop</span>
      </NavLink>

      <NavLink
        to="/shop?focusSearch=true"
        className={({ isActive }) =>
          `flex flex-col items-center gap-1 text-[10px] transition-colors ${
            isActive ? "text-brand-primary font-bold" : "text-brand-text-muted"
          }`
        }
      >
        <Search size={20} />
        <span>Search</span>
      </NavLink>

      <NavLink
        to="/profile?tab=wishlist"
        className={({ isActive }) =>
          `flex flex-col items-center gap-1 text-[10px] transition-colors relative ${
            isActive ? "text-brand-primary font-bold" : "text-brand-text-muted"
          }`
        }
      >
        <Heart size={20} />
        <span>Wishlist</span>
        {wishlistCount > 0 && (
          <span className="absolute top-0 right-2 bg-brand-accent text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
            {wishlistCount}
          </span>
        )}
      </NavLink>

      <NavLink
        to="/profile"
        className={({ isActive }) =>
          `flex flex-col items-center gap-1 text-[10px] transition-colors ${
            isActive ? "text-brand-primary font-bold" : "text-brand-text-muted"
          }`
        }
      >
        <User size={20} />
        <span>Profile</span>
      </NavLink>
    </div>
  );
}
