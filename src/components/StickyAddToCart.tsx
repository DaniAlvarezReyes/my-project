'use client';
import React, { useState, useEffect } from 'react';

interface Props {
  product: any;
  onAddToCart: () => void;
  visible: boolean;
}

export default function StickyAddToCart({ product, onAddToCart, visible }: Props) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(visible);
  }, [visible]);

  if (!show) return null;

  const originalPrice = product?.originalPrice || product?.original_price;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-black/90 backdrop-blur-xl border-t border-neutral-200 dark:border-neutral-800 translate-y-0 animate-slideUp">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-10 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          {product?.images?.[0] && (
            <div className="w-12 h-12 bg-neutral-100 flex-shrink-0 hidden sm:block">
              <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-bold text-neutral-900 dark:text-white truncate">{product?.name}</p>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black">€{product?.price?.toFixed(2)}</span>
              {originalPrice && originalPrice > product.price && (
                <span className="text-xs text-neutral-400 line-through">€{originalPrice.toFixed(2)}</span>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={onAddToCart}
          className="flex-shrink-0 bg-black dark:bg-white text-white dark:text-black px-8 py-3 text-xs font-bold uppercase tracking-widest hover:opacity-80 transition-opacity"
        >
          Añadir al carrito
        </button>
      </div>
    </div>
  );
}
