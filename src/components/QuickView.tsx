'use client';
import React, { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';

interface Props {
  product: any;
  onClose: () => void;
}

export default function QuickView({ product, onClose }: Props) {
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [currentImage, setCurrentImage] = useState(0);
  const { addItem } = useCart();
  const toast = useToast();
  const images = product.images || [];
  const sizes = product.sizes || [];
  const colors = product.colors || [];
  const originalPrice = product.originalPrice || product.original_price;

  const handleAdd = () => {
    if (sizes.length > 0 && !selectedSize) { toast.warning('Selecciona una talla'); return; }
    addItem(product, 1, selectedSize, selectedColor);
    toast.success('Añadido al carrito');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4" onClick={onClose}>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative bg-white dark:bg-neutral-900 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-scaleIn" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center text-neutral-400 hover:text-black dark:hover:text-white transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Images */}
          <div className="relative aspect-[3/4] bg-neutral-100 dark:bg-neutral-800">
            <img src={images[currentImage] || 'https://via.placeholder.com/600x800'} alt="" className="w-full h-full object-cover" />
            {images.length > 1 && (
              <div className="absolute bottom-3 left-3 flex gap-1.5">
                {images.slice(0, 4).map((_: any, i: number) => (
                  <button key={i} onClick={(e) => { e.stopPropagation(); setCurrentImage(i); }} className={`w-2 h-2 rounded-full transition-colors ${i === currentImage ? 'bg-black dark:bg-white' : 'bg-black/30 dark:bg-white/30'}`} />
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="p-6 md:p-8 flex flex-col">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400 mb-2">{product.brand}</p>
            <h2 className="text-xl font-black uppercase tracking-tight text-neutral-900 dark:text-white mb-3">{product.name}</h2>
            <div className="flex items-center gap-3 mb-6">
              <span className="text-lg font-black">€{product.price?.toFixed(2)}</span>
              {originalPrice && originalPrice > product.price && (
                <span className="text-sm text-neutral-400 line-through">€{originalPrice.toFixed(2)}</span>
              )}
            </div>

            {/* Sizes */}
            {sizes.length > 0 && (
              <div className="mb-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400 mb-3">Talla</p>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((s: string) => (
                    <button key={s} onClick={(e) => { e.stopPropagation(); setSelectedSize(s); }}
                      className={`px-3 py-2 text-xs font-bold border transition-colors ${selectedSize === s ? 'border-black dark:border-white bg-black dark:bg-white text-white dark:text-black' : 'border-neutral-200 dark:border-neutral-700 hover:border-black dark:hover:border-white'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Colors */}
            {colors.length > 0 && (
              <div className="mb-6">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400 mb-3">Color {selectedColor && `— ${selectedColor}`}</p>
                <div className="flex gap-2">
                  {colors.map((c: string) => (
                    <button key={c} onClick={(e) => { e.stopPropagation(); setSelectedColor(c); }}
                      className={`w-8 h-8 rounded-full border-2 transition-colors ${selectedColor === c ? 'border-black dark:border-white scale-110' : 'border-transparent hover:border-neutral-300'}`}
                      style={{ backgroundColor: c.toLowerCase() === 'blanco' ? '#fff' : c.toLowerCase() === 'negro' ? '#000' : c.toLowerCase() === 'azul' ? '#3b82f6' : c.toLowerCase() === 'rojo' ? '#ef4444' : '#9ca3af' }}
                      title={c}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="mt-auto">
              <button onClick={handleAdd} className="w-full py-4 bg-black dark:bg-white text-white dark:text-black text-xs font-bold uppercase tracking-widest hover:opacity-80 transition-opacity">
                Añadir al carrito
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
