'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface RecentProduct {
  id: string;
  name: string;
  brand: string;
  price: number;
  image: string;
  viewedAt: number;
}

const STORAGE_KEY = 'recentlyViewed';
const MAX_ITEMS = 8;

// Call this from product detail pages
export function addToRecentlyViewed(product: { id: string; name: string; brand: string; price: number; images?: string[] }) {
  if (typeof window === 'undefined') return;
  // Only store products with valid UUID IDs
  const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(product.id);
  if (!isValidUUID) return;
  try {
    const stored: RecentProduct[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const filtered = stored.filter(p => p.id !== product.id);
    const updated = [
      {
        id: product.id,
        name: product.name,
        brand: product.brand,
        price: product.price,
        image: product.images?.[0] || '',
        viewedAt: Date.now(),
      },
      ...filtered,
    ].slice(0, MAX_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {}
}

export default function RecentlyViewed({ currentProductId }: { currentProductId?: string }) {
  const [products, setProducts] = useState<RecentProduct[]>([]);

  useEffect(() => {
    try {
      const stored: RecentProduct[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      // Filter out corrupted entries (non-UUID IDs from old static data)
      const isValidUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      const valid = stored.filter(p => p.id && p.name && isValidUUID(p.id));
      // Save cleaned version back
      if (valid.length !== stored.length) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(valid));
      }
      const filtered = currentProductId
        ? valid.filter(p => p.id !== currentProductId)
        : valid;
      setProducts(filtered.slice(0, 6));
    } catch {}
  }, [currentProductId]);

  if (products.length === 0) return null;

  return (
    <section className="py-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Vistos recientemente</h2>
        <button
          onClick={() => {
            localStorage.removeItem(STORAGE_KEY);
            setProducts([]);
          }}
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          Limpiar
        </button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {products.map((product) => (
          <Link
            key={product.id}
            href={`/productos/${product.id}`}
            className="flex-shrink-0 w-44 group"
          >
            <div className="aspect-square rounded-xl bg-gray-100 overflow-hidden mb-2">
              <img
                src={product.image || 'https://via.placeholder.com/176'}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <p className="text-xs text-gray-500">{product.brand}</p>
            <p className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors">
              {product.name}
            </p>
            <p className="text-sm font-bold text-gray-900">€{product.price?.toFixed(2)}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
