'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ProductCard } from '@/components/ProductCard';

interface Props {
  currentProductId: string;
  category?: string;
  brand?: string;
}

export default function RelatedProducts({ currentProductId, category, brand }: Props) {
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        // Get products from same category or brand, excluding current
        let query = supabase.from('products').select('*').neq('id', currentProductId).limit(8);
        if (category) query = query.eq('category', category);
        const { data } = await query;
        
        let results = data || [];
        // If not enough from category, add by brand
        if (results.length < 4 && brand) {
          const { data: brandData } = await supabase
            .from('products').select('*').eq('brand', brand).neq('id', currentProductId).limit(4);
          const existingIds = new Set(results.map(p => p.id));
          results = [...results, ...(brandData || []).filter(p => !existingIds.has(p.id))].slice(0, 8);
        }
        setProducts(results.slice(0, 4));
      } catch {}
    };
    if (currentProductId) load();
  }, [currentProductId, category, brand]);

  if (products.length === 0) return null;

  return (
    <section className="py-12">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">También te puede gustar</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        {products.map(p => <ProductCard key={p.id} product={p} />)}
      </div>
    </section>
  );
}
