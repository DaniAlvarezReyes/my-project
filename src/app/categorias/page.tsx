'use client';
import React from 'react';
import Link from 'next/link';
import { MainNav } from '@/components/MainNav';
import { Footer } from '@/components/Footer';
import { categories } from '@/data/categories';

export default function CategoriasPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <MainNav />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Breadcrumb */}
        <nav className="flex mb-8" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li>
              <Link href="/" className="text-gray-700 hover:text-blue-600">
                Inicio
              </Link>
            </li>
            <li>
              <span className="text-gray-400 mx-2">/</span>
              <span className="text-gray-900 font-medium">Categorías</span>
            </li>
          </ol>
        </nav>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Explora Nuestras Categorías
          </h1>
          <p className="text-lg text-gray-600">
            Encuentra exactamente lo que buscas navegando por categorías
          </p>
        </div>

        {/* Categorías Grid */}
        <div className="space-y-16">
          {categories.map((category) => (
            <div key={category.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              {/* Header de categoría */}
              <div className="relative h-48 overflow-hidden">
                <img
                  src={category.image}
                  alt={category.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end">
                  <div className="p-6 text-white">
                    <h2 className="text-3xl font-bold mb-2">{category.name}</h2>
                    <p className="text-gray-200">{category.description}</p>
                  </div>
                </div>
              </div>

              {/* Subcategorías */}
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">Subcategorías:</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {category.subcategories && category.subcategories.length > 0 ? (
                    category.subcategories.map((sub) => (
                      <Link
                        key={sub.slug}
                        href={`/productos?categoria=${category.slug}&subcategoria=${sub.slug}`}
                        className="group"
                      >
                        <div className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-600 hover:bg-blue-50 transition-all duration-200 text-center">
                          <p className="font-medium text-gray-900 group-hover:text-blue-600">
                            {sub.name}
                          </p>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <p className="text-gray-500 col-span-full">No hay subcategorías disponibles</p>
                  )}
                </div>

                {/* Ver todos de esta categoría */}
                <div className="mt-6">
                  <Link
                    href={`/productos?categoria=${category.slug}`}
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold"
                  >
                    Ver todos los productos de {category.name}
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-16 bg-blue-600 rounded-lg p-8 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">¿No encuentras lo que buscas?</h2>
          <p className="text-lg mb-6">
            Explora toda nuestra colección de productos o usa los filtros para encontrar exactamente lo que necesitas
          </p>
          <Link
            href="/productos"
            className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Ver Todos los Productos
          </Link>
        </div>
      </div>

      <Footer
        siteName="Sneakers Pro"
        description="Tu tienda de confianza"
        sections={[]}
        socialLinks={[]}
      />
    </div>
  );
}
