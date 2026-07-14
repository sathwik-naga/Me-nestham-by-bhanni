import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { db } from "../services/db";
import { api } from "../services/api";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState("");

  // Helper to map backend cart items to the frontend structure
  const mapBackendCartItems = (items) => {
    return items.map((item) => ({
      id: item.product_id, // frontend uses item.id as the product ID
      cartItemId: item.id, // backend cart item ID to update/remove
      name: item.product?.name || "Product",
      slug: item.product?.slug || "",
      image: item.product?.featured_image || item.product?.image_url || "/placeholder.png",
      price: Number(item.product?.price || 0),
      variant: "", // backend doesn't support variants
      quantity: item.quantity,
      maxStock: item.product?.stock || 0,
    }));
  };

  // Load cart on mount or when user changes
  useEffect(() => {
    const loadCart = async () => {
      if (user) {
        // Authenticated user
        const token = localStorage.getItem("access_token");
        if (token) {
          try {
            // First check if there are guest cart items to merge
            const guestCartStr = localStorage.getItem("mn_cart_guest");
            if (guestCartStr) {
              const guestCart = JSON.parse(guestCartStr);
              if (guestCart.length > 0) {
                // Post items to backend sequentially
                for (const item of guestCart) {
                  try {
                    await api.post("/cart/items", {
                      product_id: item.id,
                      quantity: item.quantity,
                    });
                  } catch (err) {
                    console.error("Failed to merge cart item:", err);
                  }
                }
              }
              localStorage.removeItem("mn_cart_guest");
            }
 
            // Fetch the updated cart from backend
            const result = await api.get("/cart");
            if (result) {
              setCartItems(mapBackendCartItems(result.data.cart.items));
            }
          } catch (err) {
            console.error("Failed to load user cart from backend:", err);
          }
        }
      } else {
        // Guest user
        const savedCart = localStorage.getItem("mn_cart_guest");
        if (savedCart) {
          setCartItems(JSON.parse(savedCart));
        } else {
          setCartItems([]);
        }
      }
      setAppliedCoupon(null);
      setCouponError("");
    };

    loadCart();
  }, [user]);

  // Save guest cart changes
  const saveGuestCart = (items) => {
    setCartItems(items);
    localStorage.setItem("mn_cart_guest", JSON.stringify(items));
  };

  // Add to cart
  const addToCart = async (product, quantity = 1, variantName = "") => {
    if (user) {
      try {
        const result = await api.post("/cart/items", {
          product_id: product.id,
          quantity: quantity,
        });
 
        setCartItems(mapBackendCartItems(result.data.cart.items));
      } catch (err) {
        alert(err.message || "Error adding item to cart");
      }
    } else {
      // Guest local cart logic
      const items = [...cartItems];
      let selectedVariantName = variantName;
      let price = product.price;

      if (product.variants && product.variants.length > 0) {
        if (!selectedVariantName) {
          selectedVariantName = product.variants[0].name;
          price = product.variants[0].price;
        } else {
          const v = product.variants.find((v) => v.name === selectedVariantName);
          if (v) price = v.price;
        }
      }

      const existingIndex = items.findIndex(
        (item) => item.id === product.id && item.variant === selectedVariantName
      );

      if (existingIndex >= 0) {
        items[existingIndex].quantity += quantity;
      } else {
        items.push({
          id: product.id,
          name: product.name,
          slug: product.slug,
          image: product.images?.[0] || product.image || "/placeholder.png",
          price: price,
          variant: selectedVariantName,
          quantity: quantity,
          maxStock: product.variants && selectedVariantName
            ? (product.variants.find((v) => v.name === selectedVariantName)?.stock || 0)
            : product.stockCount,
        });
      }

      saveGuestCart(items);
    }
  };

  // Remove from cart
  const removeFromCart = async (productId, variantName = "") => {
    if (user) {
      const item = cartItems.find((i) => i.id === productId);
      if (!item || !item.cartItemId) return;

      try {
        const result = await api.delete(`/cart/items/${item.cartItemId}`);
 
        setCartItems(mapBackendCartItems(result.data.cart.items));
      } catch (err) {
        alert(err.message || "Error removing item");
      }
    } else {
      const items = cartItems.filter(
        (item) => !(item.id === productId && item.variant === variantName)
      );
      saveGuestCart(items);
    }
  };

  // Update item quantity
  const updateQuantity = async (productId, variantName = "", quantity) => {
    if (user) {
      const item = cartItems.find((i) => i.id === productId);
      if (!item || !item.cartItemId) return;

      try {
        const result = await api.put(`/cart/items/${item.cartItemId}`, { quantity });
 
        setCartItems(mapBackendCartItems(result.data.cart.items));
      } catch (err) {
        alert(err.message || "Error updating quantity");
      }
    } else {
      const items = cartItems.map((item) => {
        if (item.id === productId && item.variant === variantName) {
          const validQty = Math.max(1, Math.min(item.maxStock, quantity));
          return { ...item, quantity: validQty };
        }
        return item;
      });
      saveGuestCart(items);
    }
  };

  // Clear entire cart
  const clearCart = async () => {
    if (user) {
      try {
        await api.delete("/cart");
        setCartItems([]);
      } catch (err) {
        console.error("Failed to clear cart:", err);
      }
    } else {
      saveGuestCart([]);
    }
    setAppliedCoupon(null);
  };

  // Apply discount coupon
  const applyCoupon = (code) => {
    setCouponError("");
    const coupons = db.getCoupons();
    const coupon = coupons.find((c) => c.code.toUpperCase() === code.toUpperCase());

    if (!coupon) {
      setCouponError("Invalid coupon code.");
      return false;
    }

    const sub = subtotal;
    if (sub < coupon.minOrderValue) {
      setCouponError(`Minimum order value of ₹${coupon.minOrderValue} required for this coupon.`);
      return false;
    }

    setAppliedCoupon(coupon);
    return true;
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponError("");
  };

  // Computations
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const discount = appliedCoupon
    ? appliedCoupon.type === "percentage"
      ? parseFloat(((subtotal * appliedCoupon.value) / 100).toFixed(2))
      : appliedCoupon.value
    : 0;

  const freeShippingThreshold = 499;
  const shipping = subtotal === 0
    ? 0
    : subtotal - discount >= freeShippingThreshold ? 0 : 99;

  const tax = parseFloat(((Math.max(0, subtotal - discount) * 18) / 100).toFixed(2));
  const total = parseFloat((Math.max(0, subtotal - discount) + shipping + tax).toFixed(2));
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartCount,
        subtotal,
        discount,
        shipping,
        tax,
        total,
        appliedCoupon,
        couponError,
        freeShippingThreshold,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        applyCoupon,
        removeCoupon,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
