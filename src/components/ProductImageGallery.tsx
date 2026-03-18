'use client';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';

interface ColorVariant {
  color_name: string;
  color_hex: string;
  images: string[];
  stock: number;
  is_available: boolean;
}

interface ProductImageGalleryProps {
  colorVariants: ColorVariant[];
  productName: string;
  onColorChange?: (colorName: string) => void;
}

export default function ProductImageGallery({ 
  colorVariants, 
  productName,
  onColorChange 
}: ProductImageGalleryProps) {
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  const currentVariant = colorVariants[selectedColorIndex];
  const currentImages = currentVariant?.images || [];
  const currentImage = currentImages[selectedImageIndex];

  useEffect(() => {
    // Reset image index when color changes
    setSelectedImageIndex(0);
  }, [selectedColorIndex]);

  const handleColorChange = (index: number) => {
    setSelectedColorIndex(index);
    if (onColorChange) {
      onColorChange(colorVariants[index].color_name);
    }
  };

  const handlePrevImage = () => {
    setSelectedImageIndex((prev) => 
      prev === 0 ? currentImages.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    setSelectedImageIndex((prev) => 
      prev === currentImages.length - 1 ? 0 : prev + 1
    );
  };

  if (!currentVariant || currentImages.length === 0) {
    return (
      <div className="w-full aspect-square bg-gray-200 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">Sin imágenes disponibles</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Image with Carousel */}
      <div className="relative w-full aspect-square bg-gray-100 rounded-lg overflow-hidden group">
        {/* Main Image */}
        <div 
          className={`w-full h-full transition-transform duration-300 ${
            isZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'
          }`}
          onClick={() => setIsZoomed(!isZoomed)}
        >
          <img
            src={currentImage}
            alt={`${productName} - ${currentVariant.color_name}`}
            className={`w-full h-full object-cover transition-all duration-500 ${
              isZoomed ? 'scale-150' : 'scale-100'
            }`}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = 'https://via.placeholder.com/800x800?text=Error';
            }}
          />
        </div>

        {/* Navigation Arrows */}
        {currentImages.length > 1 && (
          <>
            <button
              onClick={handlePrevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
              aria-label="Imagen anterior"
            >
              <svg className="w-6 h-6 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={handleNextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
              aria-label="Imagen siguiente"
            >
              <svg className="w-6 h-6 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        {/* Image Counter */}
        {currentImages.length > 1 && (
          <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm font-medium">
            {selectedImageIndex + 1} / {currentImages.length}
          </div>
        )}

        {/* Stock Badge */}
        {currentVariant.stock === 0 && (
          <div className="absolute top-4 left-4 bg-red-500 text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg">
            AGOTADO
          </div>
        )}
        {currentVariant.stock > 0 && currentVariant.stock <= 5 && (
          <div className="absolute top-4 left-4 bg-yellow-500 text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg">
            ¡ÚLTIMAS {currentVariant.stock} UNIDADES!
          </div>
        )}
      </div>

      {/* Thumbnail Images */}
      {currentImages.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {currentImages.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedImageIndex(index)}
              className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                index === selectedImageIndex
                  ? 'border-blue-600 ring-2 ring-blue-200'
                  : 'border-gray-200 hover:border-gray-400'
              }`}
            >
              <img
                src={image}
                alt={`Vista ${index + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://via.placeholder.com/200x200?text=Error';
                }}
              />
            </button>
          ))}
        </div>
      )}

      {/* Color Selector */}
      {colorVariants.length > 1 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">
              Color: <span className="text-blue-600">{currentVariant.color_name}</span>
            </h3>
            <span className="text-sm text-gray-600">
              {colorVariants.length} colores disponibles
            </span>
          </div>
          
          <div className="flex flex-wrap gap-3">
            {colorVariants.map((variant, index) => (
              <button
                key={index}
                onClick={() => handleColorChange(index)}
                disabled={!variant.is_available || variant.stock === 0}
                className={`relative group ${
                  !variant.is_available || variant.stock === 0
                    ? 'opacity-50 cursor-not-allowed'
                    : 'cursor-pointer'
                }`}
                title={variant.color_name}
              >
                <div
                  className={`w-12 h-12 rounded-full border-2 transition-all ${
                    index === selectedColorIndex
                      ? 'border-blue-600 ring-2 ring-blue-200 scale-110'
                      : 'border-gray-300 hover:border-gray-500'
                  } ${
                    !variant.is_available || variant.stock === 0
                      ? 'grayscale'
                      : ''
                  }`}
                  style={{ backgroundColor: variant.color_hex }}
                />
                
                {/* Color Name Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                  {variant.color_name}
                  {variant.stock > 0 && variant.stock <= 5 && (
                    <span className="ml-1 text-yellow-300">(¡{variant.stock} left!)</span>
                  )}
                  {variant.stock === 0 && (
                    <span className="ml-1 text-red-300">(Agotado)</span>
                  )}
                </div>

                {/* Out of Stock Indicator */}
                {variant.stock === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-px h-14 bg-red-500 rotate-45 absolute"></div>
                  </div>
                )}

                {/* Selected Checkmark */}
                {index === selectedColorIndex && (
                  <div className="absolute -top-1 -right-1 bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Color Stock Info */}
          {currentVariant.stock > 0 && (
            <div className="text-sm text-gray-600">
              <span className="font-medium">{currentVariant.stock}</span> unidades disponibles en {currentVariant.color_name}
            </div>
          )}
        </div>
      )}

      {/* Zoom Hint */}
      {!isZoomed && (
        <p className="text-xs text-gray-500 text-center">
          💡 Haz clic en la imagen para hacer zoom
        </p>
      )}
    </div>
  );
}
