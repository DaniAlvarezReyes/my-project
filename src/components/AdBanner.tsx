'use client';
import React, { useEffect, useRef } from 'react';

interface AdBannerProps {
  slot: string;           // AdSense slot ID or custom placement ID
  format?: 'horizontal' | 'vertical' | 'rectangle' | 'leaderboard';
  className?: string;
  testMode?: boolean;     // Show placeholder in dev
}

const FORMAT_SIZES: Record<string, { width: string; minHeight: string }> = {
  horizontal: { width: '100%', minHeight: '90px' },
  vertical: { width: '160px', minHeight: '600px' },
  rectangle: { width: '300px', minHeight: '250px' },
  leaderboard: { width: '100%', minHeight: '90px' },
};

export default function AdBanner({ slot, format = 'horizontal', className = '', testMode }: AdBannerProps) {
  const adRef = useRef<HTMLDivElement>(null);
  const isTest = testMode ?? process.env.NODE_ENV === 'development';
  const sizes = FORMAT_SIZES[format];

  useEffect(() => {
    // In production, push AdSense ad
    if (!isTest && typeof window !== 'undefined' && (window as any).adsbygoogle) {
      try {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      } catch {}
    }
  }, [isTest]);

  // Dev mode placeholder
  if (isTest) {
    return (
      <div
        className={`bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center text-gray-400 dark:text-gray-500 text-xs font-mono ${className}`}
        style={{ width: sizes.width, minHeight: sizes.minHeight }}
      >
        AD: {format} ({slot})
      </div>
    );
  }

  // Production: Google AdSense
  return (
    <div ref={adRef} className={className} style={{ width: sizes.width, minHeight: sizes.minHeight }}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block', width: '100%', height: '100%' }}
        data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || ''}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}

// Pre-defined ad placements
export const AdPlacements = {
  // Homepage
  HOME_HERO_BELOW: 'home-hero-below',
  HOME_PRODUCTS_BETWEEN: 'home-products-between',
  // Product pages
  PRODUCT_SIDEBAR: 'product-sidebar',
  PRODUCT_BELOW_COMMENTS: 'product-below-comments',
  PRODUCT_LIST_INLINE: 'product-list-inline',
  // General
  FOOTER_ABOVE: 'footer-above',
} as const;
