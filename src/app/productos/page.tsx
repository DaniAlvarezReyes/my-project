'use client';
import React, { useState, useMemo } from 'react';
import { MainNav } from '@/components/MainNav';
import { Footer } from '@/components/Footer';
import { ProductCard } from '@/components/ProductCard';
import { useCart } from '@/context/CartContext';
import { products } from '@/data/products';
import { categories } from '@/data/categories';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';

export default function ProductosPage() {
  const { addItem } = useCart();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('categoria') || 'all');
  const [selectedBrand, setSelectedBrand] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState([0, 300]);
  const [sortBy, setSortBy] = useState('featured');
  const [showFilters, setShowFilters] = useState(false);

  // Obtener marcas únicas
  const brands = useMemo(() => {
    const allBrands = products.map(p => p.brand);
    return [...new Set(allBrands)].sort();
  }, []);

  // Filtrar productos
  const filteredProducts = useMemo(() => {
    let filtered = products;

    // Filtro especial desde URL
    const filter = searchParams.get('filter');
    if (filter === 'ofertas') {
      filtered = filtered.filter(p => p.originalPrice && p.originalPrice > p.price);
    } else if (filter === 'nuevos') {
      filtered = filtered.filter(p => p.badge === 'NUEVO');
    }

    // Filtrar por categoría
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }

    // Filtrar por marca
    if (selectedBrand.length > 0) {
      filtered = filtered.filter(p => selectedBrand.includes(p.brand));
    }

    // Filtrar por precio
    filtered = filtered.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);

    // Ordenar
    switch (sortBy) {
      case 'price-asc':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'name-asc':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
    }

    return filtered;
  }, [selectedCategory, selectedBrand, priceRange, sortBy, searchParams]);

  const handleBrandToggle = (brand: string) => {
    setSelectedBrand(prev =>
      prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
    );
  };

  const handleAddToCart = (product: any) => {
    addItem(product);
    alert(`${product.name} añadido al carrito!`);
  };

  const handleViewDetails = (productId: string) => {
    router.push(`/productos/${productId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <MainNav />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
              <span className="text-gray-900 font-medium">Productos</span>
            </li>
          </ol>
        </nav>

        <div className="lg:grid lg:grid-cols-4 lg:gap-8">
          {/* Sidebar - Filtros */}
          <aside className={`${showFilters ? 'block' : 'hidden'} lg:block lg:col-span-1`}>
            <div className="bg-white rounded-lg shadow p-6 sticky top-24">
              <div className="flex justify-between items-center mb-6 lg:hidden">
                <h3 className="text-lg font-semibold">Filtros</h3>
                <button onClick={() => setShowFilters(false)} className="text-gray-500">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Categorías */}
              <div className="mb-6">
                <h4 className="font-semibold mb-3">Categoría</h4>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="category"
                      checked={selectedCategory === 'all'}
                      onChange={() => setSelectedCategory('all')}
                      className="mr-2"
                    />
                    <span>Todas</span>
                  </label>
                  {categories.map(cat => (
                    <label key={cat.id} className="flex items-center">
                      <input
                        type="radio"
                        name="category"
                        checked={selectedCategory === cat.slug}
                        onChange={() => setSelectedCategory(cat.slug)}
                        className="mr-2"
                      />
                      <span>{cat.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Marcas */}
              <div className="mb-6">
                <h4 className="font-semibold mb-3">Marca</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {brands.map(brand => (
                    <label key={brand} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedBrand.includes(brand)}
                        onChange={() => handleBrandToggle(brand)}
                        className="mr-2"
                      />
                      <span>{brand}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Precio */}
              <div className="mb-6">
                <h4 className="font-semibold mb-3">Precio</h4>
                <div className="space-y-2">
                  <input
                    type="range"
                    min="0"
                    max="300"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([0, parseInt(e.target.value)])}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>€{priceRange[0]}</span>
                    <span>€{priceRange[1]}</span>
                  </div>
                </div>
              </div>

              {/* Resetear filtros */}
              <button
                onClick={() => {
                  setSelectedCategory('all');
                  setSelectedBrand([]);
                  setPriceRange([0, 300]);
                }}
                className="w-full text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                Limpiar filtros
              </button>
            </div>
          </aside>

          {/* Productos */}
          <div className="lg:col-span-3">
            {/* Header con ordenación */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {searchParams.get('filter') === 'ofertas' && 'Ofertas'}
                  {searchParams.get('filter') === 'nuevos' && 'Novedades'}
                  {!searchParams.get('filter') && 'Todos los Productos'}
                </h1>
                <p className="text-gray-600 mt-1">{filteredProducts.length} productos encontrados</p>
              </div>

              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setShowFilters(true)}
                  className="lg:hidden flex-1 sm:flex-none px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
                >
                  Filtros
                </button>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="flex-1 sm:flex-none px-4 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="featured">Destacados</option>
                  <option value="price-asc">Precio: Menor a Mayor</option>
                  <option value="price-desc">Precio: Mayor a Menor</option>
                  <option value="name-asc">Nombre: A-Z</option>
                  <option value="rating">Mejor Valorados</option>
                </select>
              </div>
            </div>

            {/* Grid de productos */}
            {filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="mt-2 text-sm text-gray-500">No se encontraron productos con estos filtros</p>
                <button
                  onClick={() => {
                    setSelectedCategory('all');
                    setSelectedBrand([]);
                    setPriceRange([0, 300]);
                  }}
                  className="mt-4 text-blue-600 hover:text-blue-700 font-medium text-sm"
                >
                  Limpiar filtros
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={() => handleAddToCart(product)}
                    onViewDetails={() => handleViewDetails(product.id)}
                    currency="€"
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer
        siteName="Sneakers Pro"
        description="Tu tienda de confianza para zapatillas de calidad."
        sections={[]}
        socialLinks={[]}
      />
    </div>
  );
}
