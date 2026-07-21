'use client';
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface ImageLightboxProps {
  images: string[];
  initialIndex: number;
  onClose: () => void;
}

export default function ImageLightbox({ images, initialIndex, onClose }: ImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        goToPrevious();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [currentIndex]);

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] bg-black bg-opacity-95 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Botón cerrar */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-gray-300 z-10 p-2"
        aria-label="Cerrar"
      >
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Contador */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white text-lg font-semibold bg-black bg-opacity-50 px-4 py-2 rounded-full">
        {currentIndex + 1} / {images.length}
      </div>

      {/* Navegación izquierda */}
      {images.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            goToPrevious();
          }}
          className="absolute left-4 text-white hover:text-gray-300 p-3 bg-black bg-opacity-50 rounded-full hover:bg-opacity-75 transition"
          aria-label="Anterior"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* Imagen principal */}
      <div
        className="max-w-7xl w-full flex items-center justify-center p-4"
        style={{ height: '85vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={images[currentIndex]}
          alt={`Imagen ${currentIndex + 1}`}
          className="max-w-full max-h-full object-contain"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = 'https://via.placeholder.com/800x800?text=Error+al+cargar';
          }}
        />
      </div>

      {/* Navegación derecha */}
      {images.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            goToNext();
          }}
          className="absolute right-4 text-white hover:text-gray-300 p-3 bg-black bg-opacity-50 rounded-full hover:bg-opacity-75 transition"
          aria-label="Siguiente"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-black bg-opacity-50 p-3 rounded-lg max-w-[90vw] overflow-x-auto">
          {images.map((image, idx) => (
            <button
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(idx);
              }}
              className={`flex-shrink-0 w-16 h-16 rounded overflow-hidden border-2 transition ${
                idx === currentIndex
                  ? 'border-white ring-2 ring-white'
                  : 'border-gray-500 hover:border-gray-300'
              }`}
            >
              <img
                src={image}
                alt={`Thumbnail ${idx + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Ayuda de teclado */}
      <div className="absolute bottom-4 right-4 text-white text-sm bg-black bg-opacity-50 px-3 py-2 rounded">
        <div>← → para navegar</div>
        <div>ESC para cerrar</div>
      </div>
    </div>,
    document.body
  );
}
