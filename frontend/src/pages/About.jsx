import React from "react";
import { Link } from "react-router-dom";
import { Heart, Compass, ShieldAlert, Award, Star } from "lucide-react";
import SEO from "../components/SEO/SEO";
import { generateBreadcrumbSchema } from "../utils/seo";

export default function About() {
  const breadcrumbsSchema = generateBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "About Us", url: "/about" }
  ]);

  const values = [
    {
      icon: <Heart className="text-brand-primary" size={24} />,
      title: "Fair wages &amp; Honor",
      desc: "Guaranteeing master artisans receive over 70% of proceeds, bypass middleman margins, and work in safe cooperative hubs."
    },
    {
      icon: <Compass className="text-brand-primary" size={24} />,
      title: "Preserving Legacy Arts",
      desc: "Sustaining century-old printing techniques (like Dabu mud-resist resist prints) and cast metals that reflect India's cultural soil."
    },
    {
      icon: <Award className="text-brand-primary" size={24} />,
      title: "Authentic Materials",
      desc: "Utilizing 100% organic clay, certified 92.5 sterling silver, pure cotton textiles, and natural extract organic dyes."
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 py-10 font-accent flex flex-col text-left">
      <SEO
        title="About Us &amp; Our Story"
        description="Learn about Me Nestham by Bhanni, our mission to preserve authentic Indian handcrafted traditions, and direct artisan support."
        keywords="About Me Nestham, Indian Craftsmanship, Artisan Heritage, Bhanni Handcrafted"
        jsonLd={breadcrumbsSchema}
      />
      {/* Breadcrumbs */}
      <div className="text-xs text-brand-text-muted mb-8">
        <Link to="/" className="hover:text-brand-primary">Home</Link>
        <span className="mx-2">&gt;</span>
        <span className="text-brand-primary font-semibold">About Us</span>
      </div>

      {/* Hero Header */}
      <div className="text-center max-w-2xl mx-auto mb-16">
        <span className="text-xs font-bold uppercase tracking-widest text-brand-primary block mb-3">Who We Are</span>
        <h1 className="font-serif text-3xl md:text-5xl font-extrabold text-brand-text mb-4 leading-tight">Sustaining Handcrafted Indian Heritage</h1>
        <p className="text-xs md:text-sm text-brand-text-muted leading-relaxed">
          At Me Nestham By Bhanni, we connect rural Indian master artisans directly with connoisseurs of craft worldwide.
        </p>
      </div>

      {/* Our Story section */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
        <div>
          <img
            src="https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80"
            alt="Handcraft details and textile printing details"
            className="w-full aspect-[4/3] rounded-3xl object-cover border border-brand-border shadow-md"
          />
        </div>

        <div className="flex flex-col items-start gap-4">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-primary">Artisan Partnerships</span>
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-brand-text leading-tight mb-2">Our Journey</h2>
          <p className="text-xs md:text-sm text-brand-text-muted leading-relaxed">
            Me Nestham By Bhanni was conceived in 2025 out of a simple need: to bridge the gap between traditional Indian craftsmanship and global consumers. Walking through the weaving clusters of Andhra Pradesh and block-printing hubs of Rajasthan, our founders witnessed the rapid decline of legacy craft forms as artisans abandoned their trades due to exploitation by middlemen.
          </p>
          <p className="text-xs md:text-sm text-brand-text-muted leading-relaxed">
            We decided to build a platform that serves as a 'Nestham' (companion) to both our artisans and our customers. By eliminating intermediate layers, we enable weavers and makers to set their own prices, keeping local arts financially viable and culturally vibrant.
          </p>
        </div>
      </section>

      {/* Values grid */}
      <section className="bg-brand-secondary border border-brand-border rounded-3xl p-8 md:p-12 mb-20">
        <h2 className="font-serif text-2xl md:text-3xl font-bold text-brand-text text-center mb-10">Our Core Principles</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {values.map((v, i) => (
            <div key={i} className="flex flex-col items-start bg-brand-card border border-brand-card-border p-6 rounded-2xl shadow-sm text-left">
              <div className="p-3 bg-brand-secondary rounded-xl mb-4 border border-brand-border/60">
                {v.icon}
              </div>
              <h3 className="font-serif font-bold text-base text-brand-text mb-2">{v.title}</h3>
              <p className="text-xs text-brand-text-muted leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Sourcing details process */}
      <section className="mb-20">
        <h2 className="font-serif text-2xl md:text-3xl font-bold text-brand-text text-center mb-12">The Crafting Process</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {[
            { step: "01", title: "Cooperative Sourcing", desc: "We partner with verified rural master craft clusters and self-help groups." },
            { step: "02", title: "Quality Check", desc: "Every batch is inspected for metal purity, dye fastness, and thread counts." },
            { step: "03", title: "Artisan Bio Tagging", desc: "Each item receives a custom printed label tracing its origin hub and maker." },
            { step: "04", title: "Premium Boxing", desc: "Items are securely boxed in environment-friendly recycled paper packaging." }
          ].map((item, i) => (
            <div key={i} className="flex flex-col text-left border-l-2 border-brand-primary pl-6">
              <span className="font-mono text-xl font-extrabold text-brand-primary mb-2">{item.step}</span>
              <h4 className="font-serif font-bold text-sm text-brand-text mb-2">{item.title}</h4>
              <p className="text-xs text-brand-text-muted leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA section */}
      <section className="bg-brand-primary text-white p-8 md:p-12 rounded-3xl text-center shadow-lg flex flex-col items-center gap-4">
        <h2 className="font-serif text-2xl md:text-3xl font-bold">Discover Handcrafted Heritage</h2>
        <p className="text-xs md:text-sm text-white/90 max-w-md leading-relaxed">
          Support local weaver families and enhance your home or wardrobe with premium signature items.
        </p>
        <Link
          to="/shop"
          className="bg-brand-secondary text-brand-text font-semibold px-8 py-4 rounded-xl shadow-md hover:scale-105 transition-all text-xs inline-block mt-2 active:scale-95"
        >
          Browse All Products
        </Link>
      </section>
    </div>
  );
}
