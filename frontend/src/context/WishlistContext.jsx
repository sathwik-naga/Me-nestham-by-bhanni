import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { trackAddToWishlist } from "../services/analytics/analytics";

const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState([]);

  // Listen to global logout event
  useEffect(() => {
    const handleAuthLogout = () => {
      setWishlist([]);
    };
    window.addEventListener("mn-auth-logout", handleAuthLogout);
    return () => window.removeEventListener("mn-auth-logout", handleAuthLogout);
  }, []);

  // Wishlist Storage key
  const getWishlistKey = () => {
    return user ? `mn_wishlist_${user.id}` : "mn_wishlist_guest";
  };

  // Load wishlist when user changes
  useEffect(() => {
    const key = getWishlistKey();
    const saved = localStorage.getItem(key);
    if (saved) {
      setWishlist(JSON.parse(saved));
    } else {
      setWishlist([]);
    }
  }, [user]);

  // Handle guest-to-user wishlist merge upon login
  useEffect(() => {
    if (user) {
      const guestWishlistStr = localStorage.getItem("mn_wishlist_guest");
      if (guestWishlistStr) {
        const guestWishlist = JSON.parse(guestWishlistStr);
        if (guestWishlist.length > 0) {
          const userWishlistStr = localStorage.getItem(`mn_wishlist_${user.id}`);
          const userWishlist = userWishlistStr ? JSON.parse(userWishlistStr) : [];
          
          // Merge unique IDs
          const merged = Array.from(new Set([...userWishlist, ...guestWishlist]));
          setWishlist(merged);
          localStorage.setItem(`mn_wishlist_${user.id}`, JSON.stringify(merged));
          localStorage.removeItem("mn_wishlist_guest");
        }
      }
    }
  }, [user]);

  // Save changes helper
  const saveWishlist = (items) => {
    setWishlist(items);
    localStorage.setItem(getWishlistKey(), JSON.stringify(items));
  };

  const addToWishlist = (productId) => {
    if (!user) return;
    if (!wishlist.includes(productId)) {
      saveWishlist([...wishlist, productId]);
      trackAddToWishlist({ id: productId });
    }
  };

  const removeFromWishlist = (productId) => {
    if (!user) return;
    saveWishlist(wishlist.filter(id => id !== productId));
  };

  const toggleWishlist = (productId) => {
    if (!user) return;
    if (wishlist.includes(productId)) {
      removeFromWishlist(productId);
    } else {
      addToWishlist(productId);
    }
  };

  const isInWishlist = (productId) => {
    return wishlist.includes(productId);
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        wishlistCount: wishlist.length,
        addToWishlist,
        removeFromWishlist,
        toggleWishlist,
        isInWishlist
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => useContext(WishlistContext);
