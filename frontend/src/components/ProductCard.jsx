import React from "react";
import { Link } from "react-router-dom";
import { useWishlist } from "../context/WishlistContext";
import { useCart } from "../context/CartContext";
import { Heart, Star, ShoppingCart } from "lucide-react";

export default function ProductCard({ product }) {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();

  const isFavorited = isInWishlist(product.id);
  
  const discountPercent = product.compareAtPrice 
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0;

  const handleWishlistClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product.id);
  };

  const displayImage = (() => {
    if (product.variants && product.variants.length > 0) {
      const defaultVar = product.variants.find(v => v.is_default) || product.variants[0];
      if (defaultVar && defaultVar.images && defaultVar.images.length > 0) {
        const prim = defaultVar.images.find(img => typeof img === 'object' && img.is_primary);
        return prim ? (prim.image_url || prim.url) : (typeof defaultVar.images[0] === 'string' ? defaultVar.images[0] : defaultVar.images[0].image_url);
      }
    }
    return product.image || "/placeholder.png";
  })();

  const handleAddToCartClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.inStock) {
      const defaultVar = product.variants && product.variants.length > 0 ? (product.variants.find(v => v.is_default) || product.variants[0]) : null;
      addToCart(product, 1, defaultVar?.name || "", defaultVar?.id || null, displayImage);
    }
  };

  return (
    <div className="group relative bg-brand-card border border-brand-card-border rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full font-accent">
      {/* Product Image and Overlays */}
      <div className="relative aspect-square overflow-hidden bg-brand-secondary">
        <Link to={`/products/${product.slug}`}>
          
        <img
          src={displayImage}
          alt={product.name}
          width="400"
          height="400"
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        </Link>

        {/* Out of Stock Overlay */}
        {!product.inStock && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[2px]">
            <span className="bg-brand-error text-white text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full">
              Out of Stock
            </span>
          </div>
        )}

        {/* Badges: Discount or New */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {discountPercent > 0 && product.inStock && (
            <span className="bg-brand-primary text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
              {discountPercent}% OFF
            </span>
          )}
          {false && product.inStock && (
            <span className="bg-brand-accent text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
              New
            </span>
          )}
        </div>

        {/* Wishlist Heart Icon Button */}
        <button
          onClick={handleWishlistClick}
          className={`absolute top-3 right-3 p-2 rounded-full border shadow-sm backdrop-blur-sm transition-all duration-300 ${
            isFavorited
              ? "bg-brand-primary border-brand-primary text-white"
              : "bg-white/80 dark:bg-black/60 border-brand-border text-brand-text hover:text-brand-primary hover:scale-110"
          }`}
          aria-label={isFavorited ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart size={16} fill={isFavorited ? "currentColor" : "none"} />
        </button>

        {/* Quick Add To Cart button (visible on hover, desktop only) */}
        {product.inStock && (
          <button
            onClick={handleAddToCartClick}
            className="absolute bottom-3 left-3 right-3 bg-brand-primary/90 backdrop-blur-sm text-white py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 opacity-0 translate-y-3 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:bg-brand-primary shadow-md active:scale-95"
          >
            <ShoppingCart size={14} /> Quick Add
          </button>
        )}
      </div>

      {/* Product Information */}
      <div className="p-4 flex flex-col flex-1">
        {/* Category Tag */}
        <span className="text-[10px] font-bold uppercase tracking-widest text-brand-primary mb-1">
          {product.categoryName || "Category"}
        </span>

        {/* Title */}
        <Link to={`/products/${product.slug}`} className="hover:text-brand-primary transition-colors flex-1">
          <h3 className="font-serif font-bold text-sm md:text-base text-brand-text line-clamp-2 leading-snug mb-1">
            {product.name}
          </h3>
        </Link>

        {/* Ratings and Reviews */}
        <div className="flex items-center gap-1.5 mb-3">
          <div className="flex items-center text-amber-500">
            <Star size={12} fill="currentColor" />
          </div>
          <span className="text-xs font-bold text-brand-text">
  {product.rating ?? "5.0"}
</span>

<span className="text-[10px] text-brand-text-muted">
  ({product.reviewCount ?? 0})
</span>
        </div>

        {/* Price Row */}
        <div className="flex items-baseline gap-2 mt-auto">
          <span className="font-mono text-sm md:text-base font-semibold text-brand-primary">
            ₹{product.price}
          </span>
          {product.compareAtPrice && (
            <span className="font-mono text-xs text-brand-text-muted line-through">
              ₹{product.compareAtPrice}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
