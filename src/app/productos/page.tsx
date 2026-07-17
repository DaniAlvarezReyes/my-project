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


interface FilterSidebarContentProps {
  selectedCategory: string;
  handleCategoryChange: (cat: string) => void;
  allBrands: string[];
  selectedBrands: string[];
  handleBrandToggle: (brand: string) => void;
  allSizes: string[];
  selectedSizes: string[];
  handleSizeToggle: (size: string) => void;
  priceRange: number[];
  setPriceRange: (r: number[]) => void;
  minRating: number;
  setMinRating: (r: number) => void;
  inStockOnly: boolean;
  setInStockOnly: (v: boolean) => void;
  collapsedSections: Record<string, boolean>;
  toggleSection: (key: string) => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
}

function FilterSection({ title, sectionKey, collapsed, toggle, children }: {
  title: string; sectionKey: string; collapsed?: boolean; toggle: (k: string) => void; children: React.ReactNode;
}) {
  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <button
        onClick={() => toggle(sectionKey)}
        className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-gray-50 transition-colors"
      >
        <span className="text-xs font-bold uppercase tracking-wide text-gray-700">{title}</span>
        <svg className={`w-4 h-4 text-gray-400 transition-transform ${collapsed ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {!collapsed && <div className="px-5 pb-4">{children}</div>}
    </div>
  );
}

function FilterSidebarContent({
  selectedCategory, handleCategoryChange,
  allBrands, selectedBrands, handleBrandToggle,
  allSizes, selectedSizes, handleSizeToggle,
  priceRange, setPriceRange,
  minRating, setMinRating,
  inStockOnly, setInStockOnly,
  collapsedSections, toggleSection,
}: FilterSidebarContentProps) {
  return (
    <div>
      {/* In stock toggle */}
      <div className="px-5 py-3.5 border-b border-gray-100">
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-xs font-bold uppercase tracking-wide text-gray-700">Solo en stock</span>
          <div
            onClick={() => setInStockOnly(!inStockOnly)}
            className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${inStockOnly ? 'bg-black' : 'bg-gray-200'}`}
          >
            <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${inStockOnly ? 'translate-x-5' : ''}`} />
          </div>
        </label>
      </div>

      {/* Categories */}
      <FilterSection title="Categoría" sectionKey="cat" collapsed={!!collapsedSections['cat']} toggle={toggleSection}>
        <div className="space-y-0.5">
          <button
            onClick={() => handleCategoryChange('all')}
            className={`w-full text-left px-2 py-1.5 rounded-lg text-sm transition-colors ${selectedCategory === 'all' ? 'font-semibold text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
          >
            Todos
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.id)}
              className={`w-full text-left px-2 py-1.5 rounded-lg text-sm transition-colors flex items-center justify-between ${
                selectedCategory === cat.id || selectedCategory === cat.slug
                  ? 'font-semibold text-gray-900' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {cat.name}
              {(selectedCategory === cat.id || selectedCategory === cat.slug) && (
                <div className="w-1.5 h-1.5 rounded-full bg-black flex-shrink-0" />
              )}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Sizes */}
      {allSizes.length > 0 && (
        <FilterSection title="Talla" sectionKey="size" collapsed={!!collapsedSections['size']} toggle={toggleSection}>
          <div className="flex flex-wrap gap-1.5">
            {allSizes.map(size => (
              <button
                key={size}
                onClick={() => handleSizeToggle(size)}
                className={`px-2.5 py-1 text-xs font-medium border rounded-lg transition-all ${
                  selectedSizes.includes(size)
                    ? 'bg-black text-white border-black'
                    : 'border-gray-200 text-gray-600 hover:border-gray-400'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </FilterSection>
      )}

      {/* Brands */}
      {allBrands.length > 0 && (
        <FilterSection title="Marca" sectionKey="brand" collapsed={!!collapsedSections['brand']} toggle={toggleSection}>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {allBrands.map(brand => (
              <label key={brand} className="flex items-center gap-2.5 cursor-pointer group">
                <div
                  onClick={() => handleBrandToggle(brand)}
                  className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors cursor-pointer ${
                    selectedBrands.includes(brand) ? 'bg-black border-black' : 'border-gray-300 group-hover:border-gray-500'
                  }`}
                >
                  {selectedBrands.includes(brand) && (
                    <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  )}
                </div>
                <span className="text-sm text-gray-600 group-hover:text-gray-900">{brand}</span>
              </label>
            ))}
          </div>
        </FilterSection>
      )}

      {/* Price */}
      <FilterSection title="Precio" sectionKey="price" collapsed={!!collapsedSections['price']} toggle={toggleSection}>
        <div className="space-y-3">
          <div className="relative">
            <input
              type="range"
              min="0" max="500" step="5"
              value={priceRange[1]}
              onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
              className="w-full accent-black"
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <label className="text-[10px] text-gray-400 block mb-1">Desde</label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">€</span>
                <input
                  type="number" min="0" max={priceRange[1]} step="5"
                  value={priceRange[0] || ''}
                  onChange={(e) => setPriceRange([e.target.value === '' ? 0 : parseInt(e.target.value), priceRange[1]])}
                  placeholder="0"
                  className="w-full pl-5 pr-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-black text-center"
                />
              </div>
            </div>
            <span className="text-gray-300 pt-5">—</span>
            <div className="flex-1">
              <label className="text-[10px] text-gray-400 block mb-1">Hasta</label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">€</span>
                <input
                  type="number" min={priceRange[0]} max="999" step="5"
                  value={priceRange[1] || ''}
                  onChange={(e) => setPriceRange([priceRange[0], e.target.value === '' ? 500 : parseInt(e.target.value)])}
                  placeholder="500"
                  className="w-full pl-5 pr-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-black text-center"
                />
              </div>
            </div>
          </div>
        </div>
      </FilterSection>

      {/* Rating */}
      <FilterSection title="Valoración" sectionKey="rating" collapsed={!!collapsedSections['rating']} toggle={toggleSection}>
        <div className="space-y-1.5">
          {[4, 3, 2, 0].map((r) => (
            <button
              key={r}
              onClick={() => setMinRating(r)}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors ${
                minRating === r ? 'bg-gray-100 font-medium' : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex">
                {[1,2,3,4,5].map(s => (
                  <svg key={s} className={`w-3.5 h-3.5 ${s <= r ? 'text-yellow-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-xs text-gray-600">{r > 0 ? `${r}+ estrellas` : 'Todos'}</span>
            </button>
          ))}
        </div>
      </FilterSection>
    </div>
  );
}

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
  const urlPrecioMin = parseInt(searchParams.get('precioMin') || '0', 10);
  const urlPrecioMax = parseInt(searchParams.get('precioMax') || '500', 10);
  const urlTallas = searchParams.get('tallas') || '';
  const urlValoracion = parseInt(searchParams.get('valoracion') || '0', 10);

  const [selectedCategory, setSelectedCategory] = useState(urlCategoria);
  const [selectedBrands, setSelectedBrands] = useState<string[]>(urlMarca ? [urlMarca] : []);
  const [priceRange, setPriceRange] = useState([urlPrecioMin, urlPrecioMax]);
  const [sortBy, setSortBy] = useState(urlSort);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(12);
  const PRODUCTS_PER_PAGE = 12;
  const [selectedSizes, setSelectedSizes] = useState<string[]>(urlTallas ? urlTallas.split(',').filter(Boolean) : []);
  const [minRating, setMinRating] = useState(urlValoracion);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (key: string) => setCollapsedSections(prev => ({ ...prev, [key]: !prev[key] }));

  // Sync state FROM URL whenever URL changes
  useEffect(() => {
    setSelectedCategory(urlCategoria);
    setSelectedBrands(urlMarca ? [urlMarca] : []);
    setSortBy(urlSort);
    setPriceRange([urlPrecioMin, urlPrecioMax]);
    setSelectedSizes(urlTallas ? urlTallas.split(',').filter(Boolean) : []);
    setMinRating(urlValoracion);
  }, [urlCategoria, urlMarca, urlSort, urlPrecioMin, urlPrecioMax, urlTallas, urlValoracion]);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async (retries = 2) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, color_variants:product_color_variants(color_name, color_hex, images)')
        .order('created_at', { ascending: false })
        .limit(200);

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

  // Unique sizes from loaded products
  const allSizes = useMemo(() => {
    const sizes = new Set<string>();
    products.forEach(p => (p.sizes || []).forEach((s: string) => sizes.add(s)));
    return [...sizes].sort((a, b) => {
      const order = ['XS','S','M','L','XL','XXL','36','37','38','39','40','41','42','43','44','45','46'];
      return (order.indexOf(a) ?? 99) - (order.indexOf(b) ?? 99) || a.localeCompare(b);
    });
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

    // Sizes
    if (selectedSizes.length > 0) {
      filtered = filtered.filter(p => (p.sizes || []).some((s: string) => selectedSizes.includes(s)));
    }

    // Rating
    if (minRating > 0) {
      filtered = filtered.filter(p => (p.rating || 0) >= minRating);
    }

    // In stock only
    if (inStockOnly) {
      filtered = filtered.filter(p => p.in_stock !== false && (p.stock === undefined || p.stock > 0));
    }

    // Sort
    switch (sortBy) {
      case 'price-asc': filtered.sort((a, b) => a.price - b.price); break;
      case 'price-desc': filtered.sort((a, b) => b.price - a.price); break;
      case 'name': filtered.sort((a, b) => a.name.localeCompare(b.name)); break;
      case 'rating': filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0)); break;
    }

    return filtered;
  }, [products, selectedCategory, selectedBrands, priceRange, sortBy, urlBuscar, urlFilter, urlSub, selectedSizes, minRating, inStockOnly]);

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
    const next = selectedBrands.includes(brand)
      ? selectedBrands.filter(b => b !== brand)
      : [...selectedBrands, brand];
    setSelectedBrands(next);
    updateURL({ marca: next.length === 1 ? next[0] : '' });
  };

  const handleSortChange = (newSort: string) => {
    setSortBy(newSort);
    updateURL({ sortBy: newSort });
  };

  const handlePriceRangeChange = (r: number[]) => {
    setPriceRange(r);
    updateURL({
      precioMin: r[0] > 0 ? String(r[0]) : '',
      precioMax: r[1] < 500 ? String(r[1]) : '',
    });
  };

  const handleSizeToggle = (size: string) => {
    const next = selectedSizes.includes(size)
      ? selectedSizes.filter(s => s !== size)
      : [...selectedSizes, size];
    setSelectedSizes(next);
    updateURL({ tallas: next.join(',') });
  };

  const handleMinRatingChange = (r: number) => {
    const next = minRating === r ? 0 : r;
    setMinRating(next);
    updateURL({ valoracion: next > 0 ? String(next) : '' });
  };

  const clearFilters = () => {
    setSelectedCategory('all');
    setSelectedBrands([]);
    setPriceRange([0, 500]);
    setSortBy('featured');
    setSelectedSizes([]);
    setMinRating(0);
    setInStockOnly(false);
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
  const hasActiveFilters: boolean = selectedCategory !== 'all' || selectedBrands.length > 0 || !!urlBuscar || !!urlFilter || !!urlSub || priceRange[0] > 0 || priceRange[1] < 500 || selectedSizes.length > 0 || minRating > 0 || inStockOnly;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <MainNav />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <div className="h-8 w-40 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="flex flex-col lg:flex-row gap-8 relative">
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
            {(urlPrecioMin > 0 || urlPrecioMax < 500) && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-medium">
                €{urlPrecioMin}–€{urlPrecioMax}
                <button onClick={() => updateURL({ precioMin: '', precioMax: '' })} className="ml-1 hover:text-green-900">×</button>
              </span>
            )}
            {selectedSizes.map(s => (
              <span key={s} className="inline-flex items-center gap-1 px-3 py-1 bg-orange-50 text-orange-700 rounded-full text-sm font-medium">
                T. {s}
                <button onClick={() => handleSizeToggle(s)} className="ml-1 hover:text-orange-900">×</button>
              </span>
            ))}
            {urlValoracion > 0 && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-50 text-yellow-700 rounded-full text-sm font-medium">
                {urlValoracion}+ ★
                <button onClick={() => updateURL({ valoracion: '' })} className="ml-1 hover:text-yellow-900">×</button>
              </span>
            )}
            <button onClick={clearFilters} className="text-xs text-red-600 hover:text-red-800 font-medium ml-2">
              Limpiar todo
            </button>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8 relative">
          {/* Sidebar filters */}
          {/* Mobile filter toggle */}
          <div className="lg:hidden mb-4 flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:border-gray-400 transition-colors shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" /></svg>
              Filtros
              {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-black ml-0.5" />}
            </button>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="text-xs text-red-500 hover:text-red-700 font-medium">
                Limpiar filtros
              </button>
            )}
          </div>

          {/* Mobile filter overlay */}
          {sidebarOpen && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
              <div className="absolute inset-y-0 left-0 w-80 max-w-full bg-white shadow-xl overflow-y-auto">
                <div className="flex items-center justify-between p-4 border-b">
                  <h2 className="text-base font-bold">Filtros</h2>
                  <button onClick={() => setSidebarOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                <FilterSidebarContent
                  selectedCategory={selectedCategory}
                  handleCategoryChange={handleCategoryChange}
                  allBrands={allBrands}
                  selectedBrands={selectedBrands}
                  handleBrandToggle={handleBrandToggle}
                  allSizes={allSizes}
                  selectedSizes={selectedSizes}
                  handleSizeToggle={handleSizeToggle}
                  priceRange={priceRange}
                  setPriceRange={handlePriceRangeChange}
                  minRating={minRating}
                  setMinRating={handleMinRatingChange}
                  inStockOnly={inStockOnly}
                  setInStockOnly={setInStockOnly}
                  collapsedSections={collapsedSections}
                  toggleSection={toggleSection}
                  clearFilters={clearFilters}
                  hasActiveFilters={hasActiveFilters}
                />
                <div className="p-4 border-t">
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="w-full py-3 bg-black text-white font-bold text-sm rounded-xl"
                  >
                    Ver {filteredProducts.length} productos
                  </button>
                </div>
              </div>
            </div>
          )}

          <aside className="hidden lg:block lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-xl border border-gray-100 sticky top-20 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h2 className="text-sm font-bold uppercase tracking-wide text-gray-900">Filtros</h2>
                {hasActiveFilters && (
                  <button onClick={clearFilters} className="text-xs text-red-500 hover:text-red-700 font-medium">Limpiar</button>
                )}
              </div>
              <FilterSidebarContent
                selectedCategory={selectedCategory}
                handleCategoryChange={handleCategoryChange}
                allBrands={allBrands}
                selectedBrands={selectedBrands}
                handleBrandToggle={handleBrandToggle}
                allSizes={allSizes}
                selectedSizes={selectedSizes}
                handleSizeToggle={handleSizeToggle}
                priceRange={priceRange}
                setPriceRange={setPriceRange}
                minRating={minRating}
                setMinRating={setMinRating}
                inStockOnly={inStockOnly}
                setInStockOnly={setInStockOnly}
                collapsedSections={collapsedSections}
                toggleSection={toggleSection}
                clearFilters={clearFilters}
                hasActiveFilters={hasActiveFilters}
              />
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
