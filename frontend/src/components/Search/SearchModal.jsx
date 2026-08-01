import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { Search, X, TrendingUp, Clock, ArrowRight } from 'lucide-react';

export default function SearchModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);

  const trendingTags = ['Silk Sarees', 'Banarasi', 'Kanjivaram', 'Pattu Saree', 'Lehenga', 'Designer Kurti'];

  useEffect(() => {
    const saved = localStorage.getItem('mn_recent_searches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {
        setRecentSearches([]);
      }
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  // Debounced search trigger
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await api.get(`/products?search=${encodeURIComponent(query.trim())}&limit=6`);
        if (response && response.data && response.data.products) {
          setResults(response.data.products);
        }
      } catch (err) {
        console.error('Instant search error:', err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const saveSearchTerm = (term) => {
    const updated = [term, ...recentSearches.filter((s) => s !== term)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('mn_recent_searches', JSON.stringify(updated));
  };

  const handleProductClick = (product) => {
    saveSearchTerm(query.trim() || product.name);
    onClose();
    navigate(`/products/${product.slug || product.id}`);
  };

  const handleTagClick = (tag) => {
    setQuery(tag);
  };

  const highlightMatch = (text, target) => {
    if (!target.trim()) return text;
    const parts = text.split(new RegExp(`(${target})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === target.toLowerCase() ? (
        <mark key={i} className="bg-brand-primary/20 text-brand-primary font-bold px-0.5 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-16 md:pt-24 px-4 font-accent">
      <div className="bg-brand-card border border-brand-border w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-brand-border flex items-center gap-3">
          <Search size={20} className="text-brand-primary" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search silk sarees, handlooms, designer wear..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent border-none text-brand-text outline-none text-base font-medium placeholder:text-brand-text-muted"
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1 text-brand-text-muted hover:text-brand-text">
              <X size={16} />
            </button>
          )}
          <button onClick={onClose} className="px-3 py-1.5 bg-brand-secondary text-brand-text font-bold text-xs rounded-xl hover:bg-brand-border">
            Esc
          </button>
        </div>

        {/* Search Body */}
        <div className="p-6 flex flex-col gap-6 max-h-[70vh] overflow-y-auto">
          {/* Instant Search Results */}
          {query.trim() ? (
            <div className="flex flex-col gap-3">
              <span className="text-xs font-bold text-brand-text-muted uppercase tracking-wider">
                {loading ? 'Searching catalog...' : `Search Suggestions (${results.length})`}
              </span>

              {results.length === 0 && !loading ? (
                <div className="py-8 text-center text-xs text-brand-text-muted">
                  No products matching "{query}". Try another search term.
                </div>
              ) : (
                results.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => handleProductClick(product)}
                    className="flex items-center justify-between p-3 rounded-2xl bg-brand-secondary/40 hover:bg-brand-secondary/80 border border-brand-border/60 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={product.image || '/placeholder.png'}
                        alt={product.name}
                        className="w-12 h-12 object-cover rounded-xl border border-brand-border"
                      />
                      <div className="flex flex-col text-left">
                        <span className="text-xs font-bold text-brand-text group-hover:text-brand-primary transition-colors">
                          {highlightMatch(product.name, query)}
                        </span>
                        <span className="text-[11px] text-brand-text-muted font-mono">₹{product.offerPrice || product.price}</span>
                      </div>
                    </div>
                    <ArrowRight size={14} className="text-brand-text-muted group-hover:text-brand-primary group-hover:translate-x-1 transition-all" />
                  </div>
                ))
              )}
            </div>
          ) : (
            <>
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-bold text-brand-text-muted uppercase tracking-wider flex items-center gap-1.5">
                    <Clock size={12} /> Recent Searches
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((term, index) => (
                      <button
                        key={index}
                        onClick={() => handleTagClick(term)}
                        className="px-3 py-1.5 bg-brand-secondary border border-brand-border rounded-xl text-xs font-semibold text-brand-text hover:bg-brand-primary hover:text-white transition-all"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Trending Searches */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold text-brand-text-muted uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp size={12} className="text-brand-primary" /> Trending Searches
                </span>
                <div className="flex flex-wrap gap-2">
                  {trendingTags.map((tag, index) => (
                    <button
                      key={index}
                      onClick={() => handleTagClick(tag)}
                      className="px-3.5 py-2 bg-brand-secondary/60 border border-brand-border/80 rounded-xl text-xs font-semibold text-brand-text hover:border-brand-primary hover:text-brand-primary transition-all"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
