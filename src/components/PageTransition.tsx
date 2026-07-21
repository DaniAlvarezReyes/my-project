'use client';
import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayChildren, setDisplayChildren] = useState(children);

  useEffect(() => {
    setIsTransitioning(true);
    const timer = setTimeout(() => {
      setDisplayChildren(children);
      setIsTransitioning(false);
    }, 150);
    return () => clearTimeout(timer);
  }, [pathname]);

  // IMPORTANTE: no usar `transform` (translate) de forma permanente aquí.
  // Un transform en un ancestro rompe `position: fixed` de los modales
  // (lightbox, guía de tallas…), que se renderizarían fuera de la vista.
  // Por eso animamos solo la opacidad.
  return (
    <div
      className={`transition-opacity duration-300 ${
        isTransitioning ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {displayChildren}
    </div>
  );
}
