import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { getProducts } from "../services/supabase/products";
import { getCategories } from "../services/supabase/categories";
import ProductCard from "../components/ProductCard";
import { Search, SlidersHorizontal, RefreshCcw, Filter, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import SEO from "../components/SEO/SEO";
import { generateBreadcrumbSchema } from "../utils/seo";
import { trackSearch } from "../services/analytics/analytics";

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get("q") || "";
  const categoryParam = searchParams.get("category") || "";
  const sortParam = searchParams.get("sort") || "featured";

  const [searchVal, setSearchVal] = useState(queryParam);
  const [selectedCategory, setSelectedCategory] = useState(categoryParam);
  const [maxPrice, setMaxPrice] = useState(6000);
  const [minRating, setMinRating] = useState(0);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortOrder, setSortOrder] = useState(sortParam);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [visibleCount, setVisibleCount] = useState(8);
 
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  // Reset page parameters when URL search query changes
  useEffect(() => {
    setSearchVal(queryParam);
    if (queryParam.trim()) {
      trackSearch(queryParam.trim(), displayProducts.length);
    }
  }, [queryParam]);

  useEffect(() => {
    setSelectedCategory(categoryParam);
  }, [categoryParam]);

useEffect(() => {
  async function loadData() {
    try {
      const productData = await getProducts();
      const categoryData = await getCategories();

      setProducts(productData || []);
      setCategories(categoryData || []);
    } catch (err) {
      console.error("API Error:", err);
    }
  }

  loadData();
}, []);

  // Handle local parameter triggers
  const triggerSearch = (e) => {
    if (e) e.preventDefault();
    const params = {};
    if (searchVal.trim()) params.q = searchVal.trim();
    if (selectedCategory) params.category = selectedCategory;
    params.sort = sortOrder;
    setSearchParams(params);
  };

  const handleClearFilters = () => {
    setSearchVal("");
    setSelectedCategory("");
    setMaxPrice(6000);
    setMinRating(0);
    setInStockOnly(false);
    setSortOrder("featured");
    setSearchParams({});
  };

  // Perform search + filtering
  let displayProducts = [...products];

  // If a keyword query is present, run smart semantic search simulation
  if (queryParam) {
    displayProducts = displayProducts.filter((product) =>
  product.name.toLowerCase().includes(queryParam.toLowerCase())
);
  }

  // Filter: Category
  if (selectedCategory) {
    displayProducts = displayProducts.filter(
  (p) => p.categories?.slug === selectedCategory
);
  }

  // Filter: Price
  displayProducts = displayProducts.filter(p => p.price <= maxPrice);

  // Filter: Rating
  if (minRating > 0) {
    displayProducts = displayProducts.filter(p => p.rating >= minRating);
  }

  // Filter: Availability
  if (inStockOnly) {
    displayProducts = displayProducts.filter(p => p.stock > 0);
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
    const params = {};
    if (queryParam) params.q = queryParam;
    if (selectedCategory) params.category = selectedCategory;
    params.sort = val;
    setSearchParams(params);
  };

  const loadMore = () => {
    setIsLoading(true);
    setTimeout(() => {
      setVisibleCount(prev => prev + 4);
      setIsLoading(false);
    }, 400);
  };

  const activeChips = [];
  if (queryParam) activeChips.push({ label: `Search: "${queryParam}"`, remove: () => { setSearchVal(""); setSearchParams(selectedCategory ? { category: selectedCategory } : {}); } });
  if (selectedCategory) activeChips.push({ label: `Category: ${selectedCategory.replace("-", " ")}`, remove: () => { setSelectedCategory(""); setSearchParams(queryParam ? { q: queryParam } : {}); } });
  if (maxPrice < 6000) activeChips.push({ label: `Under ₹${maxPrice}`, remove: () => setMaxPrice(6000) });
  if (minRating > 0) activeChips.push({ label: `Rating: ${minRating}★ +`, remove: () => setMinRating(0) });
  if (inStockOnly) activeChips.push({ label: "In Stock Only", remove: () => setInStockOnly(false) });

  const breadcrumbsSchema = generateBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Shop", url: "/shop" }
  ]);

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 py-10 font-accent flex flex-col text-left">
      <SEO
        title={queryParam ? `Search Results for "${queryParam}"` : "Shop All Garland Materials & Craft Supplies"}
        description="Browse our complete catalog of garland making raw materials, artificial flower petals, and craft decoration supplies at Me Nestham by Bhanni."
        keywords="Garland Materials Shop, Artificial Flower Petals, Craft Decoration, Flower Supplies Online"
        noindex={Boolean(queryParam)}
        jsonLd={breadcrumbsSchema}
      />
      {/* Breadcrumb */}
      <div className="text-xs text-brand-text-muted mb-6">
        <Link to="/" className="hover:text-brand-primary">Home</Link>
        <span className="mx-2">&gt;</span>
        <span className="text-brand-primary font-semibold">Shop</span>
      </div>

      {/* Header & Smart search bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10 border-b border-brand-border pb-8">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-brand-text mb-2">Shop Our Collections</h1>
          <p className="text-xs md:text-sm text-brand-text-muted">
            {queryParam 
              ? `AI Semantic Search found ${displayProducts.length} items matching "${queryParam}"`
              : `Showing ${Math.min(displayProducts.length, visibleCount)} of ${displayProducts.length} unique handcrafted items.`
            }
          </p>
        </div>

        {/* Inline Search Bar */}
        <form onSubmit={triggerSearch} className="flex gap-2 max-w-md w-full">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-primary" size={16} />
            <input
              type="text"
              placeholder="Search jhumkas, paintings..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              className="w-full bg-brand-card text-brand-text border border-brand-border pl-10 pr-4 py-2.5 rounded-xl outline-none focus:border-brand-primary text-xs"
            />
          </div>
          <button 
            type="submit" 
            className="bg-brand-primary hover:bg-brand-accent text-white px-5 py-2.5 rounded-xl text-xs font-semibold shadow-sm active:scale-95 transition-all"
          >
            Search
          </button>
        </form>
      </div>

      {/* Main Grid Wrapper */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Filters (Desktop) */}
        <div className="hidden lg:flex flex-col gap-8">
          {/* Header */}
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

          {/* Categories Filter */}
          <div className="flex flex-col gap-3">
            <h4 className="font-semibold text-xs text-brand-primary uppercase tracking-wider">Categories</h4>
            <div className="flex flex-col gap-2.5">
              <button
                onClick={() => { setSelectedCategory(""); setSearchParams(queryParam ? { q: queryParam } : {}); }}
                className={`text-left text-xs font-semibold px-3 py-2 rounded-lg transition-colors ${
                  !selectedCategory ? "bg-brand-primary text-white" : "hover:bg-brand-secondary text-brand-text"
                }`}
              >
                All categories
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => { setSelectedCategory(cat.slug); setSearchParams({ category: cat.slug, ...(queryParam ? { q: queryParam } : {}) }); }}
                  className={`text-left text-xs font-semibold px-3 py-2 rounded-lg transition-colors ${
                    selectedCategory === cat.slug ? "bg-brand-primary text-white" : "hover:bg-brand-secondary text-brand-text"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
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
            <div className="flex justify-between text-[9px] text-brand-text-muted font-bold font-mono">
              <span>₹500</span>
              <span>₹3,000</span>
              <span>₹6,000+</span>
            </div>
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
                    minRating === rating ? "bg-brand-primary text-white" : "hover:bg-brand-secondary text-brand-text"
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
        </div>

        {/* Products Panel */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          {/* Top Sort & Filter Trigger for Mobile */}
          <div className="flex items-center justify-between bg-brand-secondary border border-brand-border p-4 rounded-2xl">
            <button
              onClick={() => setShowMobileFilters(true)}
              className="lg:hidden flex items-center gap-1.5 text-xs font-semibold border border-brand-border bg-brand-card rounded-xl px-4 py-2 hover:bg-brand-secondary text-brand-text shadow-sm"
            >
              <Filter size={14} /> Filter
            </button>

            <span className="hidden sm:inline text-xs text-brand-text-muted">
              We found <span className="font-bold text-brand-primary">{displayProducts.length}</span> matching products
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
              <div className="w-16 h-16 rounded-full bg-brand-secondary border border-brand-border flex items-center justify-center text-brand-primary mb-4">
                <SlidersHorizontal size={24} />
              </div>
              <h3 className="font-serif font-bold text-lg text-brand-text mb-1">No products found</h3>
              <p className="text-xs text-brand-text-muted max-w-sm mb-6 leading-relaxed">
                We couldn't find matches. Try adjusting your search query, widening the price range, or clearing filters.
              </p>
              <button
                onClick={handleClearFilters}
                className="bg-brand-primary text-white font-semibold text-xs px-6 py-3 rounded-xl hover:bg-brand-accent transition-all active:scale-95 shadow-md"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {displayProducts.slice(0, visibleCount).map((prod) => (
                <ProductCard key={prod.id} product={prod} />
              ))}
            </div>
          )}

          {/* Load More Trigger */}
          {displayProducts.length > visibleCount && (
            <div className="flex justify-center mt-8">
              <button
                disabled={isLoading}
                onClick={loadMore}
                className="bg-brand-secondary hover:bg-brand-border text-brand-text border border-brand-border font-semibold text-xs px-8 py-3.5 rounded-xl transition-all shadow-sm active:scale-95 disabled:opacity-50"
              >
                {isLoading ? "Loading..." : "Load More Items"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Bottom-sheet Filters Drawer */}
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
              className="fixed bottom-0 left-0 right-0 max-h-[85vh] bg-brand-modal rounded-t-3xl border-t border-brand-border z-50 shadow-2xl overflow-y-auto p-6 font-accent flex flex-col gap-6"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-brand-border pb-3">
                <h3 className="font-serif font-bold text-base text-brand-text flex items-center gap-1.5">
                  <Filter size={16} /> Filter Collections
                </h3>
                <button 
                  onClick={() => setShowMobileFilters(false)}
                  className="text-xs font-bold text-brand-primary hover:underline"
                >
                  Apply Filters
                </button>
              </div>

              {/* Category Filter */}
              <div>
                <h4 className="font-semibold text-xs text-brand-primary uppercase tracking-wider mb-2.5">Category</h4>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => { setSelectedCategory(""); setSearchParams(queryParam ? { q: queryParam } : {}); }}
                    className={`text-xs px-3.5 py-2 rounded-full border transition-colors ${
                      !selectedCategory ? "bg-brand-primary border-brand-primary text-white font-bold" : "bg-brand-card border-brand-border text-brand-text hover:bg-brand-secondary"
                    }`}
                  >
                    All items
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => { setSelectedCategory(cat.slug); setSearchParams({ category: cat.slug, ...(queryParam ? { q: queryParam } : {}) }); }}
                      className={`text-xs px-3.5 py-2 rounded-full border transition-colors ${
                        selectedCategory === cat.slug ? "bg-brand-primary border-brand-primary text-white font-bold" : "bg-brand-card border-brand-border text-brand-text hover:bg-brand-secondary"
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price range */}
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

              {/* Stock Toggle */}
              <div className="flex items-center justify-between border-t border-brand-border pt-4">
                <span className="text-xs font-semibold text-brand-text">Only Show In Stock Items</span>
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
                  Show Results ({displayProducts.length})
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
