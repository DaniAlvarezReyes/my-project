import React from 'react';
import { Button } from '../Button';
import { Rating } from '../Rating';
import { Product } from '@/types';
import { useFavorites } from '@/context/FavoritesContext';

export interface ProductCardProps {
  product: Product;
  onAddToCart?: (productId: string) => void;
  onViewDetails?: (productId: string) => void;
  currency?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  onViewDetails,
  currency = '€',
}) => {
  const { toggleFavorite, isFavorite } = useFavorites();
  const isLiked = isFavorite(product.id);

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <div className="group bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300">
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        <img
          src={product.images?.[0] || 'https://via.placeholder.com/400x400?text=No+Image'}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = 'https://via.placeholder.com/400x400?text=Error';
          }}
        />
        
        {/* Badge */}
        {product.badge && (
          <div className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
            {product.badge}
          </div>
        )}
        
        {/* Discount */}
        {discount > 0 && (
          <div className="absolute top-3 right-3 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold">
            -{discount}%
          </div>
        )}

        {/* Quick View (on hover) */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
          <Button
            variant="primary"
            size="sm"
            className="opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            onClick={() => onViewDetails?.(product.id)}
          >
            Ver detalles
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Brand */}
        {product.brand && (
          <p className="text-sm text-gray-600 mb-1">{product.brand}</p>
        )}
        
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
          {product.name}
        </h3>

        {/* Rating */}
        {product.rating !== undefined && (
          <div className="flex items-center gap-2 mb-3">
            <Rating value={product.rating} size="sm" />
            {product.reviews !== undefined && (
              <span className="text-sm text-gray-500">({product.reviews})</span>
            )}
          </div>
        )}

        {/* Price */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl font-bold text-gray-900">
            {currency}{product.price.toFixed(2)}
          </span>
          {product.originalPrice && (
            <span className="text-sm text-gray-500 line-through">
              {currency}{product.originalPrice.toFixed(2)}
            </span>
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-2">
          <Button
            variant="primary"
            size="md"
            fullWidth
            onClick={() => onAddToCart?.(product.id)}
            disabled={product.inStock === false}
          >
            {product.inStock === false ? 'Agotado' : 'Añadir'}
          </Button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(product.id);
            }}
            className={`px-3 py-2 border-2 rounded-lg transition-colors ${
              isLiked 
                ? 'border-red-500 bg-red-50 text-red-500' 
                : 'border-gray-300 text-gray-600 hover:border-red-500 hover:bg-red-50 hover:text-red-500'
            }`}
            title={isLiked ? "Quitar de favoritos" : "Añadir a favoritos"}
          >
            <svg className="w-5 h-5" fill={isLiked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
