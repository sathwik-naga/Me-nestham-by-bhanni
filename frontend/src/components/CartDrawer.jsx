import React from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { X, Trash2, Heart, ArrowRight, ShoppingBag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function CartDrawer({ isOpen, onClose }) {
  const { 
    cartItems, subtotal, freeShippingThreshold, removeFromCart, updateQuantity 
  } = useCart();
  const { addToWishlist } = useWishlist();

  const handleMoveToWishlist = (item) => {
    addToWishlist(item.id);
    removeFromCart(item.id, item.variant);
  };

  const netToFreeShipping = freeShippingThreshold - subtotal;
  const progressPercent = Math.min(100, (subtotal / freeShippingThreshold) * 100);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black z-50 backdrop-blur-sm"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-full sm:w-[440px] bg-brand-bg border-l border-brand-border z-50 flex flex-col shadow-2xl font-accent"
          >
            {/* Header */}
            <div className="p-6 border-b border-brand-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="text-brand-primary" size={20} />
                <h3 className="font-serif font-bold text-lg text-brand-text">Your Cart</h3>
                <span className="bg-brand-secondary dark:bg-[#25211E] text-brand-primary text-xs font-bold px-2 py-0.5 rounded-full border border-brand-border">
                  {cartItems.reduce((acc, i) => acc + i.quantity, 0)}
                </span>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-brand-secondary hover:dark:bg-[#2D2723] rounded-full text-brand-text-muted hover:text-brand-text"
              >
                <X size={20} />
              </button>
            </div>

            {/* Free Shipping Tracker */}
            {cartItems.length > 0 && (
              <div className="px-6 py-4 bg-brand-secondary dark:bg-[#201D1B] border-b border-brand-border">
                {netToFreeShipping > 0 ? (
                  <p className="text-xs text-brand-text-muted mb-2">
                    Add <span className="font-bold text-brand-primary font-mono">₹{netToFreeShipping}</span> more for <span className="font-semibold text-brand-success">FREE shipping</span>!
                  </p>
                ) : (
                  <p className="text-xs text-brand-success font-semibold mb-2">
                    🎉 Your order qualifies for free shipping!
                  </p>
                )}
                <div className="w-full bg-brand-border dark:bg-stone-700 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-brand-primary h-full transition-all duration-500" 
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
              {cartItems.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
                  <div className="w-20 h-20 rounded-full bg-brand-secondary dark:bg-[#25211E] border border-brand-border flex items-center justify-center text-brand-text-muted">
                    <ShoppingBag size={32} />
                  </div>
                  <div>
                    <h4 className="font-serif font-bold text-base text-brand-text mb-1">Your cart is empty</h4>
                    <p className="text-xs text-brand-text-muted max-w-[240px] leading-relaxed">
                      Discover handcrafted heritage pieces and fill your cart with authentic creations.
                    </p>
                  </div>
                  <Link
                    to="/shop"
                    onClick={onClose}
                    className="mt-2 bg-brand-primary text-white text-xs font-semibold px-6 py-3 rounded-xl hover:bg-brand-accent transition-all active:scale-95"
                  >
                    Start Shopping
                  </Link>
                </div>
              ) : (
                cartItems.map((item) => (
                  <div 
                    key={`${item.id}-${item.variant}`} 
                    className="flex gap-4 p-3 bg-brand-card border border-brand-card-border rounded-xl shadow-sm hover:shadow-md transition-shadow relative"
                  >
                    {/* Thumbnail */}
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      className="w-20 h-20 rounded-lg object-cover border border-brand-border"
                    />

                    {/* Content */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="font-serif font-bold text-xs md:text-sm text-brand-text line-clamp-1">
                          {item.name}
                        </h4>
                        {item.variant && (
                          <span className="text-[10px] bg-brand-secondary dark:bg-[#2D2723] text-brand-text-muted px-2 py-0.5 rounded border border-brand-border inline-block mt-0.5">
                            {item.variant}
                          </span>
                        )}
                        <p className="font-mono text-xs font-bold text-brand-primary mt-1">
                          ₹{item.price}
                        </p>
                      </div>

                      {/* Quantity Selectors and Actions */}
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center border border-brand-border rounded-lg bg-brand-bg overflow-hidden text-xs">
                          <button
                            onClick={() => updateQuantity(item.id, item.variant, item.quantity - 1)}
                            className="px-2.5 py-1 hover:bg-brand-secondary text-brand-text font-bold"
                          >
                            -
                          </button>
                          <span className="px-3 py-1 font-mono font-semibold border-x border-brand-border">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.variant, item.quantity + 1)}
                            className="px-2.5 py-1 hover:bg-brand-secondary text-brand-text font-bold"
                          >
                            +
                          </button>
                        </div>

                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleMoveToWishlist(item)}
                            className="text-brand-text-muted hover:text-brand-accent transition-colors p-1"
                            title="Move to Wishlist"
                          >
                            <Heart size={14} />
                          </button>
                          <button
                            onClick={() => removeFromCart(item.id, item.variant)}
                            className="text-brand-text-muted hover:text-brand-error transition-colors p-1"
                            title="Remove item"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer Summary (if cart has items) */}
            {cartItems.length > 0 && (
              <div className="p-6 border-t border-brand-border bg-brand-secondary dark:bg-[#201D1B] flex flex-col gap-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-brand-text-muted">Estimated Subtotal</span>
                  <span className="font-mono font-bold text-base text-brand-primary">₹{subtotal}</span>
                </div>
                
                <p className="text-[10px] text-brand-text-muted leading-normal">
                  Shipping fees and taxes are calculated at checkout. Discount code can be applied on the next steps.
                </p>

                <div className="flex gap-3">
                  <Link
                    to="/cart"
                    onClick={onClose}
                    className="flex-1 text-center border border-brand-border hover:bg-brand-bg rounded-xl py-3 text-xs font-semibold text-brand-text transition-colors"
                  >
                    View Cart
                  </Link>
                  <Link
                    to="/checkout"
                    onClick={onClose}
                    className="flex-1 bg-brand-primary hover:bg-brand-accent text-white rounded-xl py-3 text-xs font-semibold flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
                  >
                    Checkout <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
