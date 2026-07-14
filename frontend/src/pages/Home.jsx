import React from "react";
import { Link } from "react-router-dom";
import { db } from "../services/db";
import ProductCard from "../components/ProductCard";
import TrustBadges from "../components/TrustBadges";
import { ArrowRight, Sparkles, Star, Award, Heart } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  const categories = db.getCategories();
  const products = db.getProducts();

  // Filter lists
  const newArrivals = products.filter(p => p.isNew).slice(0, 4);
  const bestsellers = products.filter(p => p.isBestseller).slice(0, 4);

  const testimonials = [
    {
      quote: "The sterling silver jhumkas are a work of art. I can feel the weight of authentic craftsmanship, and the customer support via WhatsApp was incredibly fast and polite.",
      author: "Aishwarya R., Chennai",
      rating: 5
    },
    {
      quote: "We ordered the Terracotta Diya set for our housewarming. The packaging was meticulous, not a single scratch. They burnt beautifully for over 4 hours.",
      author: "Rajesh K., Bangalore",
      rating: 5
    },
    {
      quote: "As an art lover, having a hand-painted Madhubani Tree of Life signed by a master artisan is a dream. Me Nestham is keeping our heritage alive.",
      author: "Sunita D., Mumbai",
      rating: 5
    }
  ];

  return (
    <div className="flex flex-col w-full overflow-hidden">
      {/* Hero Banner Section */}
      <section className="relative min-h-[85vh] flex items-center bg-[#FAF7F2] dark:bg-[#1C1816] px-6 md:px-12 lg:px-24 py-16 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute right-0 top-0 w-1/2 h-full bg-gradient-to-l from-brand-primary/10 to-transparent pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 rounded-full bg-brand-accent/5 blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="flex flex-col items-start text-left"
          >
            <div className="flex items-center gap-2 bg-brand-primary/10 text-brand-primary font-accent text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full mb-6">
              <Sparkles size={14} /> Traditional Handcrafted Luxury
            </div>
            
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight text-brand-text mb-6">
              Heritage Creations <br />
              <span className="text-brand-primary">Crafted with Pride</span>
            </h1>

            <p className="text-sm md:text-base text-brand-text-muted mb-8 leading-relaxed max-w-xl">
              Bringing centuries of traditional Indian craftsmanship directly to your modern home. Shop premium handcrafted jewelry, organic clay pottery, traditional paintings, and heritage block-printed sarees.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link
                to="/shop"
                className="bg-brand-primary hover:bg-brand-accent text-white font-accent font-semibold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2 group active:scale-95 text-sm"
              >
                Shop the Collection
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/about"
                className="border border-brand-border bg-white/50 dark:bg-[#25211E]/50 hover:bg-brand-secondary hover:dark:bg-[#25211E] text-brand-text font-accent font-semibold px-8 py-4 rounded-xl transition-colors text-sm"
              >
                Our Heritage Story
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative flex justify-center lg:justify-end"
          >
            <div className="relative w-full max-w-md aspect-square rounded-3xl overflow-hidden shadow-2xl border-4 border-white dark:border-[#221E1C]">
              <img
                src="https://images.unsplash.com/photo-1605886300898-1e42f9e4bd33?auto=format&fit=crop&w=800&q=80"
                alt="Intricate Handcrafted Terracotta Diya Artistry"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 text-white font-accent">
                <p className="text-xs uppercase tracking-widest font-bold text-brand-primary mb-1">Featured Craft</p>
                <h3 className="font-serif text-lg font-bold">Organic Terracotta Clay Molding</h3>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Marquee Promotion Ticker */}
      <div className="bg-brand-accent text-white py-3.5 font-accent text-xs font-semibold uppercase tracking-widest overflow-hidden whitespace-nowrap border-y border-brand-border relative">
        <div className="animate-pulse-soft inline-flex w-full justify-around min-w-full text-center">
          <span>✨ 100% Authentic Handcrafted Materials</span>
          <span className="hidden md:inline">|</span>
          <span>🚚 Free Express Shipping Above ₹499</span>
          <span className="hidden md:inline">|</span>
          <span>🤝 Supporting 150+ Artisan Cooperatives Nationwide</span>
        </div>
      </div>

      {/* Featured Categories Grid */}
      <section className="py-20 px-6 md:px-12 lg:px-24 bg-brand-bg">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-brand-text mb-3">Browse by Category</h2>
            <p className="text-xs md:text-sm text-brand-text-muted font-accent max-w-lg mx-auto leading-relaxed">
              Explore our curated collections of legacy arts, hand-spun apparel, fine brass castings, and artisan-crafted ornaments.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((cat, idx) => (
              <motion.div 
                key={cat.id}
                whileHover={{ y: -6 }}
                className="group relative h-80 rounded-2xl overflow-hidden border border-brand-border shadow-sm"
              >
                <Link to={`/categories/${cat.slug}`}>
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6 text-white text-left font-accent">
                    <h3 className="font-serif text-lg font-bold group-hover:text-brand-primary transition-colors">
                      {cat.name}
                    </h3>
                    <p className="text-[10px] text-gray-300 font-medium tracking-wide mt-1">
                      {cat.productCount} Premium Items
                    </p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* New Arrivals Product Grid */}
      <section className="py-20 px-6 md:px-12 lg:px-24 bg-brand-secondary dark:bg-[#1E1A17] border-t border-brand-border">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-12 gap-4">
            <div>
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-brand-text mb-3">New Arrivals</h2>
              <p className="text-xs md:text-sm text-brand-text-muted font-accent max-w-md leading-relaxed">
                Freshly cataloged creations directly from the artisan workshops of Jaipur, Telangana, and Mithila.
              </p>
            </div>
            <Link
              to="/shop?sort=newest"
              className="bg-brand-primary text-white font-accent font-semibold px-5 py-2.5 rounded-xl hover:bg-brand-accent transition-colors flex items-center gap-1.5 text-xs shadow-md"
            >
              See New Items &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {newArrivals.map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        </div>
      </section>

      {/* Brand Story Section */}
      <section className="py-20 px-6 md:px-12 lg:px-24 bg-brand-bg relative overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="relative group">
            <div className="absolute -inset-1.5 bg-gradient-to-r from-brand-primary to-brand-accent rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-1000" />
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-brand-border">
              <img
                src="https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80"
                alt="Master weaver detailing block print designs"
                className="w-full aspect-[4/3] object-cover"
              />
            </div>
          </div>

          <div className="text-left flex flex-col items-start font-accent">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-primary mb-3">Our Core Philosophy</span>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-brand-text mb-6">
              Sustaining Legacies, Empowering Craftsmen
            </h2>
            <p className="text-xs md:text-sm text-brand-text-muted leading-relaxed mb-4">
              Behind every product in the Me Nestham collection lies an artisan's dedication. We work closely with rural communities across Andhra Pradesh, Telangana, and Rajasthan, guaranteeing that every weaver, painter, and mold-maker receives fair, life-supporting wages.
            </p>
            <p className="text-xs md:text-sm text-brand-text-muted leading-relaxed mb-8">
              By removing intermediaries, we ensure that 70% of every sale goes directly into funding healthcare, clean energy, and education in the artisan villages, keeping legacy Indian heritage arts alive for generations.
            </p>
            <Link
              to="/about"
              className="bg-brand-primary hover:bg-brand-accent text-white font-semibold px-6 py-3 rounded-xl shadow-md transition-all active:scale-95 text-xs flex items-center gap-1.5"
            >
              Meet The Founders &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* Bestsellers Carousel / Scroll */}
      <section className="py-20 px-6 md:px-12 lg:px-24 bg-brand-secondary dark:bg-[#1E1A17] border-y border-brand-border">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-12 gap-4">
            <div>
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-brand-text mb-3">Bestseller Items</h2>
              <p className="text-xs md:text-sm text-brand-text-muted font-accent max-w-md leading-relaxed">
                Our most sought-after signature pieces, loved by clients worldwide for their elegance and premium finish.
              </p>
            </div>
            <Link
              to="/shop?sort=bestsellers"
              className="border border-brand-border bg-brand-card hover:bg-brand-secondary hover:dark:bg-[#25211E] text-brand-text font-accent font-semibold px-5 py-2.5 rounded-xl transition-colors flex items-center gap-1.5 text-xs shadow-sm"
            >
              View Bestsellers &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {bestsellers.map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Carousel Section */}
      <section className="py-20 px-6 md:px-12 lg:px-24 bg-brand-bg">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center text-brand-primary mb-6">
            <Award size={36} className="animate-bounce" />
          </div>
          <h2 className="font-serif text-3xl font-bold text-brand-text mb-12">Client Testimonials</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t, idx) => (
              <div 
                key={idx} 
                className="bg-brand-card border border-brand-card-border p-6 rounded-2xl shadow-sm text-left flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center text-amber-500 gap-0.5 mb-4">
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} size={14} fill="currentColor" />
                    ))}
                  </div>
                  <p className="text-xs text-brand-text italic leading-relaxed mb-6 font-medium">
                    "{t.quote}"
                  </p>
                </div>
                <h4 className="font-accent text-xs font-bold text-brand-primary tracking-wide">
                  {t.author}
                </h4>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Promise Badges */}
      <TrustBadges />
    </div>
  );
}
