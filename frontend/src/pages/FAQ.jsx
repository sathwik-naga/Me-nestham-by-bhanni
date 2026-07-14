import React, { useState } from "react";
import { Link } from "react-router-dom";
import { mockFAQs } from "../data/mockProducts";
import { HelpCircle, Search, MessageSquare, ChevronDown } from "lucide-react";

export default function FAQ() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const filteredFAQs = mockFAQs.filter((faq) => {
    const matchesSearch = 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === "all" || faq.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 font-accent text-left">
      {/* Breadcrumbs */}
      <div className="text-xs text-brand-text-muted mb-8">
        <Link to="/" className="hover:text-brand-primary">Home</Link>
        <span className="mx-2">&gt;</span>
        <span className="text-brand-primary font-semibold">FAQs</span>
      </div>

      <div className="text-center max-w-xl mx-auto mb-12">
        <HelpCircle className="text-brand-primary mx-auto mb-4" size={36} />
        <h1 className="font-serif text-3xl font-extrabold text-brand-text mb-3">Frequently Asked Questions</h1>
        <p className="text-xs text-brand-text-muted">
          Search questions and answers across general order placements, shipping updates, and artisan product sourcing.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-primary" size={16} />
          <input
            type="text"
            placeholder="Search help topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-brand-card text-brand-text border border-brand-border pl-10 pr-4 py-3 rounded-xl outline-none focus:border-brand-primary text-xs"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="bg-brand-card text-brand-text border border-brand-border rounded-xl px-4 py-3 outline-none text-xs font-semibold focus:border-brand-primary"
        >
          <option value="all">All Topics</option>
          <option value="orders">Orders &amp; Tracking</option>
          <option value="shipping">Shipping Delivery</option>
          <option value="returns">Returns &amp; Refund</option>
          <option value="payments">Online Payments</option>
          <option value="products">Artisan Products</option>
        </select>
      </div>

      {/* Accordion List */}
      <div className="flex flex-col gap-4 mb-16">
        {filteredFAQs.length === 0 ? (
          <div className="py-12 text-center text-brand-text-muted bg-brand-card border border-brand-border rounded-3xl">
            <p className="text-xs">No matching question topics found. Try using a different keyword or contact support.</p>
          </div>
        ) : (
          filteredFAQs.map((faq) => (
            <details 
              key={faq.id} 
              className="group bg-brand-card border border-brand-card-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex items-center justify-between p-5 cursor-pointer font-serif font-bold text-xs md:text-sm text-brand-text select-none">
                <span>{faq.question}</span>
                <ChevronDown size={16} className="text-brand-primary group-open:-rotate-180 transition-transform duration-300" />
              </summary>
              <div className="px-5 pb-5 pt-1 text-xs md:text-sm text-brand-text-muted leading-relaxed border-t border-brand-border/40">
                {faq.answer}
              </div>
            </details>
          ))
        )}
      </div>

      {/* WhatsApp human support ticket option */}
      <div className="bg-brand-secondary dark:bg-[#201D1B] border border-brand-border p-6 rounded-3xl text-center flex flex-col items-center gap-3">
        <h3 className="font-serif font-bold text-sm text-brand-text">Still have unanswered questions?</h3>
        <p className="text-xs text-brand-text-muted max-w-sm mb-2 leading-relaxed">
          If you can't find answers in our FAQs, you can connect directly with our support team on WhatsApp. We are online from 9 AM to 6 PM IST.
        </p>
        <a
          href="https://wa.me/919999999999?text=Hi, I have a question not covered in FAQs."
          target="_blank"
          rel="noreferrer"
          className="bg-brand-success text-white text-xs font-semibold px-6 py-3 rounded-xl hover:bg-[#3D694B] shadow flex items-center gap-1.5"
        >
          <MessageSquare size={14} /> Connect on WhatsApp
        </a>
      </div>
    </div>
  );
}
