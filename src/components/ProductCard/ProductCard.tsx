'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../Button';
import { Rating } from '../Rating';
import { Product } from '@/types';
import { useFavorites } from '@/context/FavoritesContext';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';

export interface ProductCardProps {
  product: Product;
  currency?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  currency = '€',
}) => {
  const router = useRouter();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { addItem } = useCart();
  const toast = useToast();
  const isLiked = isFavorite(product.id);

  const originalPrice = product.originalPrice || (product as any).original_price;
  const inStock = product.inStock ?? (product as any).in_stock ?? true;

  const discount = originalPrice
    ? Math.round(((originalPrice - product.price) / originalPrice) * 100)
    : 0;

  const handleViewDetails = () => {
    router.push(`/productos/${product.id}`);
  };

  const handleAddToCart = () => {
    // Si tiene tallas o colores, redirigir a detalle para elegir
    const hasSizes = product.sizes && product.sizes.length > 0;
    const hasColors = product.colors && product.colors.length > 0;

    if (hasSizes || hasColors) {
      router.push(`/productos/${product.id}`);
      return;
    }

    addItem(product);
    toast.success(`${product.name} añadido al carrito`);
  };

  return (
    <div className="group bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300">
      <div className="relative aspect-square overflow-hidden bg-gray-100 cursor-pointer" onClick={handleViewDetails}>
        <img
          src={product.images?.[0] || 'https://via.placeholder.com/400x400?text=No+Image'}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = 'https://via.placeholder.com/400x400?text=Error';
          }}
        />
        
        {/* Badges */}
        {(product.badge || discount > 0) && (
          <div className="absolute top-3 left-3 flex flex-row gap-2 z-10">
            {product.badge && (
              <span className="bg-red-500 text-white px-2.5 py-1 rounded-full text-xs font-bold shadow-sm whitespace-nowrap">
                {product.badge}
              </span>
            )}
            {discount > 0 && (
              <span className="bg-green-500 text-white px-2.5 py-1 rounded-full text-xs font-bold shadow-sm whitespace-nowrap">
                -{discount}%
              </span>
            )}
          </div>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(product.id);
          }}
          className={`absolute top-3 right-3 p-2 rounded-full transition-all z-10 ${
            isLiked 
              ? 'bg-red-500 text-white shadow-lg' 
              : 'bg-white/90 text-gray-700 hover:bg-red-500 hover:text-white shadow-md'
          }`}
          title={isLiked ? "Quitar de favoritos" : "Añadir a favoritos"}
        >
          <svg className="w-5 h-5" fill={isLiked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>

        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center pointer-events-none">
          <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white text-gray-900 px-4 py-2 rounded-lg font-medium shadow-lg text-sm">
            Ver detalles
          </span>
        </div>
      </div>

      <div className="p-4">
        {product.brand && (
          <p className="text-sm text-gray-600 mb-1">{product.brand}</p>
        )}
        
        <h3
          className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 cursor-pointer hover:text-blue-600 transition-colors"
          onClick={handleViewDetails}
        >
          {product.name}
        </h3>

        {product.rating !== undefined && (
          <div className="flex items-center gap-2 mb-3">
            <Rating value={product.rating} size="sm" />
            {product.reviews !== undefined && (
              <span className="text-sm text-gray-500">({product.reviews})</span>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl font-bold text-gray-900">
            {currency}{product.price.toFixed(2)}
          </span>
          {originalPrice && (
            <span className="text-sm text-gray-500 line-through">
              {currency}{originalPrice.toFixed(2)}
            </span>
          )}
        </div>

        <Button
          variant="primary"
          size="md"
          fullWidth
          onClick={handleAddToCart}
          disabled={inStock === false}
        >
          {inStock === false ? 'Agotado' : 'Añadir al carrito'}
        </Button>
      </div>
    </div>
  );
};
