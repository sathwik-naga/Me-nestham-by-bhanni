import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { db } from "../services/db";
import ProductCard from "../components/ProductCard";
import TrustBadges from "../components/TrustBadges";
import { ArrowRight, Sparkles, Star, Award, Heart } from "lucide-react";
import { motion } from "framer-motion";
import { api } from "../services/api";
import heroGarlandBanner from "../assets/images/hero-garland-banner.png";
import SEO from "../components/SEO/SEO";
import { generateOrganizationSchema, generateWebsiteSchema } from "../utils/seo";

function FlashSaleSection() {
  const [flashSale, setFlashSale] = useState(null);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    let timer;
    async function loadFlashSale() {
      try {
        const res = await api.get("/promotions/flash-sales/active");
        if (res.data.status === "success" && res.data.data.flashSale) {
          const sale = res.data.data.flashSale;
          setFlashSale(sale);
          
          const serverTime = new Date(res.data.server_time).getTime();
          const clientTime = Date.now();
          const drift = serverTime - clientTime;

          const updateTimer = () => {
            const now = Date.now() + drift;
            const startsAt = new Date(sale.starts_at).getTime();
            const expiresAt = new Date(sale.expires_at).getTime();

            if (now >= startsAt && now < expiresAt) {
              setIsActive(true);
              const diff = expiresAt - now;
              
              const d = Math.floor(diff / (1000 * 60 * 60 * 24));
              const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
              const m = Math.floor((diff / (1000 * 60)) % 60);
              const s = Math.floor((diff / 1000) % 60);

              setTimeLeft({ days: d, hours: h, minutes: m, seconds: s });
            } else {
              setIsActive(false);
            }
          };

          updateTimer();
          timer = setInterval(updateTimer, 1000);
        }
      } catch (err) {
        console.error("Failed to load active flash sale", err);
      }
    }
    loadFlashSale();
    return () => clearInterval(timer);
  }, []);

  if (!flashSale || !isActive) return null;

  return (
    <section className="bg-gradient-to-r from-brand-accent via-brand-primary to-brand-accent text-white py-12 px-6 md:px-12 lg:px-24 flex flex-col md:flex-row items-center justify-between gap-8 border-y border-brand-border/30 relative overflow-hidden font-accent">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_40%)] pointer-events-none" />
      <div className="absolute -left-12 -top-12 w-48 h-48 rounded-full bg-white/5 blur-2xl pointer-events-none" />
      
      <div className="flex-1 text-left relative z-10">
        <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md text-white font-bold uppercase text-[10px] tracking-widest px-3 py-1 rounded-full mb-4 animate-pulse">
          ⚡ Flash Sale Live
        </div>
        <h2 className="font-serif text-3xl md:text-4xl font-extrabold tracking-tight mb-2">
          {flashSale.title}
        </h2>
        <p className="text-white/85 text-xs md:text-sm max-w-xl font-medium">
          {flashSale.description} — Unlock up to <span className="font-bold text-amber-300">{flashSale.discount_value}% OFF</span> on authentic hand-crafted products.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-8 relative z-10">
        <div className="flex gap-4">
          {Object.entries(timeLeft).map(([label, val]) => (
            <div key={label} className="flex flex-col items-center">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl flex items-center justify-center font-mono text-xl md:text-2xl font-bold shadow-lg shadow-black/10">
                {String(val).padStart(2, "0")}
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-white/70 mt-2">
                {label}
              </span>
            </div>
          ))}
        </div>

        <Link
          to="/shop"
          className="bg-white hover:bg-brand-secondary text-brand-primary font-bold px-8 py-4 rounded-xl shadow-lg transition-transform hover:scale-105 active:scale-95 text-xs uppercase tracking-wider font-accent"
        >
          Shop Sale Items
        </Link>
      </div>
    </section>
  );
}

export default function Home() {
  const categories = db.getCategories();
  const products = db.getProducts();
  const jsonLd = [generateOrganizationSchema(), generateWebsiteSchema()];

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
      <SEO
        title="Handcrafted Garland Raw Materials & Decoration Supplies"
        description="Explore premium artificial flower petals, garland raw materials, wedding decoration supplies, and traditional Indian craft materials online at Me Nestham by Bhanni."
        keywords="Me Nestham, Me Nestham by Bhanni, Garland Raw Materials, Artificial Flower Petals, Craft Supplies, Wedding Decoration"
        jsonLd={jsonLd}
      />
      {/* Hero Banner Section */}
      <section className="relative min-h-[85vh] flex items-center bg-brand-secondary px-6 md:px-12 lg:px-24 py-16 overflow-hidden">
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
              Your premium destination for garland raw materials, artificial flower petals, zari decorative balls, bells, beads, and festive wedding decoration supplies.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link
                to="/shop"
                className="bg-brand-primary hover:bg-brand-accent text-white font-accent font-semibold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2 group active:scale-95 text-sm"
              >
                Shop the Collection
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative flex justify-center lg:justify-end"
          >
            <div className="hero-banner-card relative w-full max-w-md aspect-square rounded-3xl overflow-hidden border-4 border-brand-bg">
              <img
                src={heroGarlandBanner}
                alt="Premium Garland Making Materials - Me Nestham By Bhanni"
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-400 ease-in-out hover:scale-[1.02]"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Flash Sale Banner (Dynamically checks/counts down if active) */}
      <FlashSaleSection />

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
              Explore our curated collections of foam flowers, artificial flowers, zari decorative balls, filigree bells, beads, and decoration supplies.
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
      <section className="py-20 px-6 md:px-12 lg:px-24 bg-brand-secondary border-t border-brand-border">
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


      {/* Bestsellers Carousel / Scroll */}
      <section className="py-20 px-6 md:px-12 lg:px-24 bg-brand-secondary border-y border-brand-border">
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
              className="border border-brand-border bg-brand-card hover:bg-brand-secondary text-brand-text font-accent font-semibold px-5 py-2.5 rounded-xl transition-colors flex items-center gap-1.5 text-xs shadow-sm"
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
