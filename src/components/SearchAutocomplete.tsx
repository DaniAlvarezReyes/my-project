'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface SearchResult {
  id: string;
  name: string;
  brand: string;
  price: number;
  images: string[];
  category: string;
}

export default function SearchAutocomplete() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const router = useRouter();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setLoading(true);
    try {
      // Sanitize search input - remove ilike wildcards
      const safe = q.replace(/%/g, '').replace(/_/g, '');
      const { data } = await supabase
        .from('products')
        .select('id, name, brand, price, images, category')
        .or(`name.ilike.%${safe}%,brand.ilike.%${safe}%,description.ilike.%${safe}%`)
        .limit(6);

      setResults(data || []);
      setIsOpen(true);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setSelectedIndex(-1);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 250);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIndex >= 0 && results[selectedIndex]) {
      goToProduct(results[selectedIndex].id);
    } else if (query.trim()) {
      router.push(`/productos?buscar=${encodeURIComponent(query.trim())}`);
      setIsOpen(false);
      setQuery('');
    }
  };

  const goToProduct = (id: string) => {
    router.push(`/productos/${id}`);
    setIsOpen(false);
    setQuery('');
    addToRecentSearches(query);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => prev < results.length - 1 ? prev + 1 : 0);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => prev > 0 ? prev - 1 : results.length - 1);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const addToRecentSearches = (term: string) => {
    if (!term.trim()) return;
    try {
      const stored = JSON.parse(localStorage.getItem('recentSearches') || '[]');
      const updated = [term, ...stored.filter((s: string) => s !== term)].slice(0, 5);
      localStorage.setItem('recentSearches', JSON.stringify(updated));
    } catch {}
  };

  return (
    <div ref={wrapperRef} className="relative">
      <form onSubmit={handleSubmit} className="relative">
        <input
          ref={inputRef}
          type="text"
          placeholder="Buscar zapatillas..."
          value={query}
          onChange={handleInputChange}
          onFocus={() => { if (results.length > 0) setIsOpen(true); }}
          onKeyDown={handleKeyDown}
          className="w-52 xl:w-64 pl-4 pr-10 py-2 text-sm border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
        />
        <button type="submit" className="absolute right-3 top-2.5 text-gray-400 hover:text-blue-600">
          {loading ? (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          )}
        </button>
      </form>

      {/* Dropdown results */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-fadeIn">
          {results.length > 0 ? (
            <>
              <div className="max-h-80 overflow-y-auto">
                {results.map((product, i) => (
                  <button
                    key={product.id}
                    onClick={() => goToProduct(product.id)}
                    onMouseEnter={() => setSelectedIndex(i)}
                    className={`flex items-center gap-3 w-full px-4 py-3 text-left transition-colors ${
                      i === selectedIndex ? 'bg-blue-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                      <img
                        src={product.images?.[0] || 'https://via.placeholder.com/48'}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                      <p className="text-xs text-gray-500">{product.brand} · {product.category}</p>
                    </div>
                    <span className="text-sm font-bold text-gray-900 flex-shrink-0">€{product.price?.toFixed(2)}</span>
                  </button>
                ))}
              </div>
              <button
                onClick={() => {
                  router.push(`/productos?buscar=${encodeURIComponent(query)}`);
                  setIsOpen(false);
                  setQuery('');
                }}
                className="w-full px-4 py-3 text-sm text-blue-600 font-medium hover:bg-blue-50 border-t text-center transition-colors"
              >
                Ver todos los resultados para "{query}"
              </button>
            </>
          ) : query.length >= 2 && !loading ? (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-gray-500">No se encontraron resultados</p>
              <button
                onClick={handleSubmit}
                className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Buscar "{query}" en todos los productos
              </button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
