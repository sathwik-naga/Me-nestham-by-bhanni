import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getProducts } from "../services/supabase/products";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { useAuth } from "../context/AuthContext";
import ProductCard from "../components/ProductCard";
import { 
  Star, Heart, ShoppingCart, Send, Share2, 
  MapPin, CheckCircle, AlertCircle, Calendar, ShieldCheck
} from "lucide-react";
import { motion } from "framer-motion";

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { user } = useAuth();

  const [product, setProduct] = useState(null);
  const [activeImage, setActiveImage] = useState("");
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("description");

  const [relatedProducts, setRelatedProducts] = useState([]);
  const [selectedImage, setSelectedImage] = useState("");
  // Shipping estimate state
  const [pincode, setPincode] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [pincodeError, setPincodeError] = useState("");

  // Review state
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");
  const [reviewSuccess, setReviewSuccess] = useState("");
  const [reviewError, setReviewError] = useState("");

  // Loading product based on slug
  useEffect(() => {
  async function loadProduct() {
    try {
      const products = await getProducts();

      const foundProduct = products.find(
        (p) => p.slug === slug
      );

      if (foundProduct) {
        setProduct(foundProduct);
        setActiveImage(
  foundProduct.images?.[0] || foundProduct.image
);
        setRelatedProducts(
  products
    .filter(
      p =>
        p.category === foundProduct.category &&
        p.id !== foundProduct.id
    )
    .slice(0, 4)
);
        

        if (foundProduct.variants?.length > 0) {
          setSelectedVariant(foundProduct.variants[0]);
        } else {
          setSelectedVariant(null);
        }
      }
    } catch (err) {
      console.error(err);
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

  const handleVariantSelect = (v) => {
    setSelectedVariant(v);
    setQuantity(1); // Reset qty on variant switch
  };

  const handleQtyChange = (val) => {
    const newQty = Math.max(1, Math.min(stockToDisplay, val));
    setQuantity(newQty);
  };

  const handleAddToCart = () => {
    if (stockToDisplay > 0) {
      addToCart(product, quantity, selectedVariant?.name || "");
    }
  };

  const handleBuyNow = () => {
    if (stockToDisplay > 0) {
      addToCart(product, quantity, selectedVariant?.name || "");
      navigate("/checkout");
    }
  };

  // Simulate Delivery Estimate
  const handlePincodeSubmit = (e) => {
    e.preventDefault();
    setPincodeError("");
    setDeliveryDate("");

    if (!/^\d{6}$/.test(pincode)) {
      setPincodeError("Please enter a valid 6-digit PIN code.");
      return;
    }

    // Set delivery estimate 4 days from now
    const delivery = new Date();
    delivery.setDate(delivery.getDate() + 4);
    const options = { weekday: 'long', month: 'short', day: 'numeric' };
    setDeliveryDate(delivery.toLocaleDateString('en-US', options));
  };

  // Review submission
  const handleReviewSubmit = (e) => {
  e.preventDefault();

  alert("Reviews feature is coming soon.");
};

  // Share link helper
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
      {/* Breadcrumb */}
      <div className="text-xs text-brand-text-muted mb-8">
        <Link to="/" className="hover:text-brand-primary">Home</Link>
        <span className="mx-2">&gt;</span>
        <Link to="/shop" className="hover:text-brand-primary">Shop</Link>
        <span className="mx-2">&gt;</span>
        <Link to={`/categories/${product.category}`} className="hover:text-brand-primary uppercase">
          {product.category.replace("-", " ")}
        </Link>
        <span className="mx-2">&gt;</span>
        <span className="text-brand-primary font-semibold">{product.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
        {/* Left: Images gallery */}
        <div className="flex flex-col gap-4">

  {/* Main Image */}
  <div className="aspect-square bg-brand-secondary rounded-3xl overflow-hidden border border-brand-border shadow-sm">
    <img
      src={activeImage || product.image}
      alt={product.name}
      loading="lazy"
      onError={(e) => {
        e.currentTarget.src = "/placeholder.png";
      }}
      className="w-full h-full object-cover rounded-xl hover:scale-110 transition-transform duration-500 cursor-zoom-in"
    />
  </div>

  {/* Thumbnails */}
  <div className="flex gap-3 overflow-x-auto">
    {product.images?.map((img, index) => (
      <button
        key={index}
        onClick={() => setActiveImage(img)}
        className={`rounded-lg overflow-hidden border-2 transition-all duration-300 ${
          activeImage === img
            ? "border-brand-primary ring-2 ring-brand-primary"
            : "border-gray-300 hover:border-brand-primary"
        }`}
      >
        <img
          src={img}
          alt={`Thumbnail ${index + 1}`}
          className="w-20 h-20 object-cover"
        />
      </button>
    ))}
  </div>

  {/* Image Counter */}
  <p className="text-center text-sm text-brand-text-muted">
    {product.images?.indexOf(activeImage) + 1} / {product.images?.length}
  </p>

</div>

        {/* Right: Info details panel */}
        <div className="flex flex-col gap-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-brand-primary block mb-2">
              {product.category.replace("-", " ")} Collection
            </span>
            <h1 className="font-serif text-3xl font-extrabold text-brand-text leading-tight mb-2">
              {product.name}
            </h1>
            
            {/* Rating summary anchor */}
            <div className="flex items-center gap-2 text-sm mt-3">
              <div className="flex items-center text-amber-500">
                <Star size={14} fill="currentColor" />
                <span className="font-bold text-brand-text ml-1">{product.rating}</span>
              </div>
              <span className="text-brand-text-muted">|</span>
              <a href="#reviews" className="text-brand-accent underline font-semibold hover:text-brand-primary">
                {product.reviewCount} customer reviews
              </a>
            </div>
          </div>

          {/* Pricing Row */}
          <div className="p-4 bg-brand-secondary dark:bg-[#201D1B] border border-brand-border rounded-2xl flex items-center justify-between">
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

          {/* Product Variant Selectors */}
          {product.variants && product.variants.length > 0 && (
            <div className="flex flex-col gap-3.5">
              <span className="text-xs font-bold text-brand-text uppercase tracking-wider">
                Select Option: <span className="text-brand-primary font-bold">{selectedVariant?.name}</span>
              </span>
              <div className="flex flex-wrap gap-2.5">
                {product.variants.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => handleVariantSelect(v)}
                    className={`px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                      selectedVariant?.id === v.id
                        ? "bg-brand-primary border-brand-primary text-white shadow-md font-bold"
                        : "bg-brand-card border-brand-border hover:bg-brand-secondary text-brand-text"
                    }`}
                  >
                    {v.name} (₹{v.price})
                  </button>
                ))}
              </div>
            </div>
          )}

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
              {/* Qty count */}
              <div className="flex items-center border border-brand-border rounded-xl bg-brand-card overflow-hidden">
                <button
                  onClick={() => handleQtyChange(quantity - 1)}
                  className="px-4 py-3 hover:bg-brand-secondary text-brand-text font-bold text-sm"
                >
                  -
                </button>
                <span className="px-5 py-3 font-mono font-semibold text-sm border-x border-brand-border">
                  {quantity}
                </span>
                <button
                  onClick={() => handleQtyChange(quantity + 1)}
                  className="px-4 py-3 hover:bg-brand-secondary text-brand-text font-bold text-sm"
                >
                  +
                </button>
              </div>

              {/* Action triggers */}
              <div className="flex flex-1 gap-3 w-full">
                <button
                  onClick={handleAddToCart}
                  className="flex-1 bg-brand-secondary hover:bg-brand-border dark:bg-[#2D2723] dark:hover:bg-[#3D352F] text-brand-text font-semibold px-6 py-4 rounded-xl border border-brand-border text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer"
                >
                  <ShoppingCart size={16} /> Add to Cart
                </button>
                <button
                  onClick={handleBuyNow}
                  className="flex-1 bg-brand-primary hover:bg-brand-accent text-white font-semibold px-6 py-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  Buy Now
                </button>
              </div>
            </div>
          ) : (
            // Notify waitlist input
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Enter your email to get notified"
                className="flex-1 bg-brand-secondary border border-brand-border px-4 py-3 rounded-xl outline-none focus:border-brand-primary text-xs"
              />
              <button 
                onClick={() => alert("Thank you! You have been added to the stock notification waitlist.")}
                className="bg-brand-primary text-white text-xs font-semibold px-6 py-3 rounded-xl hover:bg-brand-accent"
              >
                Notify Me
              </button>
            </div>
          )}

          {/* Wishlist Heart & Share triggers */}
          <div className="flex items-center justify-between border-t border-brand-border pt-5 mt-2">
            <button
              onClick={() => toggleWishlist(product.id)}
              className={`flex items-center gap-2 text-xs font-semibold transition-colors ${
                isFavorited ? "text-brand-primary" : "text-brand-text-muted hover:text-brand-primary"
              }`}
            >
              <Heart size={16} fill={isFavorited ? "currentColor" : "none"} />
              {isFavorited ? "Saved in Wishlist" : "Save to Wishlist"}
            </button>

            <div className="flex items-center gap-4 text-xs font-semibold text-brand-text-muted">
              <span>Share:</span>
              <button onClick={handleShareWhatsApp} className="hover:text-brand-success" aria-label="Share on WhatsApp">
                WhatsApp
              </button>
              <button onClick={handleShareLink} className="hover:text-brand-primary flex items-center gap-1">
                <Share2 size={12} /> Copy Link
              </button>
            </div>
          </div>

          {/* Delivery Pincode Estimator */}
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
                className="bg-brand-primary text-white px-5 rounded-xl font-semibold hover:bg-brand-accent"
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

      {/* Tabs and Reviews sections */}
      <section className="mb-16">
        {/* Tab triggers */}
        <div className="flex border-b border-brand-border gap-6 mb-8 text-sm font-semibold">
          {["description", "specifications", "shipping"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 capitalize transition-all border-b-2 ${
                activeTab === tab
                  ? "border-brand-primary text-brand-primary font-bold"
                  : "border-transparent text-brand-text-muted hover:text-brand-text"
              }`}
            >
              {tab === "shipping" ? "Shipping & Returns" : tab}
            </button>
          ))}
        </div>

        {/* Tab panels */}
        <div className="text-xs md:text-sm text-brand-text-muted leading-relaxed">
          {activeTab === "description" && (
            <div className="flex flex-col gap-4">
              <p>{product.description}</p>
              <div className="mt-4 p-4 border border-brand-border rounded-2xl flex items-center gap-3 bg-brand-secondary/40">
                <ShieldCheck size={24} className="text-brand-primary shrink-0" />
                <p className="text-xs text-brand-text-muted">
                  <strong>Quality Guarantee:</strong> Every item is certified handcrafted by master makers. Due to their handmade authenticity, minor textures and shade differentials represent unique design fingerprints, not defects.
                </p>
              </div>
            </div>
          )}

          {activeTab === "specifications" && (
  <table className="w-full border-collapse border border-brand-border max-w-xl text-xs rounded-xl overflow-hidden">
    <tbody>
      {product.specs ? (
        Object.entries(product.specs).map(([key, val], idx) => (
          <tr
            key={idx}
            className={idx % 2 === 0 ? "bg-brand-secondary/35" : ""}
          >
            <td className="border border-brand-border px-4 py-3 font-semibold text-brand-text">
              {key}
            </td>

            <td className="border border-brand-border px-4 py-3 text-brand-text-muted">
              {val}
            </td>
          </tr>
        ))
      ) : (
        <tr>
          <td
            colSpan="2"
            className="text-center py-4 text-brand-text-muted"
          >
            Specifications will be added soon.
          </td>
        </tr>
      )}
    </tbody>
  </table>
)}

          {activeTab === "shipping" && (
            <div className="flex flex-col gap-3 text-xs leading-relaxed max-w-2xl">
              <h4 className="font-bold text-brand-text text-sm mb-1">Shipping Guidelines</h4>
              <p>We provide complimentary standard shipping across India on all orders exceeding ₹499. Orders below ₹499 carry a flat ₹99 carrier fee. Handcrafted items usually ship from artisan hubs within 24-48 hours. Delivery timelines range between 3-5 working days depending on postal destinations.</p>
              <h4 className="font-bold text-brand-text text-sm mt-3 mb-1">Return Rules</h4>
              <p>We sustain a friendly 7-day reverse return timeline. Initiations can be raised under consumer account profiles. Pickups are completely automated. Refunds reflecting source transaction channels complete within 5-7 working days of stock check confirmation.</p>
            </div>
          )}
        </div>
      </section>

      {/* Reviews Panel */}
      <section id="reviews" className="border-t border-brand-border pt-12 mb-16 scroll-mt-20">
        <h2 className="font-serif text-2xl font-bold text-brand-text mb-8">Client Reviews &amp; Ratings</h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
          {/* Review form */}
          <div className="p-6 bg-brand-secondary dark:bg-[#201D1B] border border-brand-border rounded-2xl flex flex-col gap-4">
            <h4 className="font-serif font-bold text-base text-brand-text">Write a Review</h4>
            <p className="text-[11px] text-brand-text-muted leading-relaxed">
              Have you bought this item? Share your handcrafted product feedback with our shopper community.
            </p>
            
            <form onSubmit={handleReviewSubmit} className="flex flex-col gap-3.5 mt-2">
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-brand-text">Star Rating</span>
                <div className="flex gap-1.5 text-amber-500">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewRating(star)}
                      className="hover:scale-110 transition-transform"
                    >
                      <Star size={20} fill={star <= newRating ? "currentColor" : "none"} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-brand-text">Your Feedback Message</span>
                <textarea
                  placeholder="What did you like or dislike? How is the finish?"
                  rows={4}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="w-full bg-brand-card text-brand-text text-xs border border-brand-border p-3 rounded-xl outline-none focus:border-brand-primary"
                />
              </div>

              {reviewError && <p className="text-[10px] text-brand-error font-bold">{reviewError}</p>}
              {reviewSuccess && <p className="text-[10px] text-brand-success font-bold leading-normal">{reviewSuccess}</p>}

              <button
                type="submit"
                className="bg-brand-primary hover:bg-brand-accent text-white font-semibold text-xs py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
              >
                Submit Review <Send size={12} />
              </button>
            </form>
          </div>

          {/* Reviews List */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {(product.reviews ?? []).length === 0 ? (
              <div className="py-12 text-center text-brand-text-muted bg-brand-card border border-brand-border rounded-3xl">
                <p className="text-xs">No reviews submitted yet. Be the first to share your thoughts!</p>
              </div>
            ) : (
              (product.reviews ?? []).map((rev) => (
                <div 
                  key={rev.id} 
                  className="p-5 bg-brand-card border border-brand-card-border rounded-2xl shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <img src={rev.userAvatar} alt={rev.userName} className="w-9 h-9 rounded-full object-cover border border-brand-border" />
                      <div>
                        <h4 className="text-xs font-bold text-brand-text">{rev.userName}</h4>
                        <span className="text-[10px] text-brand-text-muted font-mono">{rev.date}</span>
                      </div>
                    </div>
                    
                    {/* Stars and Verified Purchase Badge */}
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex text-amber-500">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={11} fill={i < rev.rating ? "currentColor" : "none"} />
                        ))}
                      </div>
                      {rev.verified && (
                        <span className="text-[9px] text-brand-success font-bold bg-brand-success/10 px-2 py-0.5 rounded-full border border-brand-success/20">
                          Verified Purchaser
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-brand-text-muted leading-relaxed italic pl-1">
                    "{rev.comment}"
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Related Products Section */}
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
