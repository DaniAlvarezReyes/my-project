'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MainNav } from '@/components/MainNav';
import { ImageCarousel } from '@/components/ImageCarousel';
import { ProductCard } from '@/components/ProductCard';
import { Footer } from '@/components/Footer';
import Link from 'next/link';

import { categories } from '@/data/categories';
import { supabase } from '@/lib/supabase';
import RecentlyViewed from '@/components/RecentlyViewed';
import AdBanner, { AdPlacements } from '@/components/AdBanner';

export default function Home() {
  const router = useRouter();
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [onSaleProducts, setOnSaleProducts] = useState<any[]>([]);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const { data } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false });
        if (data) {
          setFeaturedProducts(data.slice(0, 8));
          setOnSaleProducts(data.filter(p => p.original_price && p.original_price > p.price).slice(0, 8));
        }
      } catch {}
    };
    loadProducts();
  }, []);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    setNewsletterStatus('loading');
    try {
      const { error } = await supabase
        .from('newsletter_subscribers')
        .insert({ email: newsletterEmail.trim().toLowerCase() });
      if (error) {
        if (error.code === '23505') {
          setNewsletterStatus('success'); // Ya estaba suscrito, no mostramos error
        } else {
          throw error;
        }
      } else {
        setNewsletterStatus('success');
      }
      setNewsletterEmail('');
    } catch (err) {
      console.error('Newsletter error:', err);
      setNewsletterStatus('error');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <MainNav />

      {/* Carrusel de imágenes */}
      <div className="w-full">
        <ImageCarousel />
      </div>

      {/* Categories Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Compra por Categoría
            </h2>
            <p className="text-lg text-gray-600">
              Encuentra exactamente lo que buscas
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 stagger-children">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/productos?categoria=${category.slug}`}
                className="group"
              >
                <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 mb-2">
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <h3 className="text-center font-semibold text-gray-900 group-hover:text-blue-600">
                  {category.name}
                </h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                Productos Destacados
              </h2>
              <p className="text-lg text-gray-600">
                Lo más popular de nuestra tienda
              </p>
            </div>
            <Link
              href="/productos"
              className="hidden md:block text-blue-600 hover:text-blue-700 font-semibold"
            >
              Ver todos →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 stagger-children">
            {featuredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Ad slot */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <AdBanner slot={AdPlacements.HOME_PRODUCTS_BETWEEN} format="leaderboard" />
      </div>

      {/* On Sale Products */}
      {onSaleProducts.length > 0 && (
        <section className="py-16 bg-red-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <div className="inline-block bg-red-500 text-white px-4 py-1 rounded-full text-sm font-bold mb-4">
                OFERTAS
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                Rebajas hasta -30%
              </h2>
              <p className="text-lg text-gray-600">
                Aprovecha estas ofertas por tiempo limitado
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 stagger-children">
              {onSaleProducts.slice(0, 4).map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Envío Gratis</h3>
              <p className="text-gray-600">En pedidos superiores a 50€</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Pago Seguro</h3>
              <p className="text-gray-600">Protección total en tus compras</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Devoluciones 30 Días</h3>
              <p className="text-gray-600">Sin preguntas, sin complicaciones</p>
            </div>
          </div>
        </div>
      </section>

      {/* Recently Viewed */}
      <section className="py-4 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <RecentlyViewed />
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Suscríbete a nuestro newsletter</h2>
          <p className="text-blue-100 mb-8">
            Recibe las últimas novedades y ofertas exclusivas directamente en tu email
          </p>
          <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
            <input
              type="email"
              placeholder="tu@email.com"
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
              required
              className="flex-1 px-4 py-3 rounded-lg text-gray-900"
              disabled={newsletterStatus === 'loading'}
            />
            <button
              type="submit"
              disabled={newsletterStatus === 'loading'}
              className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 whitespace-nowrap disabled:opacity-50"
            >
              {newsletterStatus === 'loading' ? 'Enviando...' : 'Suscribir'}
            </button>
          </form>
          {newsletterStatus === 'success' && (
            <p className="mt-3 text-blue-100 text-sm">¡Te has suscrito correctamente!</p>
          )}
          {newsletterStatus === 'error' && (
            <p className="mt-3 text-red-200 text-sm">Error al suscribirse. Inténtalo de nuevo.</p>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
