import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getProducts } from "../services/supabase/products";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import ProductCard from "../components/ProductCard";
import ProductSEO from "../components/SEO/ProductSEO";
import ProductGallery, { getGalleryImages } from "../components/Product/ProductGallery";
import VariantSelector, { getUniqueOptions } from "../components/Product/VariantSelector";
import { trackViewItem } from "../services/analytics/analytics";
import { 
  Star, Heart, ShoppingCart, Share2, 
  MapPin, CheckCircle, AlertCircle, Calendar, ShieldCheck
} from "lucide-react";

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const [product, setProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("description");

  const [relatedProducts, setRelatedProducts] = useState([]);
  // Shipping estimate state
  const [pincode, setPincode] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [pincodeError, setPincodeError] = useState("");

  // Review submission state
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");

  // Reset active image index whenever selectedVariant changes
  useEffect(() => {
    setActiveImageIndex(0);
  }, [selectedVariant]);

  // Load product based on URL slug
  useEffect(() => {
    async function loadProduct() {
      try {
        const products = await getProducts();
        const foundProduct = products.find((p) => p.slug === slug);

        if (foundProduct) {
          setProduct(foundProduct);
          trackViewItem(foundProduct);
          setRelatedProducts(
            products
              .filter(
                p => p.category === foundProduct.category && p.id !== foundProduct.id
              )
              .slice(0, 4)
          );

          let initialVar = null;
          if (foundProduct.variants?.length > 0) {
            initialVar = foundProduct.variants.find(v => v.is_default) || foundProduct.variants[0];
          }
          setSelectedVariant(initialVar);

          if (initialVar) {
            if (initialVar.optionsMap && Object.keys(initialVar.optionsMap).length > 0) {
              setSelectedOptions(initialVar.optionsMap);
            } else if (initialVar.options && initialVar.options.length > 0) {
              const opts = {};
              initialVar.options.forEach(opt => {
                const name = opt.option_name || opt.name;
                const val = opt.option_value || opt.value;
                if (name && val) opts[name] = val;
              });
              setSelectedOptions(opts);
            } else {
              const uniqueOpts = getUniqueOptions(foundProduct);
              const firstGroup = Object.keys(uniqueOpts)[0];
              if (firstGroup && uniqueOpts[firstGroup]?.length > 0) {
                setSelectedOptions({ [firstGroup]: uniqueOpts[firstGroup][0] });
              }
            }
          } else {
            setSelectedOptions({});
          }

          setActiveImageIndex(0);
        }
      } catch (err) {
        console.error("Error loading product detail:", err);
      }
    }

    loadProduct();
  }, [slug]);

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-20 text-center font-accent">
        <h2 className="font-serif text-2xl font-bold text-brand-text mb-4">Product not found</h2>
        <Link to="/shop" className="bg-brand-primary text-white text-xs font-semibold px-6 py-3 rounded-xl hover:bg-brand-accent">
          Back to Shop
        </Link>
      </div>
    );
  }

  const isFavorited = isInWishlist(product.id);
  const priceToDisplay = selectedVariant ? selectedVariant.price : product.price;
  const stockToDisplay = selectedVariant ? selectedVariant.stock : product.stockCount;
  const discountPercent = product.compareAtPrice 
    ? Math.round(((product.compareAtPrice - priceToDisplay) / product.compareAtPrice) * 100)
    : 0;

  // Generic multi-option variant selection handler
  const handleOptionSelect = (optionName, optionValue) => {
    const updatedOptions = {
      ...selectedOptions,
      [optionName]: optionValue
    };
    setSelectedOptions(updatedOptions);

    if (product && product.variants && product.variants.length > 0) {
      const matchedVariant = product.variants.find(variant => {
        if (variant.optionsMap && Object.keys(variant.optionsMap).length > 0) {
          return Object.entries(updatedOptions).every(
            ([key, val]) => variant.optionsMap[key] === val
          );
        }
        if (Array.isArray(variant.options) && variant.options.length > 0) {
          return Object.entries(updatedOptions).every(([key, val]) =>
            variant.options.some(
              o => (o.option_name || o.name) === key && (o.option_value || o.value) === val
            )
          );
        }
        return variant.name === optionValue;
      });

      if (matchedVariant) {
        setSelectedVariant(matchedVariant);
        setQuantity(1);
        setActiveImageIndex(0);
      }
    }
  };

  const handleQtyChange = (val) => {
    const newQty = Math.max(1, Math.min(stockToDisplay, val));
    setQuantity(newQty);
  };

  const handleAddToCart = () => {
    if (stockToDisplay > 0) {
      const gallery = getGalleryImages(selectedVariant, product);
      const snapshotImage = gallery[activeImageIndex] || gallery[0] || product.image;
      addToCart(product, quantity, selectedVariant?.name || "", selectedVariant?.id || null, snapshotImage);
    }
  };

  const handleBuyNow = () => {
    if (stockToDisplay > 0) {
      const gallery = getGalleryImages(selectedVariant, product);
      const snapshotImage = gallery[activeImageIndex] || gallery[0] || product.image;
      addToCart(product, quantity, selectedVariant?.name || "", selectedVariant?.id || null, snapshotImage);
      navigate("/checkout");
    }
  };

  // Delivery estimate logic
  const handlePincodeSubmit = (e) => {
    e.preventDefault();
    setPincodeError("");
    setDeliveryDate("");

    if (!/^\d{6}$/.test(pincode)) {
      setPincodeError("Please enter a valid 6-digit PIN code.");
      return;
    }

    const delivery = new Date();
    delivery.setDate(delivery.getDate() + 4);
    const options = { weekday: 'long', month: 'short', day: 'numeric' };
    setDeliveryDate(delivery.toLocaleDateString('en-US', options));
  };

  const handleShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("Product URL link copied to clipboard!");
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(`Check out this beautiful ${product.name} on Me Nestham By Bhanni! ${window.location.href}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 py-10 font-accent flex flex-col text-left">
      <ProductSEO product={product} />

      {/* Breadcrumb */}
      <div className="text-xs text-brand-text-muted mb-8">
        <Link to="/" className="hover:text-brand-primary">Home</Link>
        <span className="mx-2">&gt;</span>
        <Link to="/shop" className="hover:text-brand-primary">Shop</Link>
        <span className="mx-2">&gt;</span>
        <Link to={`/categories/${product.category}`} className="hover:text-brand-primary uppercase">
          {product.category?.replace("-", " ")}
        </Link>
        <span className="mx-2">&gt;</span>
        <span className="text-brand-primary font-semibold">{product.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
        {/* Left: Interactive Product Gallery */}
        <ProductGallery
          product={product}
          selectedVariant={selectedVariant}
          activeImageIndex={activeImageIndex}
          setActiveImageIndex={setActiveImageIndex}
        />

        {/* Right: Product Details & Variant Controls */}
        <div className="flex flex-col gap-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-brand-primary block mb-2">
              {product.category?.replace("-", " ")} Collection
            </span>
            <h1 className="font-serif text-3xl font-extrabold text-brand-text leading-tight mb-2">
              {product.name}
            </h1>
            
            {/* Rating summary */}
            <div className="flex items-center gap-2 text-sm mt-3">
              <div className="flex items-center text-amber-500">
                <Star size={14} fill="currentColor" />
                <span className="font-bold text-brand-text ml-1">{product.rating}</span>
              </div>
              <span className="text-brand-text-muted">|</span>
              <a href="#reviews" className="text-brand-accent underline font-semibold hover:text-brand-primary">
                {product.reviewCount || 0} customer reviews
              </a>
            </div>
          </div>

          {/* Pricing Row */}
          <div className="p-4 bg-brand-secondary border border-brand-border rounded-2xl flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] text-brand-text-muted uppercase tracking-wider font-bold">Best Selling Price</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-mono text-2xl font-bold text-brand-primary">₹{priceToDisplay}</span>
                {product.compareAtPrice && (
                  <span className="font-mono text-sm text-brand-text-muted line-through">₹{product.compareAtPrice}</span>
                )}
              </div>
            </div>
            {discountPercent > 0 && (
              <span className="bg-brand-primary text-white text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider shadow-sm">
                Save {discountPercent}%
              </span>
            )}
          </div>

          <p className="text-xs md:text-sm text-brand-text-muted leading-relaxed">
            {product.shortDescription}
          </p>

          {/* Modular Variant Selector */}
          <VariantSelector
            product={product}
            selectedOptions={selectedOptions}
            onOptionSelect={handleOptionSelect}
          />

          {/* Stock Level Indicator */}
          <div>
            {stockToDisplay > 0 ? (
              <div className="flex items-center gap-1.5 text-xs text-brand-success font-semibold">
                <CheckCircle size={14} />
                <span>In Stock — ready to ship ({stockToDisplay} remaining)</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-brand-error font-semibold animate-pulse-soft">
                <AlertCircle size={14} />
                <span>Out of Stock — waitlist notification open</span>
              </div>
            )}
          </div>

          {/* Quantity Selector and Cart Action Buttons */}
          {stockToDisplay > 0 ? (
            <div className="flex flex-col sm:flex-row items-center gap-4 mt-2">
              <div className="flex items-center border border-brand-border rounded-xl bg-brand-card overflow-hidden">
                <button
                  type="button"
                  onClick={() => handleQtyChange(quantity - 1)}
                  className="px-4 py-3 hover:bg-brand-secondary text-brand-text font-bold text-sm cursor-pointer"
                >
                  -
                </button>
                <span className="px-5 py-3 font-mono font-semibold text-sm border-x border-brand-border">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => handleQtyChange(quantity + 1)}
                  className="px-4 py-3 hover:bg-brand-secondary text-brand-text font-bold text-sm cursor-pointer"
                >
                  +
                </button>
              </div>

              <div className="flex flex-1 gap-3 w-full">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="flex-1 bg-brand-secondary hover:bg-brand-border text-brand-text font-semibold px-6 py-4 rounded-xl border border-brand-border text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer"
                >
                  <ShoppingCart size={16} /> Add to Cart
                </button>
                <button
                  type="button"
                  onClick={handleBuyNow}
                  className="flex-1 bg-brand-primary hover:bg-brand-accent text-white font-semibold px-6 py-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  Buy Now
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Enter your email to get notified"
                className="flex-1 bg-brand-secondary border border-brand-border px-4 py-3 rounded-xl outline-none focus:border-brand-primary text-xs"
              />
              <button 
                type="button"
                onClick={() => alert("Thank you! You have been added to the stock notification waitlist.")}
                className="bg-brand-primary text-white text-xs font-semibold px-6 py-3 rounded-xl hover:bg-brand-accent cursor-pointer"
              >
                Notify Me
              </button>
            </div>
          )}

          {/* Wishlist & Social Sharing */}
          <div className="flex items-center justify-between border-t border-brand-border pt-5 mt-2">
            <button
              type="button"
              onClick={() => toggleWishlist(product.id)}
              className={`flex items-center gap-2 text-xs font-semibold transition-colors cursor-pointer ${
                isFavorited ? "text-brand-primary" : "text-brand-text-muted hover:text-brand-primary"
              }`}
            >
              <Heart size={16} fill={isFavorited ? "currentColor" : "none"} />
              {isFavorited ? "Saved in Wishlist" : "Save to Wishlist"}
            </button>

            <div className="flex items-center gap-4 text-xs font-semibold text-brand-text-muted">
              <span>Share:</span>
              <button type="button" onClick={handleShareWhatsApp} className="hover:text-brand-success cursor-pointer" aria-label="Share on WhatsApp">
                WhatsApp
              </button>
              <button type="button" onClick={handleShareLink} className="hover:text-brand-primary flex items-center gap-1 cursor-pointer">
                <Share2 size={12} /> Copy Link
              </button>
            </div>
          </div>

          {/* Delivery Estimator */}
          <div className="border border-brand-border bg-brand-secondary/40 rounded-2xl p-5 mt-2 flex flex-col gap-3 text-xs">
            <span className="font-bold text-brand-text flex items-center gap-1.5">
              <MapPin size={14} className="text-brand-primary" /> Check Delivery Schedule
            </span>
            <form onSubmit={handlePincodeSubmit} className="flex gap-2">
              <input
                type="text"
                placeholder="Enter 6-digit Pincode (e.g. 500033)"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                className="flex-1 bg-brand-card text-brand-text border border-brand-border px-4 py-2.5 rounded-xl outline-none focus:border-brand-primary"
              />
              <button 
                type="submit" 
                className="bg-brand-primary text-white px-5 rounded-xl font-semibold hover:bg-brand-accent cursor-pointer"
              >
                Check
              </button>
            </form>
            {pincodeError && <p className="text-[10px] text-brand-error font-semibold">{pincodeError}</p>}
            {deliveryDate && (
              <div className="bg-brand-success/10 border border-brand-success/30 p-3 rounded-xl flex items-start gap-2 text-brand-success">
                <Calendar size={14} className="shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Standard Delivery Available</p>
                  <p className="text-[10px] text-brand-success mt-0.5">Delivered by or before <span className="underline font-bold">{deliveryDate}</span> (Free shipping qualified).</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <section className="mb-16">
        <div className="flex border-b border-brand-border mb-6">
          <button
            type="button"
            onClick={() => setActiveTab("description")}
            className={`pb-3 px-6 text-sm font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === "description"
                ? "border-brand-primary text-brand-primary"
                : "border-transparent text-brand-text-muted hover:text-brand-text"
            }`}
          >
            Description
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("specifications")}
            className={`pb-3 px-6 text-sm font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === "specifications"
                ? "border-brand-primary text-brand-primary"
                : "border-transparent text-brand-text-muted hover:text-brand-text"
            }`}
          >
            Specifications
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("reviews")}
            className={`pb-3 px-6 text-sm font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === "reviews"
                ? "border-brand-primary text-brand-primary"
                : "border-transparent text-brand-text-muted hover:text-brand-text"
            }`}
          >
            Reviews ({product.reviewCount || 0})
          </button>
        </div>

        {activeTab === "description" && (
          <div className="prose max-w-none text-xs md:text-sm text-brand-text-muted leading-relaxed flex flex-col gap-4">
            <p>{product.description}</p>
            <div className="p-4 bg-brand-secondary/60 rounded-xl border border-brand-border flex items-center gap-3 text-brand-text mt-2">
              <ShieldCheck className="text-brand-primary shrink-0" size={20} />
              <span>100% Authentic Handcrafted Quality Guarantee from Telangana Artisans.</span>
            </div>
          </div>
        )}

        {activeTab === "specifications" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {product.specs ? (
              Object.entries(product.specs).map(([key, val]) => (
                <div key={key} className="flex justify-between p-3 bg-brand-secondary rounded-xl border border-brand-border">
                  <span className="font-semibold text-brand-text-muted">{key}</span>
                  <span className="font-bold text-brand-text">{val}</span>
                </div>
              ))
            ) : (
              <p className="text-brand-text-muted">No specifications provided.</p>
            )}
          </div>
        )}

        {activeTab === "reviews" && (
          <div id="reviews" className="flex flex-col gap-6">
            <h3 className="font-serif text-lg font-bold text-brand-text">Customer Reviews</h3>
            {product.reviews && product.reviews.length > 0 ? (
              <div className="flex flex-col gap-4">
                {product.reviews.map((rev) => (
                  <div key={rev.id} className="p-4 bg-brand-secondary rounded-2xl border border-brand-border flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <img src={rev.userAvatar} alt={rev.userName} className="w-8 h-8 rounded-full object-cover" />
                        <span className="font-bold text-xs text-brand-text">{rev.userName}</span>
                      </div>
                      <div className="flex text-amber-500">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={11} fill={i < rev.rating ? "currentColor" : "none"} />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-brand-text-muted italic">{rev.comment}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-brand-text-muted">No reviews yet. Be the first to review!</p>
            )}
          </div>
        )}
      </section>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="border-t border-brand-border pt-12">
          <h2 className="font-serif text-2xl font-bold text-brand-text mb-8">You May Also Like</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
