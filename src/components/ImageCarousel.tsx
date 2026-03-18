'use client';
import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';

interface CarouselImage {
  src: string;
  alt: string;
  title?: string;
  subtitle?: string;
}

const images: CarouselImage[] = [
  {
    src: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1600&h=600&fit=crop',
    alt: 'Nike Red Sneakers',
    title: 'Nueva Colección Nike',
    subtitle: 'Las zapatillas más innovadoras'
  },
  {
    src: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=1600&h=600&fit=crop',
    alt: 'Adidas White Sneakers',
    title: 'Adidas Originals',
    subtitle: 'Estilo clásico, confort moderno'
  },
  {
    src: 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=1600&h=600&fit=crop',
    alt: 'Running Shoes',
    title: 'Para Runners',
    subtitle: 'Máximo rendimiento en cada paso'
  },
  {
    src: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=1600&h=600&fit=crop',
    alt: 'Jordan Sneakers',
    title: 'Jordan Collection',
    subtitle: 'Icónicas e inigualables'
  },
  {
    src: 'https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=1600&h=600&fit=crop',
    alt: 'Lifestyle Sneakers',
    title: 'Estilo Urbano',
    subtitle: 'Para el día a día'
  },
];

export const ImageCarousel: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  }, []);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  // Auto-play con temporizador
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(nextSlide, 5000); // Cambiar cada 5 segundos

    return () => clearInterval(interval);
  }, [isPlaying, nextSlide]);

  return (
    <div className="relative w-full h-[400px] md:h-[500px] lg:h-[600px] overflow-hidden rounded-lg shadow-xl">
      {/* Imágenes */}
      <div className="relative w-full h-full">
        {images.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          >
            <img
              src={image.src}
              alt={image.alt}
              className="w-full h-full object-cover"
            />
            
            {/* Overlay oscuro para mejor legibilidad del texto */}
            <div className="absolute inset-0 bg-black bg-opacity-30"></div>
            
            {/* Texto sobre la imagen */}
            {image.title && (
              <div className="absolute inset-0 flex flex-col justify-center items-center text-white z-20 px-4">
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 text-center drop-shadow-lg">
                  {image.title}
                </h2>
                {image.subtitle && (
                  <p className="text-lg md:text-xl lg:text-2xl text-center drop-shadow-lg">
                    {image.subtitle}
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Botón anterior */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/80 hover:bg-white p-3 rounded-full shadow-lg transition-all hover:scale-110"
        aria-label="Imagen anterior"
      >
        <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Botón siguiente */}
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/80 hover:bg-white p-3 rounded-full shadow-lg transition-all hover:scale-110"
        aria-label="Imagen siguiente"
      >
        <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Botón play/pause */}
      <button
        onClick={() => setIsPlaying(!isPlaying)}
        className="absolute top-4 right-4 z-20 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg transition-all hover:scale-110"
        aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
      >
        {isPlaying ? (
          <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ) : (
          <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
      </button>

      {/* Indicadores (dots) */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex space-x-2">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-all ${
              index === currentIndex
                ? 'bg-white w-8'
                : 'bg-white/50 hover:bg-white/75'
            }`}
            aria-label={`Ir a imagen ${index + 1}`}
          />
        ))}
      </div>

      {/* Contador de imágenes */}
      <div className="absolute bottom-4 right-4 z-20 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
        {currentIndex + 1} / {images.length}
      </div>
    </div>
  );
};
