'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Product } from '@/types';
import { useFavorites } from '@/context/FavoritesContext';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';

export interface ProductCardProps {
  product: Product;
  currency?: string;
}

const COLOR_HEX: Record<string, string> = {
  negro: '#000', blanco: '#fff', azul: '#3b82f6', rojo: '#ef4444',
  verde: '#22c55e', amarillo: '#eab308', rosa: '#ec4899', gris: '#9ca3af',
  naranja: '#f97316', morado: '#a855f7', marrón: '#92400e', beige: '#d4c5a9',
  blue: '#3b82f6', black: '#000', white: '#fff', red: '#ef4444', green: '#22c55e',
  grey: '#9ca3af', gray: '#9ca3af', orange: '#f97316', pink: '#ec4899',
};

export const ProductCard: React.FC<ProductCardProps> = ({ product, currency = '€' }) => {
  const router = useRouter();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { addItem } = useCart();
  const toast = useToast();
  const isLiked = isFavorite(product.id);
  const [activeColor, setActiveColor] = useState<string | null>(null);

  const originalPrice = product.originalPrice || (product as any).original_price;
  const inStock = product.inStock ?? (product as any).in_stock ?? true;
  const discount = originalPrice ? Math.round(((originalPrice - product.price) / originalPrice) * 100) : 0;
  const images = product.images || [];
  const sizes = product.sizes || [];
  const colors = product.colors || [];

  // Supabase color_variants: each has { color_name, color_hex, images[] }
  const colorVariants: any[] = (product as any).color_variants || [];

  // Build a map: color name → first image for that color
  const colorImageMap: Record<string, string> = {};
  colorVariants.forEach((v: any) => {
    if (v.color_name && v.images?.[0]) {
      colorImageMap[v.color_name.toLowerCase()] = v.images[0];
    }
  });
  // Also map by index from the colors/images arrays as fallback
  colors.forEach((c: string, i: number) => {
    if (!colorImageMap[c.toLowerCase()] && images[i + 1]) {
      colorImageMap[c.toLowerCase()] = images[i + 1];
    }
  });

  // Which image to show
  const displayImage = activeColor && colorImageMap[activeColor.toLowerCase()]
    ? colorImageMap[activeColor.toLowerCase()]
    : images[0] || 'https://via.placeholder.com/600x800?text=No+Image';

  // Secondary image for swap (only when no color hovered)
  const secondaryImage = !activeColor && images.length >= 2 ? images[1] : null;

  const handleClick = () => router.push(`/productos/${product.id}`);

  return (
    <div className="group cursor-pointer" onClick={handleClick}>
      {/* Image container */}
      <div className={`relative aspect-[3/4] overflow-hidden bg-neutral-100 dark:bg-neutral-800 mb-3 ${secondaryImage ? 'product-image-swap' : ''}`}>
        <img
          src={displayImage}
          alt={product.name}
          className={`${secondaryImage ? 'img-primary' : ''} w-full h-full object-cover transition-opacity duration-300`}
          loading="lazy"
        />
        {secondaryImage && (
          <img src={secondaryImage} alt={product.name} className="img-secondary w-full h-full object-cover" loading="lazy" />
        )}

        {/* Badges */}
        {(product.badge || discount > 0) && (
          <div className="absolute top-3 left-3 flex gap-2 z-10">
            {product.badge && <span className="bg-black text-white px-3 py-1 text-[10px] font-bold uppercase tracking-widest">{product.badge}</span>}
            {discount > 0 && <span className="px-3 py-1 text-[10px] font-bold" style={{ backgroundColor: '#fff', color: '#000' }}>-{discount}%</span>}
          </div>
        )}

        {/* Favorite */}
        <button
          onClick={(e) => { e.stopPropagation(); toggleFavorite(product.id); }}
          className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center transition-all z-10 ${isLiked ? 'bg-black text-white' : 'bg-white/80 text-neutral-600 opacity-0 group-hover:opacity-100'}`}
        >
          <svg className="w-4 h-4" fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
        </button>

        {/* Sizes on hover */}
        {sizes.length > 0 && inStock && (
          <div className="absolute bottom-0 left-0 right-0 bg-white/95 dark:bg-black/95 backdrop-blur-sm translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out z-10 p-3">
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-neutral-400 mb-2">Tallas disponibles</p>
            <div className="flex flex-wrap gap-1">
              {sizes.map((s: string) => (
                <span key={s} className="px-2 py-1 text-[10px] font-bold border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300">{s}</span>
              ))}
            </div>
          </div>
        )}

        {!inStock && (
          <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
            <span className="bg-black text-white px-4 py-2 text-xs font-bold uppercase tracking-widest">Agotado</span>
          </div>
        )}
      </div>

      {/* Color dots */}
      {colors.length > 0 && (
        <div className="flex gap-1.5 mb-2">
          {colors.slice(0, 5).map((c: string) => (
            <button
              key={c}
              onMouseEnter={() => setActiveColor(c)}
              onMouseLeave={() => setActiveColor(null)}
              onClick={(e) => e.stopPropagation()}
              className={`w-3.5 h-3.5 rounded-full border-2 transition-all duration-200 ${
                activeColor === c
                  ? 'scale-125 border-black dark:border-white'
                  : 'scale-100 border-neutral-300 dark:border-neutral-600'
              }`}
              style={{ backgroundColor: COLOR_HEX[c.toLowerCase()] || '#9ca3af' }}
              title={c}
            />
          ))}
          {colors.length > 5 && <span className="text-[10px] text-neutral-400 self-center ml-0.5">+{colors.length - 5}</span>}
        </div>
      )}

      {/* Info */}
      <div className="space-y-1">
        <p className="text-[11px] text-neutral-400 uppercase tracking-widest font-medium">{product.brand}</p>
        <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 leading-snug line-clamp-2 group-hover:underline underline-offset-2">{product.name}</h3>
        <div className="flex items-center gap-2 pt-0.5">
          <span className="text-sm font-bold text-neutral-900 dark:text-white">{currency}{product.price.toFixed(2)}</span>
          {originalPrice && originalPrice > product.price && (
            <span className="text-xs text-neutral-400 line-through">{currency}{originalPrice.toFixed(2)}</span>
          )}
        </div>
      </div>
    </div>
  );
};
