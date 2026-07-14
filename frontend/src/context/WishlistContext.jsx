import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";

const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState([]);

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
    if (!wishlist.includes(productId)) {
      saveWishlist([...wishlist, productId]);
    }
  };

  const removeFromWishlist = (productId) => {
    saveWishlist(wishlist.filter(id => id !== productId));
  };

  const toggleWishlist = (productId) => {
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
