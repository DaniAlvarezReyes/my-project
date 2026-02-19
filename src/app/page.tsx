'use client';

import React from 'react';
import { MainNav } from '@/components/MainNav';
import { Hero } from '@/components/Hero';
import { ProductCard } from '@/components/ProductCard';
import { Footer } from '@/components/Footer';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { getFeaturedProducts, getOnSaleProducts } from '@/data/products';
import { categories } from '@/data/categories';

export default function Home() {
  const { addItem } = useCart();
  const featuredProducts = getFeaturedProducts();
  const onSaleProducts = getOnSaleProducts();

  const handleAddToCart = (product: any) => {
    addItem(product);
    alert(`${product.name} añadido al carrito!`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <MainNav />

      <Hero
        title="Las mejores zapatillas del mercado"
        subtitle="Nueva colección 2026"
        description="Descubre las últimas tendencias en calzado deportivo y casual. Envío gratis en pedidos superiores a 50€."
        ctaText="Ver Colección"
        ctaHref="/productos"
        secondaryCtaText="Ver Ofertas"
        secondaryCtaHref="/productos?filter=ofertas"
      />

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

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={() => handleAddToCart(product)}
                onViewDetails={() => {}}
                currency="€"
              />
            ))}
          </div>
        </div>
      </section>

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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {onSaleProducts.slice(0, 4).map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={() => handleAddToCart(product)}
                  onViewDetails={() => {}}
                  currency="€"
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

      {/* Newsletter */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Suscríbete a nuestro newsletter</h2>
          <p className="text-blue-100 mb-8">
            Recibe las últimas novedades y ofertas exclusivas directamente en tu email
          </p>
          <form className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
            <input
              type="email"
              placeholder="tu@email.com"
              className="flex-1 px-4 py-3 rounded-lg text-gray-900"
            />
            <button
              type="submit"
              className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 whitespace-nowrap"
            >
              Suscribir
            </button>
          </form>
        </div>
      </section>

      <Footer
        siteName="Sneakers Pro"
        description="Tu tienda de confianza para zapatillas de calidad. Envíos a toda España."
        sections={[
          {
            title: 'Comprar',
            links: [
              { label: 'Todos los productos', href: '/productos' },
              { label: 'Categorías', href: '/categorias' },
              { label: 'Novedades', href: '/productos?filter=nuevos' },
              { label: 'Ofertas', href: '/productos?filter=ofertas' },
            ],
          },
          {
            title: 'Ayuda',
            links: [
              { label: 'Envíos', href: '/legal/envios' },
              { label: 'Devoluciones', href: '/legal/devoluciones' },
              { label: 'Contacto', href: '/contacto' },
            ],
          },
          {
            title: 'Legal',
            links: [
              { label: 'Privacidad', href: '/legal/privacidad' },
              { label: 'Términos', href: '/legal/terminos' },
              { label: 'Cookies', href: '/legal/cookies' },
            ],
          },
        ]}
        socialLinks={[
          { platform: 'instagram', url: 'https://instagram.com/sneakerspro' },
          { platform: 'facebook', url: 'https://facebook.com/sneakerspro' },
        ]}
        copyrightText="© 2026 Sneakers Pro. Todos los derechos reservados."
      />
    </div>
  );
}
