'use client';
import React, { useState } from 'react';

interface Props {
  images: string[];
  onClose?: () => void;
}

export default function ReviewGallery({ images, onClose }: Props) {
  const [current, setCurrent] = useState(0);

  if (images.length === 0) return null;

  // Inline gallery (thumbnails)
  if (!onClose) {
    return (
      <div className="flex gap-2 mt-3">
        {images.map((img, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
              i === current ? 'border-blue-500' : 'border-transparent hover:border-gray-300'
            }`}
          >
            <img src={img} alt="" className="w-full h-full object-cover" />
          </button>
        ))}
      </div>
    );
  }

  // Fullscreen lightbox
  return (
    <div className="fixed inset-0 bg-black/90 z-[9999] flex items-center justify-center" onClick={onClose}>
      <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white p-2">
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <button
        onClick={(e) => { e.stopPropagation(); setCurrent(p => p === 0 ? images.length - 1 : p - 1); }}
        className="absolute left-4 text-white/70 hover:text-white p-2"
      >
        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <img
        src={images[current]}
        alt=""
        className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg"
        onClick={(e) => e.stopPropagation()}
      />

      <button
        onClick={(e) => { e.stopPropagation(); setCurrent(p => p === images.length - 1 ? 0 : p + 1); }}
        className="absolute right-4 text-white/70 hover:text-white p-2"
      >
        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      <div className="absolute bottom-4 text-white/70 text-sm">
        {current + 1} / {images.length}
      </div>
    </div>
  );
}
