import React, { useState, useEffect } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { db } from "../services/db";
import ProductCard from "../components/ProductCard";
import { SlidersHorizontal, RefreshCcw, Filter, Star, Eye } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function CategoryDetail() {
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const sortParam = searchParams.get("sort") || "featured";

  const [maxPrice, setMaxPrice] = useState(6000);
  const [minRating, setMinRating] = useState(0);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortOrder, setSortOrder] = useState(sortParam);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [visibleCount, setVisibleCount] = useState(6);

  const categories = db.getCategories();
  const currentCategory = categories.find(c => c.slug === slug);

  // Sync category scroll states
  useEffect(() => {
    setVisibleCount(6);
  }, [slug]);

  if (!currentCategory) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-20 text-center font-accent">
        <h2 className="font-serif text-2xl font-bold text-brand-text mb-4">Category not found</h2>
        <Link to="/categories" className="bg-brand-primary text-white text-xs font-semibold px-6 py-3 rounded-xl hover:bg-brand-accent">
          Back to Categories
        </Link>
      </div>
    );
  }

  const handleClearFilters = () => {
    setMaxPrice(6000);
    setMinRating(0);
    setInStockOnly(false);
    setSortOrder("featured");
    setSearchParams({});
  };

  // Perform search + filtering
  let displayProducts = db.getProducts().filter(p => p.category === slug);

  // Filter: Price
  displayProducts = displayProducts.filter(p => p.price <= maxPrice);

  // Filter: Rating
  if (minRating > 0) {
    displayProducts = displayProducts.filter(p => p.rating >= minRating);
  }

  // Filter: Availability
  if (inStockOnly) {
    displayProducts = displayProducts.filter(p => p.inStock);
  }

  // Sorting
  if (sortOrder === "price-asc") {
    displayProducts.sort((a, b) => a.price - b.price);
  } else if (sortOrder === "price-desc") {
    displayProducts.sort((a, b) => b.price - a.price);
  } else if (sortOrder === "newest") {
    displayProducts.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
  } else if (sortOrder === "rating") {
    displayProducts.sort((a, b) => b.rating - a.rating);
  } else if (sortOrder === "bestsellers") {
    displayProducts.sort((a, b) => (b.isBestseller ? 1 : 0) - (a.isBestseller ? 1 : 0));
  }

  const handleSortChange = (e) => {
    const val = e.target.value;
    setSortOrder(val);
    setSearchParams({ sort: val });
  };

  const activeChips = [];
  if (maxPrice < 6000) activeChips.push({ label: `Under ₹${maxPrice}`, remove: () => setMaxPrice(6000) });
  if (minRating > 0) activeChips.push({ label: `Rating: ${minRating}★ +`, remove: () => setMinRating(0) });
  if (inStockOnly) activeChips.push({ label: "In Stock Only", remove: () => setInStockOnly(false) });

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 py-10 font-accent flex flex-col text-left">
      {/* Breadcrumb */}
      <div className="text-xs text-brand-text-muted mb-6">
        <Link to="/" className="hover:text-brand-primary">Home</Link>
        <span className="mx-2">&gt;</span>
        <Link to="/categories" className="hover:text-brand-primary">Categories</Link>
        <span className="mx-2">&gt;</span>
        <span className="text-brand-primary font-semibold">{currentCategory.name}</span>
      </div>

      {/* Category Hero Banner */}
      <div className="relative h-64 md:h-80 rounded-3xl overflow-hidden border border-brand-border shadow-md mb-12">
        <img src={currentCategory.image} alt={currentCategory.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-transparent" />
        <div className="absolute bottom-8 left-8 right-8 text-white max-w-2xl">
          <h1 className="font-serif text-3xl md:text-4xl font-extrabold mb-2.5">{currentCategory.name}</h1>
          <p className="text-xs md:text-sm text-gray-200 leading-relaxed font-medium">
            {currentCategory.description}
          </p>
        </div>
      </div>

      {/* Main Grid Wrapper */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Filters (Desktop) */}
        <div className="hidden lg:flex flex-col gap-8">
          <div className="flex items-center justify-between border-b border-brand-border pb-3">
            <span className="font-serif font-bold text-sm text-brand-text flex items-center gap-1.5">
              <SlidersHorizontal size={16} /> Filters
            </span>
            {activeChips.length > 0 && (
              <button 
                onClick={handleClearFilters}
                className="text-[10px] text-brand-accent hover:underline flex items-center gap-0.5"
              >
                <RefreshCcw size={10} /> Clear All
              </button>
            )}
          </div>

          {/* Price Range Filter */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-xs text-brand-primary uppercase tracking-wider">Max Price</h4>
              <span className="font-mono text-xs font-bold text-brand-primary">₹{maxPrice}</span>
            </div>
            <input
              type="range"
              min="500"
              max="6000"
              step="100"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-brand-primary bg-brand-border rounded-lg appearance-none h-1.5"
            />
          </div>

          {/* Star Rating Filter */}
          <div className="flex flex-col gap-3">
            <h4 className="font-semibold text-xs text-brand-primary uppercase tracking-wider">Ratings</h4>
            <div className="flex flex-col gap-2.5">
              {[0, 4.5, 4.8].map((rating) => (
                <button
                  key={rating}
                  onClick={() => setMinRating(rating)}
                  className={`flex items-center gap-2 text-left text-xs font-semibold px-3 py-2 rounded-lg transition-colors ${
                    minRating === rating ? "bg-brand-primary text-white" : "hover:bg-brand-secondary hover:dark:bg-[#25211E] text-brand-text"
                  }`}
                >
                  <Star size={12} fill={rating > 0 ? "currentColor" : "none"} className={minRating === rating ? "text-white" : "text-amber-500"} />
                  {rating === 0 ? "All Ratings" : `${rating}★ & above`}
                </button>
              ))}
            </div>
          </div>

          {/* Availability Toggle */}
          <div className="flex items-center justify-between border-t border-brand-border pt-4">
            <span className="text-xs font-semibold text-brand-text">In Stock Only</span>
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => setInStockOnly(e.target.checked)}
              className="w-4 h-4 accent-brand-primary border-brand-border rounded"
            />
          </div>

          {/* Quick Category Switcher */}
          <div className="flex flex-col gap-3 pt-6 border-t border-brand-border">
            <h4 className="font-semibold text-xs text-brand-primary uppercase tracking-wider">Other Categories</h4>
            <div className="flex flex-col gap-2">
              {categories.filter(c => c.slug !== slug).map((cat) => (
                <Link
                  key={cat.id}
                  to={`/categories/${cat.slug}`}
                  className="text-xs font-semibold text-brand-text hover:text-brand-primary p-2 hover:bg-brand-secondary hover:dark:bg-[#25211E] rounded-lg transition-colors"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Products Panel */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          {/* Top Sort & Filter Trigger for Mobile */}
          <div className="flex items-center justify-between bg-brand-secondary dark:bg-[#221E1C] border border-brand-border p-4 rounded-2xl">
            <button
              onClick={() => setShowMobileFilters(true)}
              className="lg:hidden flex items-center gap-1.5 text-xs font-semibold border border-brand-border bg-brand-card rounded-xl px-4 py-2 hover:bg-brand-secondary text-brand-text shadow-sm"
            >
              <Filter size={14} /> Filter
            </button>

            <span className="hidden sm:inline text-xs text-brand-text-muted">
              We found <span className="font-bold text-brand-primary">{displayProducts.length}</span> items in this category
            </span>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-brand-text-muted font-medium">Sort:</span>
              <select
                value={sortOrder}
                onChange={handleSortChange}
                className="bg-brand-card text-brand-text border border-brand-border rounded-xl px-3 py-2 outline-none font-semibold focus:border-brand-primary"
              >
                <option value="featured">Featured items</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="newest">New arrivals</option>
                <option value="rating">Top Rated</option>
                <option value="bestsellers">Bestsellers</option>
              </select>
            </div>
          </div>

          {/* Active Chips Area */}
          {activeChips.length > 0 && (
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-[10px] uppercase font-bold text-brand-text-muted tracking-wider">Active:</span>
              {activeChips.map((chip, i) => (
                <span 
                  key={i} 
                  className="bg-brand-primary/10 border border-brand-primary/30 text-brand-primary text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5"
                >
                  {chip.label}
                  <button onClick={chip.remove} className="hover:opacity-70 font-sans font-bold text-xs p-0.5">×</button>
                </span>
              ))}
            </div>
          )}

          {/* Products Grid */}
          {displayProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-20 bg-brand-card border border-brand-border rounded-3xl p-6">
              <h3 className="font-serif font-bold text-lg text-brand-text mb-1">No products found</h3>
              <p className="text-xs text-brand-text-muted max-w-sm mb-6">
                Try widening your price filters, sorting choices, or check availability toggles.
              </p>
              <button
                onClick={handleClearFilters}
                className="bg-brand-primary text-white font-semibold text-xs px-6 py-3 rounded-xl hover:bg-brand-accent shadow-md"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {displayProducts.slice(0, visibleCount).map((prod) => (
                <ProductCard key={prod.id} product={prod} />
              ))}
            </div>
          )}

          {/* Load More */}
          {displayProducts.length > visibleCount && (
            <div className="flex justify-center mt-8">
              <button
                disabled={isLoading}
                onClick={() => {
                  setIsLoading(true);
                  setTimeout(() => {
                    setVisibleCount(p => p + 4);
                    setIsLoading(false);
                  }, 400);
                }}
                className="bg-brand-secondary dark:bg-[#221E1C] hover:bg-brand-border dark:hover:bg-[#2D2723] text-brand-text border border-brand-border font-semibold text-xs px-8 py-3.5 rounded-xl transition-all shadow-sm disabled:opacity-50"
              >
                {isLoading ? "Loading..." : "Load More Items"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Drawer Navigation Filter Overlay */}
      <AnimatePresence>
        {showMobileFilters && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMobileFilters(false)}
              className="fixed inset-0 bg-black z-50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed bottom-0 left-0 right-0 max-h-[80vh] bg-brand-bg rounded-t-3xl border-t border-brand-border z-50 shadow-2xl overflow-y-auto p-6 font-accent flex flex-col gap-6"
            >
              <div className="flex items-center justify-between border-b border-brand-border pb-3">
                <h3 className="font-serif font-bold text-base text-brand-text flex items-center gap-1.5">
                  <Filter size={16} /> Filters
                </h3>
                <button onClick={() => setShowMobileFilters(false)} className="text-xs font-bold text-brand-primary">
                  Done
                </button>
              </div>

              {/* Price Limits */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-xs text-brand-primary uppercase tracking-wider">Price Limits</h4>
                  <span className="font-mono text-xs font-bold text-brand-primary">₹{maxPrice}</span>
                </div>
                <input
                  type="range"
                  min="500"
                  max="6000"
                  step="100"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full accent-brand-primary bg-brand-border rounded-lg appearance-none h-1.5"
                />
              </div>

              {/* Stars rating */}
              <div>
                <h4 className="font-semibold text-xs text-brand-primary uppercase tracking-wider mb-2.5">Rating</h4>
                <div className="flex gap-3">
                  {[0, 4.5, 4.8].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => setMinRating(rating)}
                      className={`flex items-center gap-1.5 text-xs px-3.5 py-2 rounded-full border transition-colors ${
                        minRating === rating ? "bg-brand-primary border-brand-primary text-white font-bold" : "bg-brand-card border-brand-border text-brand-text"
                      }`}
                    >
                      <Star size={10} fill={rating > 0 ? "currentColor" : "none"} className={minRating === rating ? "text-white" : "text-amber-500"} />
                      {rating === 0 ? "All Ratings" : `${rating}★ +`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Stock toggle */}
              <div className="flex items-center justify-between border-t border-brand-border pt-4">
                <span className="text-xs font-semibold text-brand-text">Show In Stock Only</span>
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  className="w-5 h-5 accent-brand-primary border-brand-border rounded"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4">
                <button
                  onClick={() => { handleClearFilters(); setShowMobileFilters(false); }}
                  className="border border-brand-border bg-brand-card py-3 rounded-xl text-xs font-semibold text-brand-text"
                >
                  Clear All
                </button>
                <button
                  onClick={() => setShowMobileFilters(false)}
                  className="bg-brand-primary py-3 rounded-xl text-xs font-semibold text-white shadow-md"
                >
                  Apply Filters
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
