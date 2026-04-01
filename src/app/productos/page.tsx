'use client';
import React, { useState, useMemo, useEffect, useCallback, Suspense } from 'react';
import { MainNav } from '@/components/MainNav';
import { Footer } from '@/components/Footer';
import { ProductCard } from '@/components/ProductCard';
import { ProductGridSkeleton } from '@/components/Skeletons';
import { supabase } from '@/lib/supabase';
import { categories } from '@/data/categories';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useInfiniteScroll } from '@/components/useInfiniteScroll';

function ProductosContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Read ALL URL params
  const urlCategoria = searchParams.get('categoria') || 'all';
  const urlMarca = searchParams.get('marca') || '';
  const urlSub = searchParams.get('sub') || '';
  const urlFilter = searchParams.get('filter') || '';
  const urlBuscar = searchParams.get('buscar') || '';
  const urlSort = searchParams.get('sortBy') || 'featured';

  const [selectedCategory, setSelectedCategory] = useState(urlCategoria);
  const [selectedBrands, setSelectedBrands] = useState<string[]>(urlMarca ? [urlMarca] : []);
  const [priceRange, setPriceRange] = useState([0, 500]);
  const [sortBy, setSortBy] = useState(urlSort);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(12);
  const PRODUCTS_PER_PAGE = 12;

  // Sync state FROM URL whenever URL changes
  useEffect(() => {
    setSelectedCategory(urlCategoria);
    if (urlMarca) {
      setSelectedBrands([urlMarca]);
    } else {
      setSelectedBrands([]);
    }
    setSortBy(urlSort);
  }, [urlCategoria, urlMarca, urlSort]);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async (retries = 2) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, color_variants:product_color_variants(color_name, color_hex, images)')
        .order('created_at', { ascending: false });

      if (error) {
        // If auth-related error, retry after a short delay
        if (retries > 0 && (error.message?.includes('lock') || error.code === 'PGRST301' || !error.message)) {
          console.warn('Retrying products load...', retries);
          await new Promise(r => setTimeout(r, 1000));
          return loadProducts(retries - 1);
        }
        console.error('Error cargando productos:', error.message || error);
      }

      setProducts(data || []);
    } catch (error: any) {
      if (retries > 0) {
        await new Promise(r => setTimeout(r, 1000));
        return loadProducts(retries - 1);
      }
      console.error('Error cargando productos:', error?.message || error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Unique brands from loaded products
  const allBrands = useMemo(() => {
    return [...new Set(products.map(p => p.brand).filter(Boolean))].sort();
  }, [products]);

  // Build the title based on active filters
  const pageTitle = useMemo(() => {
    if (urlBuscar) return `Resultados para "${urlBuscar}"`;
    if (urlFilter === 'ofertas') return 'Ofertas y Rebajas';
    if (urlFilter === 'nuevos') return 'Novedades';
    if (urlMarca) return urlMarca;
    const cat = categories.find(c => c.slug === urlCategoria || c.id === urlCategoria);
    if (cat) {
      if (urlSub) {
        const sub = cat.subcategories?.find(s => s.slug === urlSub);
        return sub ? `${cat.name} — ${sub.name}` : cat.name;
      }
      return cat.name;
    }
    return 'Todos los Productos';
  }, [urlCategoria, urlMarca, urlSub, urlFilter, urlBuscar]);

  // FILTER products
  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    // Search
    if (urlBuscar) {
      const q = urlBuscar.toLowerCase();
      filtered = filtered.filter(p =>
        p.name?.toLowerCase().includes(q) ||
        p.brand?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
      );
    }

    // Filter (ofertas, nuevos)
    if (urlFilter === 'ofertas') {
      filtered = filtered.filter(p => p.original_price && p.original_price > p.price);
    } else if (urlFilter === 'nuevos') {
      filtered = filtered.filter(p => p.badge === 'NUEVO');
    }

    // Category
    if (selectedCategory && selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }

    // Subcategory
    if (urlSub) {
      filtered = filtered.filter(p => p.subcategory === urlSub);
    }

    // Brand (from sidebar checkboxes OR from URL)
    if (selectedBrands.length > 0) {
      filtered = filtered.filter(p => selectedBrands.includes(p.brand));
    }

    // Price
    filtered = filtered.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);

    // Sort
    switch (sortBy) {
      case 'price-asc': filtered.sort((a, b) => a.price - b.price); break;
      case 'price-desc': filtered.sort((a, b) => b.price - a.price); break;
      case 'name': filtered.sort((a, b) => a.name.localeCompare(b.name)); break;
      case 'rating': filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0)); break;
    }

    return filtered;
  }, [products, selectedCategory, selectedBrands, priceRange, sortBy, urlBuscar, urlFilter, urlSub]);

  // Update URL helper
  const updateURL = useCallback((params: Record<string, string>) => {
    const sp = new URLSearchParams(searchParams.toString());
    Object.entries(params).forEach(([k, v]) => {
      if (v && v !== 'all' && v !== 'featured') {
        sp.set(k, v);
      } else {
        sp.delete(k);
      }
    });
    const qs = sp.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [searchParams, pathname, router]);

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    updateURL({ categoria: cat, sub: '' });
  };

  const handleBrandToggle = (brand: string) => {
    setSelectedBrands(prev => {
      const next = prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand];
      // Only put first brand in URL, rest is local state
      if (next.length === 1) {
        updateURL({ marca: next[0] });
      } else {
        updateURL({ marca: '' });
      }
      return next;
    });
  };

  const handleSortChange = (newSort: string) => {
    setSortBy(newSort);
    updateURL({ sortBy: newSort });
  };

  const clearFilters = () => {
    setSelectedCategory('all');
    setSelectedBrands([]);
    setPriceRange([0, 500]);
    setSortBy('featured');
    router.push('/productos');
  };

  // Reset pagination when filters change
  useEffect(() => {
    setVisibleCount(PRODUCTS_PER_PAGE);
  }, [selectedCategory, selectedBrands, priceRange, sortBy, urlBuscar, urlFilter, urlSub]);

  const visibleProducts = filteredProducts.slice(0, visibleCount);
  const hasMore = visibleCount < filteredProducts.length;
  const loadMore = useCallback(() => setVisibleCount(prev => prev + PRODUCTS_PER_PAGE), []);
  const sentinelRef = useInfiniteScroll(loadMore, hasMore);

  // Active filter tags
  const hasActiveFilters = selectedCategory !== 'all' || selectedBrands.length > 0 || urlBuscar || urlFilter || urlSub || priceRange[0] > 0 || priceRange[1] < 500;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <MainNav />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <div className="h-8 w-40 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="flex flex-col lg:flex-row gap-8">
            <aside className="lg:w-64 flex-shrink-0">
              <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
                {[1,2,3,4,5,6].map(i => <div key={i} className="h-8 bg-gray-200 rounded animate-pulse" />)}
              </div>
            </aside>
            <div className="flex-1"><ProductGridSkeleton count={6} /></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <MainNav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">{pageTitle}</h1>
          <p className="text-gray-500 text-sm">
            {filteredProducts.length} {filteredProducts.length === 1 ? 'producto' : 'productos'}
          </p>
        </div>

        {/* Active filter tags */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <span className="text-xs font-medium text-gray-500 uppercase">Filtros activos:</span>
            {selectedCategory !== 'all' && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                {categories.find(c => c.id === selectedCategory || c.slug === selectedCategory)?.name || selectedCategory}
                <button onClick={() => handleCategoryChange('all')} className="ml-1 hover:text-blue-900">×</button>
              </span>
            )}
            {urlSub && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                {urlSub}
                <button onClick={() => updateURL({ sub: '' })} className="ml-1 hover:text-blue-900">×</button>
              </span>
            )}
            {selectedBrands.map(b => (
              <span key={b} className="inline-flex items-center gap-1 px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm font-medium">
                {b}
                <button onClick={() => handleBrandToggle(b)} className="ml-1 hover:text-purple-900">×</button>
              </span>
            ))}
            {urlFilter && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-50 text-red-700 rounded-full text-sm font-medium">
                {urlFilter === 'ofertas' ? '🔥 Ofertas' : '✨ Novedades'}
                <button onClick={() => updateURL({ filter: '' })} className="ml-1 hover:text-red-900">×</button>
              </span>
            )}
            {urlBuscar && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                "{urlBuscar}"
                <button onClick={() => updateURL({ buscar: '' })} className="ml-1 hover:text-gray-900">×</button>
              </span>
            )}
            <button onClick={clearFilters} className="text-xs text-red-600 hover:text-red-800 font-medium ml-2">
              Limpiar todo
            </button>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar filters */}
          <aside className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-20">
              <h2 className="text-lg font-semibold mb-5">Filtros</h2>

              {/* Categories */}
              <div className="mb-6">
                <h3 className="font-medium text-sm text-gray-900 mb-3">Categorías</h3>
                <div className="space-y-1">
                  <button
                    onClick={() => handleCategoryChange('all')}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                      selectedCategory === 'all' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Todos
                  </button>
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => handleCategoryChange(cat.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                        selectedCategory === cat.id || selectedCategory === cat.slug
                          ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Brands */}
              {allBrands.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-medium text-sm text-gray-900 mb-3">Marcas</h3>
                  <div className="space-y-2">
                    {allBrands.map(brand => (
                      <label key={brand} className="flex items-center space-x-2 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={selectedBrands.includes(brand)}
                          onChange={() => handleBrandToggle(brand)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-600 group-hover:text-gray-900">{brand}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Price range */}
              <div>
                <h3 className="font-medium text-sm text-gray-900 dark:text-gray-200 mb-3">Precio</h3>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <label className="text-[10px] text-gray-500 mb-0.5 block">Mín</label>
                    <input
                      type="number"
                      min="0"
                      max={priceRange[1]}
                      step="5"
                      value={priceRange[0] || ''}
                      onChange={(e) => setPriceRange([e.target.value === '' ? 0 : parseInt(e.target.value), priceRange[1]])}
                      placeholder="0"
                      className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-center"
                    />
                  </div>
                  <span className="text-gray-400 mt-4">—</span>
                  <div className="flex-1">
                    <label className="text-[10px] text-gray-500 mb-0.5 block">Máx</label>
                    <input
                      type="number"
                      min={priceRange[0]}
                      max="999"
                      step="5"
                      value={priceRange[1] || ''}
                      onChange={(e) => setPriceRange([priceRange[0], e.target.value === '' ? 500 : parseInt(e.target.value)])}
                      placeholder="500"
                      className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-center"
                    />
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="500"
                  step="10"
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                  className="w-full accent-blue-600 mt-2"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>€{priceRange[0]}</span>
                  <span className="font-medium text-gray-900 dark:text-gray-200">€{priceRange[1]}</span>
                </div>
              </div>
            </div>
          </aside>

          {/* Products grid */}
          <div className="flex-1">
            {/* Sort bar */}
            <div className="mb-6 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                {hasMore ? `${visibleCount} de ${filteredProducts.length}` : filteredProducts.length} productos
              </p>
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="featured">Destacados</option>
                <option value="price-asc">Precio: menor a mayor</option>
                <option value="price-desc">Precio: mayor a menor</option>
                <option value="name">Nombre A-Z</option>
                <option value="rating">Mejor valorados</option>
              </select>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-lg">
                <svg className="mx-auto h-16 w-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">No se encontraron productos</h3>
                <p className="text-gray-500 mb-6">Prueba con otros filtros o busca algo diferente</p>
                <button onClick={clearFilters} className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                  Ver todos los productos
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 stagger-children">
                  {visibleProducts.map((product) => (
                    <div key={product.id}>
                      <ProductCard product={product} />
                    </div>
                  ))}
                </div>

                {hasMore && (
                  <div className="mt-10 text-center">
                    <div ref={sentinelRef} className="h-4" />
                    <button
                      onClick={loadMore}
                      className="px-8 py-3 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-200 hover:border-blue-500 hover:text-blue-600 transition-all"
                    >
                      Cargar más ({filteredProducts.length - visibleCount} restantes)
                    </button>
                  </div>
                )}

                {!hasMore && filteredProducts.length > PRODUCTS_PER_PAGE && (
                  <p className="mt-8 text-center text-sm text-gray-400">Has visto todos los productos</p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

// Wrap in Suspense for useSearchParams
export default function ProductosPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50">
        <MainNav />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <ProductGridSkeleton count={6} />
        </div>
      </div>
    }>
      <ProductosContent />
    </Suspense>
  );
}
