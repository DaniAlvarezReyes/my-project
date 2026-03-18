'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useFavorites } from '@/context/FavoritesContext';
import { usePathname } from 'next/navigation';
import { categories } from '@/data/categories';
import SearchAutocomplete from '@/components/SearchAutocomplete';
import { useTheme } from '@/context/ThemeContext';

// Icons as small components for cleanliness
const ChevronDown = () => (
  <svg className="w-3.5 h-3.5 ml-1 transition-transform group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const brands = [
  { name: 'Nike', slug: 'Nike' },
  { name: 'Adidas', slug: 'Adidas' },
  { name: 'New Balance', slug: 'New Balance' },
  { name: 'Puma', slug: 'Puma' },
  { name: 'Asics', slug: 'Asics' },
  { name: 'Reebok', slug: 'Reebok' },
  { name: 'Vans', slug: 'Vans' },
  { name: 'Converse', slug: 'Converse' },
];

export const MainNav = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mobileSubmenu, setMobileSubmenu] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { itemCount } = useCart();
  const { favorites } = useFavorites();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const userMenuRef = useRef<HTMLDivElement>(null);
  const dropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isActive = (href: string) => pathname === href;

  // Close user menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    if (userMenuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userMenuOpen]);

  // Close dropdown on route change
  useEffect(() => {
    setActiveDropdown(null);
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleDropdownEnter = useCallback((key: string) => {
    if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current);
    setActiveDropdown(key);
  }, []);

  const handleDropdownLeave = useCallback(() => {
    dropdownTimeoutRef.current = setTimeout(() => setActiveDropdown(null), 150);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/productos?buscar=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
  };

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-md sticky top-0 z-50 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 flex-shrink-0">
            <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.8 7.4c.6-.8 1-1.8 1-2.9 0-2.8-2.2-5-5-5-1.1 0-2.1.4-2.9 1L12 2.3 10.1.6C9.3.4 8.4 0 7.5 0 4.7 0 2.5 2.2 2.5 5c0 1.1.3 2.1 1 2.9L12 17.4l8.8-10z"/>
            </svg>
            <span className="text-xl font-bold text-gray-900 dark:text-white">Sneakers Pro</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            {/* Inicio */}
            <Link
              href="/"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive('/') ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
              }`}
            >
              Inicio
            </Link>

            {/* Productos - Mega dropdown */}
            <div
              className="relative group"
              onMouseEnter={() => handleDropdownEnter('productos')}
              onMouseLeave={handleDropdownLeave}
            >
              <Link
                href="/productos"
                className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname.startsWith('/productos') ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                }`}
              >
                Productos <ChevronDown />
              </Link>

              {activeDropdown === 'productos' && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-[520px] bg-white rounded-xl shadow-2xl border border-gray-100 p-5 animate-fadeIn">
                  <div className="grid grid-cols-2 gap-6">
                    {/* Marcas */}
                    <div>
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Marcas</h3>
                      <div className="grid grid-cols-2 gap-1">
                        {brands.map((brand) => (
                          <Link
                            key={brand.slug}
                            href={`/productos?marca=${encodeURIComponent(brand.slug)}`}
                            className="px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors"
                          >
                            {brand.name}
                          </Link>
                        ))}
                      </div>
                    </div>

                    {/* Quick links */}
                    <div>
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Descubrir</h3>
                      <div className="space-y-1">
                        <Link href="/productos" className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors">
                          <span className="w-2 h-2 bg-blue-500 rounded-full" />
                          Todos los productos
                        </Link>
                        <Link href="/productos?filter=nuevos" className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors">
                          <span className="w-2 h-2 bg-green-500 rounded-full" />
                          Novedades
                        </Link>
                        <Link href="/productos?filter=ofertas" className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors">
                          <span className="w-2 h-2 bg-red-500 rounded-full" />
                          Ofertas
                        </Link>
                        <Link href="/productos?sortBy=rating" className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors">
                          <span className="w-2 h-2 bg-amber-500 rounded-full" />
                          Más vendidos
                        </Link>
                        <Link href="/comparar" className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors">
                          <span className="w-2 h-2 bg-purple-500 rounded-full" />
                          Comparador
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Categorías - Mega dropdown */}
            <div
              className="relative group"
              onMouseEnter={() => handleDropdownEnter('categorias')}
              onMouseLeave={handleDropdownLeave}
            >
              <Link
                href="/categorias"
                className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname.startsWith('/categorias') ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                }`}
              >
                Categorías <ChevronDown />
              </Link>

              {activeDropdown === 'categorias' && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-[640px] bg-white rounded-xl shadow-2xl border border-gray-100 p-5 animate-fadeIn">
                  <div className="grid grid-cols-3 gap-4">
                    {categories.map((cat) => (
                      <div key={cat.id}>
                        <Link
                          href={`/productos?categoria=${cat.slug}`}
                          className="flex items-center gap-2 font-semibold text-sm text-gray-900 hover:text-blue-600 mb-2 transition-colors"
                        >
                          <div className="w-8 h-8 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                            <img src={cat.image} alt="" className="w-full h-full object-cover" />
                          </div>
                          {cat.name}
                        </Link>
                        {cat.subcategories && cat.subcategories.length > 0 && (
                          <div className="ml-10 space-y-0.5">
                            {cat.subcategories.map((sub) => (
                              <Link
                                key={sub.id}
                                href={`/productos?categoria=${cat.slug}&sub=${sub.slug}`}
                                className="block text-sm text-gray-500 hover:text-blue-600 py-1 transition-colors"
                              >
                                {sub.name}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <Link
                      href="/categorias"
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Ver todas las categorías →
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Ofertas */}
            <Link
              href="/productos?filter=ofertas"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname.includes('ofertas') ? 'text-red-600 bg-red-50' : 'text-red-600 hover:bg-red-50'
              }`}
            >
              <span className="flex items-center gap-1">
                🔥 Ofertas
              </span>
            </Link>

            {/* Contacto */}
            <Link
              href="/contacto"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive('/contacto') ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
              }`}
            >
              Contacto
            </Link>
          </div>

          {/* Search + Actions */}
          <div className="hidden lg:flex items-center space-x-3">
            {/* Search */}
            <SearchAutocomplete />

            {/* Dark mode toggle */}
            <button onClick={toggleTheme} className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors" aria-label="Cambiar tema">
              {theme === 'dark' ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
              )}
            </button>

            {/* Favorites */}
            <Link href="/cuenta/favoritos" className="relative p-2 text-gray-500 hover:text-red-500 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {favorites.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {favorites.length}
                </span>
              )}
            </Link>

            {/* Cart */}
            <Link href="/carrito" className="relative p-2 text-gray-500 hover:text-blue-600 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-blue-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Link>

            {/* User */}
            {isAuthenticated ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-2 pl-2 pr-3 py-1.5 rounded-full hover:bg-gray-50 transition-colors"
                >
                  <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="text-sm font-medium text-gray-700 max-w-[80px] truncate">{user?.name}</span>
                  <svg className={`w-3 h-3 text-gray-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl py-1 z-50 border border-gray-100 animate-scaleIn origin-top-right">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                      <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                    </div>

                    {isAdmin && (
                      <Link href="/admin" className="flex items-center gap-2 px-4 py-2.5 text-sm text-purple-600 hover:bg-purple-50 font-medium" onClick={() => setUserMenuOpen(false)}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        Panel Admin
                      </Link>
                    )}

                    <Link href="/cuenta" className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setUserMenuOpen(false)}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      Mi Cuenta
                    </Link>
                    <Link href="/cuenta/pedidos" className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setUserMenuOpen(false)}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                      Mis Pedidos
                    </Link>
                    <Link href="/cuenta/favoritos" className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setUserMenuOpen(false)}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                      Favoritos
                    </Link>
                    <Link href="/cuenta/direcciones" className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setUserMenuOpen(false)}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
                      Direcciones
                    </Link>

                    <div className="border-t border-gray-100 mt-1 pt-1">
                      <button onClick={handleLogout} className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                        Cerrar Sesión
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/auth/login"
                className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Iniciar Sesión
              </Link>
            )}
          </div>

          {/* Mobile: cart + menu toggle */}
          <div className="flex lg:hidden items-center space-x-2">
            <Link href="/carrito" className="relative p-2 text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {itemCount > 0 && (
                <span className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">{itemCount}</span>
              )}
            </Link>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-gray-700">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t bg-white animate-slideUp">
          <div className="px-4 py-3">
            {/* Mobile search */}
            <form onSubmit={handleSearch} className="relative mb-4">
              <input
                type="text"
                placeholder="Buscar zapatillas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-4 pr-10 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button type="submit" className="absolute right-3 top-3 text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </form>

            <div className="space-y-1">
              <Link href="/" className="block px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg" onClick={() => setMobileMenuOpen(false)}>
                Inicio
              </Link>

              <Link href="/productos" className="block px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg" onClick={() => setMobileMenuOpen(false)}>
                Todos los Productos
              </Link>

              {/* Mobile Categorías accordion */}
              <div>
                <button
                  onClick={() => setMobileSubmenu(mobileSubmenu === 'cat' ? null : 'cat')}
                  className="flex items-center justify-between w-full px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
                >
                  Categorías
                  <svg className={`w-4 h-4 transition-transform ${mobileSubmenu === 'cat' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {mobileSubmenu === 'cat' && (
                  <div className="ml-4 mt-1 space-y-0.5 border-l-2 border-gray-100 pl-3">
                    {categories.map((cat) => (
                      <div key={cat.id}>
                        <Link
                          href={`/productos?categoria=${cat.slug}`}
                          className="block px-3 py-2 text-sm font-medium text-gray-800 hover:text-blue-600"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {cat.name}
                        </Link>
                        {cat.subcategories?.map((sub) => (
                          <Link
                            key={sub.id}
                            href={`/productos?categoria=${cat.slug}&sub=${sub.slug}`}
                            className="block px-3 py-1.5 text-sm text-gray-500 hover:text-blue-600 ml-3"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            {sub.name}
                          </Link>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Mobile Marcas accordion */}
              <div>
                <button
                  onClick={() => setMobileSubmenu(mobileSubmenu === 'brand' ? null : 'brand')}
                  className="flex items-center justify-between w-full px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
                >
                  Marcas
                  <svg className={`w-4 h-4 transition-transform ${mobileSubmenu === 'brand' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {mobileSubmenu === 'brand' && (
                  <div className="ml-4 mt-1 space-y-0.5 border-l-2 border-gray-100 pl-3">
                    {brands.map((brand) => (
                      <Link
                        key={brand.slug}
                        href={`/productos?marca=${encodeURIComponent(brand.slug)}`}
                        className="block px-3 py-2 text-sm text-gray-600 hover:text-blue-600"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {brand.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <Link href="/productos?filter=ofertas" className="block px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg" onClick={() => setMobileMenuOpen(false)}>
                🔥 Ofertas
              </Link>

              <Link href="/contacto" className="block px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg" onClick={() => setMobileMenuOpen(false)}>
                Contacto
              </Link>

              <div className="border-t border-gray-100 mt-2 pt-2">
                <Link href="/cuenta/favoritos" className="flex items-center gap-2 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg" onClick={() => setMobileMenuOpen(false)}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                  Favoritos {favorites.length > 0 && <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">{favorites.length}</span>}
                </Link>

                {isAuthenticated ? (
                  <>
                    {isAdmin && (
                      <Link href="/admin" className="flex items-center gap-2 px-3 py-2.5 text-sm text-purple-600 font-medium hover:bg-purple-50 rounded-lg" onClick={() => setMobileMenuOpen(false)}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        Panel Admin
                      </Link>
                    )}
                    <Link href="/cuenta" className="flex items-center gap-2 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg" onClick={() => setMobileMenuOpen(false)}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      Mi Cuenta
                    </Link>
                    <Link href="/cuenta/pedidos" className="flex items-center gap-2 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg" onClick={() => setMobileMenuOpen(false)}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                      Mis Pedidos
                    </Link>
                    <button onClick={() => { logout(); setMobileMenuOpen(false); }} className="flex items-center gap-2 w-full text-left px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                      Cerrar Sesión
                    </button>
                  </>
                ) : (
                  <div className="px-3 pt-2">
                    <Link
                      href="/auth/login"
                      className="block w-full text-center bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Iniciar Sesión
                    </Link>
                    <Link
                      href="/auth/register"
                      className="block w-full text-center text-blue-600 px-4 py-2 text-sm font-medium mt-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Crear cuenta gratis
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};
