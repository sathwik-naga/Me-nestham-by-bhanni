import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { db } from "../services/db";
import { api } from "../services/api";
import { trackAddToCart, trackRemoveFromCart } from "../services/analytics/analytics";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState("");

  // Helper to map backend cart items to the frontend structure
  const mapBackendCartItems = (items) => {
    return items.map((item) => {
      const isVariant = !!item.variant;
      const variantName = item.variant?.name || "";
      const price = isVariant
        ? Number(item.variant.sale_price !== null && item.variant.sale_price !== undefined ? item.variant.sale_price : item.variant.price)
        : Number(item.product?.price || 0);
      const maxStock = isVariant
        ? (item.variant.stock !== undefined ? item.variant.stock : (item.variant.stock_quantity || 0))
        : (item.product?.stock || 0);

      let image = "/placeholder.png";
      if (isVariant && item.variant.images && item.variant.images.length > 0) {
        const primaryImg = item.variant.images.find((img) => typeof img === 'object' && img.is_primary);
        image = primaryImg ? (primaryImg.image_url || primaryImg.url) : (typeof item.variant.images[0] === 'string' ? item.variant.images[0] : item.variant.images[0].image_url);
      } else {
        image = item.product?.featured_image || item.product?.image_url || "/placeholder.png";
      }

      return {
        id: item.product_id,
        variantId: item.variant_id || null,
        cartItemId: item.id,
        name: item.product?.name || "Product",
        slug: item.product?.slug || "",
        image,
        price,
        variant: variantName,
        quantity: item.quantity,
        maxStock,
      };
    });
  };

  const [totals, setTotals] = useState({
    subtotal: 0,
    discount: 0,
    shipping: 0,
    tax: 0,
    giftCardDiscount: 0,
    total: 0,
  });
  const [appliedGiftCard, setAppliedGiftCard] = useState(null);
  const [giftCardError, setGiftCardError] = useState("");

  const updateCartState = (cartResponse) => {
    if (!cartResponse || !cartResponse.cart) return;
    const { items, summary } = cartResponse.cart;
    setCartItems(mapBackendCartItems(items));
    setTotals({
      subtotal: Number(summary.subtotal || 0),
      discount: Number(summary.discount || 0),
      shipping: Number(summary.shipping || 0),
      tax: Number(summary.tax || 0),
      giftCardDiscount: Number(summary.giftCardDiscount || 0),
      total: Number(summary.grandTotal || 0),
    });

    if (summary.couponCode) {
      setAppliedCoupon({ code: summary.couponCode });
    } else {
      setAppliedCoupon(null);
    }
    if (summary.giftCardCode) {
      setAppliedGiftCard({ code: summary.giftCardCode });
    } else {
      setAppliedGiftCard(null);
    }
  };

  // Listen to global logout event
  useEffect(() => {
    const handleAuthLogout = () => {
      // Return cart to guest mode by loading the guest cart (preserving it)
      const savedCart = localStorage.getItem("mn_cart_guest");
      setCartItems(savedCart ? JSON.parse(savedCart) : []);
      setTotals({
        subtotal: 0,
        discount: 0,
        shipping: 0,
        tax: 0,
        giftCardDiscount: 0,
        total: 0,
      });
      setAppliedCoupon(null);
      setAppliedGiftCard(null);
      setCouponError("");
      setGiftCardError("");
    };
    window.addEventListener("mn-auth-logout", handleAuthLogout);
    return () => window.removeEventListener("mn-auth-logout", handleAuthLogout);
  }, []);

  // Load cart on mount or when user changes
  useEffect(() => {
    const loadCart = async () => {
      if (!user) {
        // Return immediately if unauthenticated, strictly load local guest cart
        const savedCart = localStorage.getItem("mn_cart_guest");
        setCartItems(savedCart ? JSON.parse(savedCart) : []);
        setAppliedCoupon(null);
        setAppliedGiftCard(null);
        setCouponError("");
        setGiftCardError("");
        return;
      }

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
                    variant_id: item.variantId || null,
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
            updateCartState(result.data);
          }
        } catch (err) {
          console.error("Failed to load user cart from backend:", err);
        }
      }
      setAppliedCoupon(null);
      setAppliedGiftCard(null);
      setCouponError("");
      setGiftCardError("");
    };

    loadCart();
  }, [user]);

  // Save guest cart changes
  const saveGuestCart = (items) => {
    setCartItems(items);
    localStorage.setItem("mn_cart_guest", JSON.stringify(items));
  };

  // Add to cart
  const addToCart = async (product, quantity = 1, variantName = "", variantId = null, customImage = null) => {
    if (user) {
      try {
        const result = await api.post("/cart/items", {
          product_id: product.id,
          quantity: quantity,
          variant_id: variantId || null,
        });

        updateCartState(result.data);
      } catch (err) {
        alert(err.message || "Error adding item to cart");
      }
    } else {
      // Guest local cart logic
      const items = [...cartItems];
      let selectedVariantName = variantName;
      let price = product.price;

      if (product.variants && product.variants.length > 0) {
        if (!selectedVariantName && !variantId) {
          selectedVariantName = product.variants[0].name;
          price = product.variants[0].price;
        } else if (variantId) {
          const v = product.variants.find((v) => v.id === variantId);
          if (v) {
            selectedVariantName = v.name;
            price = v.price;
          }
        } else {
          const v = product.variants.find((v) => v.name === selectedVariantName);
          if (v) price = v.price;
        }
      }

      const selectedVariantId = variantId || (product.variants && selectedVariantName 
        ? product.variants.find(v => v.name === selectedVariantName)?.id
        : null);

      let snapshotImage = customImage;
      if (!snapshotImage && selectedVariantId && product.variants) {
        const v = product.variants.find((v) => v.id === selectedVariantId);
        if (v && v.images && v.images.length > 0) {
          const prim = v.images.find(i => typeof i === 'object' && i.is_primary);
          snapshotImage = prim ? (prim.image_url || prim.url) : (typeof v.images[0] === 'string' ? v.images[0] : v.images[0].image_url);
        }
      }
      if (!snapshotImage) {
        snapshotImage = product.images?.[0] || product.image || "/placeholder.png";
      }

      const existingIndex = items.findIndex(
        (item) => item.id === product.id && item.variantId === selectedVariantId
      );

      if (existingIndex >= 0) {
        items[existingIndex].quantity += quantity;
        if (snapshotImage) items[existingIndex].image = snapshotImage;
      } else {
        items.push({
          id: product.id,
          variantId: selectedVariantId,
          name: product.name,
          slug: product.slug,
          image: snapshotImage,
          price: price,
          variant: selectedVariantName,
          quantity: quantity,
          maxStock: product.variants && selectedVariantId
            ? (product.variants.find((v) => v.id === selectedVariantId)?.stock || 0)
            : product.stockCount,
        });
      }

      saveGuestCart(items);
    }
    trackAddToCart(product, quantity);
  };

  // Remove from cart
  const removeFromCart = async (productId, variantName = "") => {
    const targetItem = cartItems.find((i) => i.id === productId && i.variant === variantName);
    if (targetItem) {
      trackRemoveFromCart(targetItem);
    }

    if (user) {
      const item = cartItems.find((i) => i.id === productId && i.variant === variantName);
      if (!item || !item.cartItemId) return;

      try {
        const result = await api.delete(`/cart/items/${item.cartItemId}`);

        updateCartState(result.data);
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
      const item = cartItems.find((i) => i.id === productId && i.variant === variantName);
      if (!item || !item.cartItemId) return;

      try {
        const result = await api.put(`/cart/items/${item.cartItemId}`, { quantity });

        updateCartState(result.data);
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
    setAppliedGiftCard(null);
    setTotals({
      subtotal: 0,
      discount: 0,
      shipping: 0,
      tax: 0,
      giftCardDiscount: 0,
      total: 0,
    });
  };

  // Apply discount coupon
  const applyCoupon = async (code) => {
    if (!user) return false;
    setCouponError("");
    try {
      const response = await api.post("/promotions/apply", { code });
      if (response.data.status === "success") {
        const cartRes = await api.get("/cart");
        updateCartState(cartRes.data);
        return true;
      }
    } catch (err) {
      setCouponError(err.response?.data?.message || err.message || "Failed to apply coupon.");
      return false;
    }
  };

  const removeCoupon = async () => {
    if (!user) return;
    try {
      await api.post("/promotions/remove");
      const cartRes = await api.get("/cart");
      updateCartState(cartRes.data);
    } catch (err) {
      console.error("Failed to remove coupon", err);
    }
  };

  // Gift Card application
  const applyGiftCard = async (code) => {
    if (!user) return false;
    setGiftCardError("");
    try {
      const response = await api.post("/promotions/gift-cards/apply", { code });
      if (response.data.status === "success") {
        const cartRes = await api.get("/cart");
        updateCartState(cartRes.data);
        return true;
      }
    } catch (err) {
      setGiftCardError(err.response?.data?.message || err.message || "Failed to apply gift card.");
      return false;
    }
  };

  const removeGiftCard = async () => {
    if (!user) return;
    try {
      await api.post("/promotions/gift-cards/remove");
      const cartRes = await api.get("/cart");
      updateCartState(cartRes.data);
    } catch (err) {
      console.error("Failed to remove gift card", err);
    }
  };

  // Guest-only calculations fallback
  const guestSubtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const freeShippingThreshold = 499;
  const guestShipping = guestSubtotal === 0 ? 0 : guestSubtotal >= freeShippingThreshold ? 0 : 99;
  const guestTax = parseFloat(((guestSubtotal * 18) / 100).toFixed(2));
  const guestTotal = parseFloat((guestSubtotal + guestShipping + guestTax).toFixed(2));

  // Determine final values based on user authentication
  const subtotal = user ? totals.subtotal : guestSubtotal;
  const discount = user ? totals.discount : 0;
  const shipping = user ? totals.shipping : guestShipping;
  const tax = user ? totals.tax : guestTax;
  const giftCardDiscount = user ? totals.giftCardDiscount : 0;
  const total = user ? totals.total : guestTotal;
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
        giftCardDiscount,
        total,
        appliedCoupon,
        couponError,
        appliedGiftCard,
        giftCardError,
        freeShippingThreshold,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        applyCoupon,
        removeCoupon,
        applyGiftCard,
        removeGiftCard,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
