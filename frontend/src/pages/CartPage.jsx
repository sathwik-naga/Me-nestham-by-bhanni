import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { useAuth } from "../context/AuthContext";
import { Trash2, Heart, ArrowRight, Tag, X, ShoppingBag, Loader2 } from "lucide-react";
import ProductCard from "../components/ProductCard";
import { db } from "../services/db";
import { api } from "../services/api";

export default function CartPage() {
  const { user } = useAuth();
  const { 
    cartItems, subtotal, discount, shipping, tax, giftCardDiscount, total, 
    appliedCoupon, couponError, appliedGiftCard, giftCardError, freeShippingThreshold,
    removeFromCart, updateQuantity, applyCoupon, removeCoupon, applyGiftCard, removeGiftCard 
  } = useCart();
  const { addToWishlist } = useWishlist();
  const [couponCode, setCouponCode] = useState("");
  const [giftCardCode, setGiftCardCode] = useState("");

  const [previewData, setPreviewData] = useState(null);
  const [previewError, setPreviewError] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);

  const handleCouponPreview = async (e) => {
    e.preventDefault();
    if (!user) {
      setPreviewError("Please login to apply coupons.");
      return;
    }
    if (!couponCode.trim()) return;
    setPreviewError("");
    setPreviewData(null);
    setPreviewLoading(true);
    try {
      const res = await api.post("/promotions/validate", { code: couponCode.trim() });
      if (res.data.status === "success" && res.data.data.isValid) {
        setPreviewData({
          code: couponCode.trim().toUpperCase(),
          discount: res.data.data.discount,
        });
      } else {
        setPreviewError(res.data.data.error || "Coupon is invalid");
      }
    } catch (err) {
      setPreviewError(err.response?.data?.message || err.message || "Failed to preview coupon");
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleCouponSubmit = (e) => {
    e.preventDefault();
    if (couponCode.trim()) {
      applyCoupon(couponCode.trim());
      setCouponCode("");
      setPreviewData(null);
    }
  };

  const handleGiftCardSubmit = (e) => {
    e.preventDefault();
    if (giftCardCode.trim()) {
      applyGiftCard(giftCardCode.trim());
      setGiftCardCode("");
    }
  };

  const handleMoveToWishlist = (item) => {
    addToWishlist(item.id);
    removeFromCart(item.id, item.variant);
  };

  const netToFreeShipping = freeShippingThreshold - subtotal;
  const progressPercent = Math.min(100, (subtotal / freeShippingThreshold) * 100);

  // Recommendations: top rated items not currently in the cart
  const cartIds = cartItems.map(item => item.id);
  const recommendations = db.getProducts()
    .filter(p => !cartIds.includes(p.id))
    .slice(0, 4);

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 py-10 font-accent flex flex-col text-left">
      {/* Breadcrumb */}
      <div className="text-xs text-brand-text-muted mb-8">
        <Link to="/" className="hover:text-brand-primary">Home</Link>
        <span className="mx-2">&gt;</span>
        <span className="text-brand-primary font-semibold">Shopping Cart</span>
      </div>

      <h1 className="font-serif text-3xl font-bold text-brand-text mb-8">Shopping Cart</h1>

      {cartItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-20 bg-brand-card border border-brand-border rounded-3xl p-6 mb-16">
          <div className="w-20 h-20 rounded-full bg-brand-secondary border border-brand-border flex items-center justify-center text-brand-primary mb-6">
            <ShoppingBag size={32} />
          </div>
          <h2 className="font-serif font-bold text-xl text-brand-text mb-2">Your Shopping Cart is Empty</h2>
          <p className="text-xs text-brand-text-muted max-w-sm mb-8 leading-relaxed">
            Fill it with unique, certified handcrafted treasures and heritage blockprints.
          </p>
          <Link
            to="/shop"
            className="bg-brand-primary text-white font-semibold text-xs px-8 py-4 rounded-xl hover:bg-brand-accent transition-all shadow-md active:scale-95"
          >
            Explore Catalog
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16 items-start">
          {/* Left: Cart Items List */}
          <div className="lg:col-span-2 flex flex-col gap-5">
            {/* Free shipping bar */}
            <div className="p-4 bg-brand-secondary border border-brand-border rounded-2xl">
              {netToFreeShipping > 0 ? (
                <p className="text-xs text-brand-text-muted mb-2.5">
                  Add <span className="font-bold text-brand-primary font-mono">₹{netToFreeShipping}</span> more to unlock <span className="font-semibold text-brand-success">FREE Delivery</span>.
                </p>
              ) : (
                <p className="text-xs text-brand-success font-semibold mb-2.5">
                  🎉 Your order qualifies for free delivery!
                </p>
              )}
              <div className="w-full bg-brand-border h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-brand-primary h-full transition-all duration-500" 
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* List */}
            <div className="flex flex-col gap-4">
              {cartItems.map((item) => (
                <div 
                  key={`${item.id}-${item.variant}`}
                  className="flex flex-col sm:flex-row gap-5 p-4 bg-brand-card border border-brand-card-border rounded-2xl shadow-sm hover:shadow-md transition-shadow relative"
                >
                  {/* Thumbnail */}
                  <img 
                    src={item.image} 
                    alt={item.name} 
                    className="w-24 h-24 rounded-xl object-cover border border-brand-border"
                  />

                  {/* Details */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-4">
                        <Link to={`/products/${item.slug}`} className="hover:text-brand-primary transition-colors">
                          <h3 className="font-serif font-bold text-sm md:text-base text-brand-text line-clamp-2">
                            {item.name}
                          </h3>
                        </Link>
                        
                        <button
                          onClick={() => removeFromCart(item.id, item.variant)}
                          className="text-brand-text-muted hover:text-brand-error transition-colors p-1"
                          title="Remove item"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      {item.variant && (
                        <span className="text-[10px] bg-brand-secondary text-brand-text-muted px-2.5 py-0.5 rounded border border-brand-border inline-block mt-1 font-bold uppercase tracking-wider">
                          Option: {item.variant}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      {/* Qty count */}
                      <div className="flex items-center border border-brand-border rounded-lg bg-brand-bg overflow-hidden text-xs">
                        <button
                          onClick={() => updateQuantity(item.id, item.variant, item.quantity - 1)}
                          className="px-2.5 py-1 hover:bg-brand-secondary text-brand-text font-bold"
                        >
                          -
                        </button>
                        <span className="px-3.5 py-1 font-mono font-semibold border-x border-brand-border">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.variant, item.quantity + 1)}
                          className="px-2.5 py-1 hover:bg-brand-secondary text-brand-text font-bold"
                        >
                          +
                        </button>
                      </div>

                      {/* Math row */}
                      <div className="flex items-center gap-6">
                        <button
                          onClick={() => handleMoveToWishlist(item)}
                          className="text-xs font-semibold text-brand-text-muted hover:text-brand-accent transition-colors flex items-center gap-1"
                        >
                          <Heart size={12} /> Move to Wishlist
                        </button>

                        <span className="font-mono text-sm md:text-base font-bold text-brand-primary">
                          ₹{item.price * item.quantity}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Summary panel */}
          <div className="flex flex-col gap-6">
            <div className="bg-brand-card border border-brand-card-border p-6 rounded-3xl shadow-md">
              <h3 className="font-serif font-bold text-lg text-brand-text mb-6 pb-3 border-b border-brand-border">
                Order Summary
              </h3>

              {/* Subtotal, Shipping, Tax, Gift Card */}
              <div className="flex flex-col gap-4 text-xs border-b border-brand-border pb-6 mb-6">
                <div className="flex justify-between">
                  <span className="text-brand-text-muted font-medium">Subtotal</span>
                  <span className="font-mono font-semibold text-brand-text">₹{subtotal}</span>
                </div>

                {appliedCoupon && (
                  <div className="flex justify-between text-brand-success font-semibold">
                    <span className="flex items-center gap-1"><Tag size={12} /> Coupon ({appliedCoupon.code})</span>
                    <span className="font-mono">-₹{discount}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-brand-text-muted font-medium">Estimated Delivery Shipping</span>
                  <span className="font-mono text-brand-text font-semibold">
                    {shipping === 0 ? <span className="text-brand-success font-semibold">FREE</span> : `₹${shipping}`}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-brand-text-muted font-medium">GST Tax (18%)</span>
                  <span className="font-mono font-semibold text-brand-text">₹{tax}</span>
                </div>

                {giftCardDiscount > 0 && (
                  <div className="flex justify-between text-brand-primary font-semibold">
                    <span className="flex items-center gap-1">💳 Gift Card ({appliedGiftCard?.code})</span>
                    <span className="font-mono">-₹{giftCardDiscount}</span>
                  </div>
                )}
              </div>

              {/* Coupon inputs */}
              <div className="mb-6">
                {appliedCoupon ? (
                  <div className="flex items-center justify-between bg-brand-success/10 border border-brand-success/30 rounded-xl px-4 py-2.5 text-xs text-brand-success">
                    <span className="font-semibold">Coupon Applied: **{appliedCoupon.code}**</span>
                    <button 
                      onClick={removeCoupon} 
                      className="p-1 hover:bg-brand-success/20 rounded-full text-brand-success"
                      aria-label="Remove coupon"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <form onSubmit={handleCouponSubmit} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Coupon Code"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        className="flex-1 bg-brand-secondary text-brand-text border border-brand-border px-3.5 py-2.5 rounded-xl outline-none focus:border-brand-primary text-xs"
                      />
                      <button
                        type="button"
                        onClick={handleCouponPreview}
                        disabled={previewLoading}
                        className="bg-brand-secondary hover:bg-brand-border border border-brand-border text-brand-text font-semibold px-3.5 rounded-xl text-xs flex items-center justify-center"
                      >
                        {previewLoading ? <Loader2 className="animate-spin" size={14} /> : "Preview"}
                      </button>
                      <button 
                        type="submit" 
                        className="bg-brand-primary hover:bg-brand-accent text-white font-semibold px-4 rounded-xl text-xs"
                      >
                        Apply
                      </button>
                    </form>

                    {previewData && (
                      <div className="p-3 bg-brand-primary/5 border border-brand-primary/20 rounded-xl text-xs text-brand-text flex flex-col gap-1.5 text-left animate-pulse-soft">
                        <p className="font-bold text-brand-primary">🎉 Promo Code Preview</p>
                        <p>Coupon: <span className="font-mono font-bold">{previewData.code}</span></p>
                        <p>You save: <span className="font-mono font-bold text-brand-success">₹{previewData.discount}</span></p>
                        <p>Final Total: <span className="font-mono font-bold">₹{(subtotal - previewData.discount + shipping + tax).toFixed(2)}</span></p>
                        <button
                          type="button"
                          onClick={() => {
                            applyCoupon(previewData.code);
                            setPreviewData(null);
                            setCouponCode("");
                          }}
                          className="mt-1 bg-brand-primary hover:bg-brand-accent text-white font-semibold py-1.5 px-3 rounded-lg text-[10px] text-center"
                        >
                          Apply Coupon Now
                        </button>
                      </div>
                    )}
                    {previewError && <p className="text-[10px] text-brand-error font-semibold mt-1 pl-1">{previewError}</p>}
                  </div>
                )}
                {couponError && <p className="text-[10px] text-brand-error font-semibold mt-2 pl-1">{couponError}</p>}
              </div>

              {/* Gift Card inputs */}
              <div className="mb-6 border-t border-brand-border pt-6">
                {appliedGiftCard ? (
                  <div className="flex items-center justify-between bg-brand-primary/10 border border-brand-primary/30 rounded-xl px-4 py-2.5 text-xs text-brand-primary">
                    <span className="font-semibold">Gift Card: **{appliedGiftCard.code}**</span>
                    <button 
                      onClick={removeGiftCard} 
                      className="p-1 hover:bg-brand-primary/20 rounded-full text-brand-primary"
                      aria-label="Remove gift card"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleGiftCardSubmit} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Redeem Gift Card"
                      value={giftCardCode}
                      onChange={(e) => setGiftCardCode(e.target.value)}
                      className="flex-1 bg-brand-secondary text-brand-text border border-brand-border px-3.5 py-2.5 rounded-xl outline-none focus:border-brand-primary text-xs"
                    />
                    <button 
                      type="submit" 
                      className="bg-brand-secondary hover:bg-brand-border border border-brand-border text-brand-text font-semibold px-4 rounded-xl text-xs font-accent"
                    >
                      Redeem
                    </button>
                  </form>
                )}
                {giftCardError && <p className="text-[10px] text-brand-error font-semibold mt-2 pl-1">{giftCardError}</p>}
              </div>

              {/* Grand Total */}
              <div className="flex items-baseline justify-between text-brand-text font-semibold mb-6 border-b border-brand-border pb-6">
                <span className="text-sm">Grand Total</span>
                <span className="font-mono text-xl font-bold text-brand-primary">₹{total}</span>
              </div>

              {/* Checkout buttons */}
              <div className="flex flex-col gap-3">
                <Link
                  to="/checkout"
                  className="w-full bg-brand-primary hover:bg-brand-accent text-white text-center rounded-xl py-3.5 text-xs font-semibold flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
                >
                  Proceed to Checkout <ArrowRight size={14} />
                </Link>
                
                <Link
                  to="/shop"
                  className="w-full border border-brand-border text-center rounded-xl py-3.5 text-xs font-semibold hover:bg-brand-secondary text-brand-text transition-colors"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>

            {/* Payment security info */}
            <div className="text-[10px] text-brand-text-muted leading-relaxed text-center px-4">
              🛡️ Checkout process is securely processed via 256-bit encrypted SSL servers in partnership with Razorpay network.
            </div>
          </div>
        </div>
      )}

      {/* Recommendations Slider */}
      {recommendations.length > 0 && (
        <section className="border-t border-brand-border pt-12">
          <h2 className="font-serif text-2xl font-bold text-brand-text mb-8">You May Also Like</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {recommendations.map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
