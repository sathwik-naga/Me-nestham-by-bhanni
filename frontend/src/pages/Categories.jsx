import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { db } from "../services/db";
import { getCategories } from "../services/supabase/categories";
import { getCategoryImageUrl, normalizeCategories } from "../utils/imageOptimizer";
import OptimizedImage from "../components/Common/OptimizedImage";
import CategorySkeleton from "../components/Skeletons/CategorySkeleton";
import { motion } from "framer-motion";
import SEO from "../components/SEO/SEO";
import { generateBreadcrumbSchema } from "../utils/seo";

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch fresh categories asynchronously
  useEffect(() => {
    let isMounted = true;

    async function loadFreshCategories() {
      try {
        const freshData = await getCategories();
        if (isMounted) {
          const normalized = Array.isArray(freshData) ? normalizeCategories(freshData) : [];
          setCategories(normalized);
          localStorage.setItem("mn_categories", JSON.stringify(normalized));
        }
      } catch (err) {
        console.warn("Could not revalidate categories in background:", err);
        if (isMounted) setCategories([]);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadFreshCategories();

    return () => {
      isMounted = false;
    };
  }, []);

  const breadcrumbsSchema = generateBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Categories", url: "/categories" }
  ]);

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 py-10 font-accent flex flex-col text-left">
      <SEO
        title="Product Categories"
        description="Explore product categories for artificial flower petals, garland raw materials, decoration items, and craft supplies at Me Nestham by Bhanni."
        keywords="Flower Categories, Garland Materials, Artificial Petals, Craft Supplies"
        jsonLd={breadcrumbsSchema}
      />
      {/* Breadcrumbs */}
      <div className="text-xs text-brand-text-muted mb-6">
        <Link to="/" className="hover:text-brand-primary">Home</Link>
        <span className="mx-2">&gt;</span>
        <span className="text-brand-primary font-semibold">Categories</span>
      </div>

      <div className="text-center mb-12">
        <h1 className="font-serif text-3xl md:text-4xl font-bold text-brand-text mb-3">Browse Categories</h1>
        <p className="text-xs md:text-sm text-brand-text-muted max-w-lg mx-auto leading-relaxed">
          Select a category to explore authentic heritage block prints, handcast brass metalworks, traditional paintings, and sterling ornamentals.
        </p>
      </div>

      {/* Progressive Category Grid */}
      {isLoading && categories.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[1, 2, 3, 4].map((n) => (
            <CategorySkeleton key={n} />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-20 bg-brand-card rounded-3xl border border-brand-border p-8 max-w-xl mx-auto">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-brand-secondary flex items-center justify-center text-brand-primary text-2xl">
            🌸
          </div>
          <h2 className="font-serif text-2xl font-bold text-brand-text mb-2">No Categories Available</h2>
          <p className="text-xs md:text-sm text-brand-text-muted leading-relaxed mb-6">
            Our catalog is currently being refreshed with fresh handcrafted collections. Please check back soon or browse our full store.
          </p>
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 bg-brand-primary hover:bg-brand-accent text-white font-accent font-semibold px-6 py-3 rounded-xl transition-all text-xs"
          >
            Explore Store
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {categories.map((cat, idx) => (
            <motion.div
              key={cat.slug}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(idx * 0.05, 0.3) }}
              className="group relative h-96 rounded-3xl overflow-hidden border border-brand-border shadow-md hover:shadow-xl transition-all duration-300"
            >
              <Link to={`/categories/${cat.slug}`} className="block w-full h-full">
                {/* Optimized progressive image with zero layout shift, skeleton shimmer, and stable key */}
                <OptimizedImage
                  key={cat.slug}
                  src={getCategoryImageUrl(cat.slug, cat.image, cat.name)}
                  fallbackSrc={cat.image_url || cat.image}
                  alt={cat.name}
                  priority={idx < 2}
                  width={700}
                  height={450}
                  aspectRatio="16 / 10"
                  containerClassName="w-full h-full"
                  className="group-hover:scale-105 transition-transform duration-700"
                />

                {/* Bottom Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent pointer-events-none" />
                
                <div className="absolute bottom-8 left-8 right-8 text-white flex flex-col items-start pointer-events-none">
                  <span className="bg-brand-primary text-white text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-3">
                    {cat.productCount} products
                  </span>
                  <h2 className="font-serif text-2xl font-bold mb-2 group-hover:text-brand-primary transition-colors">
                    {cat.name}
                  </h2>
                  <p className="text-xs text-gray-300 leading-relaxed font-medium mb-4 max-w-md">
                    {cat.description}
                  </p>
                  <span className="text-xs font-semibold text-brand-primary flex items-center gap-1 group-hover:translate-x-1.5 transition-transform">
                    Explore Collection &rarr;
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
