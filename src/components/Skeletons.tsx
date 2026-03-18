import React from 'react';

const shimmer = 'animate-pulse bg-gray-200 rounded';

export const ProductCardSkeleton = () => (
  <div className="bg-white rounded-lg shadow-md overflow-hidden">
    <div className={`aspect-square ${shimmer}`} />
    <div className="p-4 space-y-3">
      <div className={`h-3 w-16 ${shimmer}`} />
      <div className={`h-5 w-3/4 ${shimmer}`} />
      <div className={`h-3 w-24 ${shimmer}`} />
      <div className={`h-7 w-28 ${shimmer}`} />
      <div className={`h-10 w-full ${shimmer}`} />
    </div>
  </div>
);

export const ProductGridSkeleton = ({ count = 6 }: { count?: number }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
    {Array.from({ length: count }).map((_, i) => (
      <ProductCardSkeleton key={i} />
    ))}
  </div>
);

export const ProductDetailSkeleton = () => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
    <div>
      <div className={`aspect-square ${shimmer} mb-4`} />
      <div className="grid grid-cols-4 gap-2">
        {[1,2,3,4].map(i => <div key={i} className={`h-24 ${shimmer}`} />)}
      </div>
    </div>
    <div className="space-y-4">
      <div className={`h-4 w-20 ${shimmer}`} />
      <div className={`h-8 w-3/4 ${shimmer}`} />
      <div className={`h-4 w-32 ${shimmer}`} />
      <div className={`h-10 w-40 ${shimmer}`} />
      <div className={`h-20 w-full ${shimmer}`} />
      <div className={`h-4 w-24 ${shimmer}`} />
      <div className="flex gap-2">
        {[1,2,3,4].map(i => <div key={i} className={`h-10 w-16 ${shimmer}`} />)}
      </div>
      <div className={`h-4 w-24 ${shimmer}`} />
      <div className="grid grid-cols-5 gap-2">
        {[1,2,3,4,5].map(i => <div key={i} className={`h-12 ${shimmer}`} />)}
      </div>
      <div className={`h-14 w-full ${shimmer} mt-4`} />
    </div>
  </div>
);

export const OrderCardSkeleton = () => (
  <div className="bg-white rounded-lg shadow-md p-6">
    <div className="flex justify-between items-start mb-4">
      <div className="space-y-2">
        <div className={`h-4 w-28 ${shimmer}`} />
        <div className={`h-3 w-20 ${shimmer}`} />
      </div>
      <div className={`h-6 w-24 ${shimmer} rounded-full`} />
    </div>
    <div className="border-t pt-4 space-y-3">
      <div className={`h-8 w-24 ${shimmer}`} />
      <div className={`h-10 w-full ${shimmer}`} />
    </div>
  </div>
);

export const TableRowSkeleton = ({ cols = 5 }: { cols?: number }) => (
  <tr>
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} className="px-6 py-4">
        <div className={`h-4 w-full max-w-[120px] ${shimmer}`} />
      </td>
    ))}
  </tr>
);

export const TextSkeleton = ({ lines = 3, className = '' }: { lines?: number; className?: string }) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <div key={i} className={`h-4 ${shimmer}`} style={{ width: `${90 - i * 15}%` }} />
    ))}
  </div>
);
