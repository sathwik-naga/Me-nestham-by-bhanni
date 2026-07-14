import React from "react";
import { Link } from "react-router-dom";
import { db } from "../services/db";
import { motion } from "framer-motion";

export default function Categories() {
  const categories = db.getCategories();

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 py-10 font-accent flex flex-col text-left">
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

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {categories.map((cat, idx) => (
          <motion.div
            key={cat.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="group relative h-96 rounded-3xl overflow-hidden border border-brand-border shadow-md hover:shadow-xl transition-all duration-300"
          >
            <Link to={`/categories/${cat.slug}`}>
              <img
                src={cat.image}
                alt={cat.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              {/* Bottom Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent" />
              
              <div className="absolute bottom-8 left-8 right-8 text-white flex flex-col items-start">
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
    </div>
  );
}
