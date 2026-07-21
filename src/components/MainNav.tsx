'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useFavorites } from '@/context/FavoritesContext';
import { useTheme } from '@/context/ThemeContext';
import { usePathname } from 'next/navigation';
import { categories } from '@/data/categories';
import SearchAutocomplete from '@/components/SearchAutocomplete';
import { NotificationBell } from '@/components/NotificationBell';

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
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mobileSubmenu, setMobileSubmenu] = useState<string | null>(null);
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { itemCount, syncing } = useCart();
  const { favorites } = useFavorites();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const userMenuRef = useRef<HTMLDivElement>(null);
  const dropdownTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => { setMobileOpen(false); setSearchOpen(false); setActiveDropdown(null); }, [pathname]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    };
    if (userMenuOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [userMenuOpen]);

  const handleDropdownEnter = useCallback((key: string) => {
    if (dropdownTimeout.current) clearTimeout(dropdownTimeout.current);
    setActiveDropdown(key);
  }, []);

  const handleDropdownLeave = useCallback(() => {
    dropdownTimeout.current = setTimeout(() => setActiveDropdown(null), 200);
  }, []);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-neutral-100 dark:border-neutral-800">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-10">
          <div className="flex items-center justify-between h-14">
            {/* Left: hamburger + nav links */}
            <div className="flex items-center gap-8">
              <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden p-1 text-neutral-800 dark:text-neutral-200">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileOpen
                    ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                    : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 8h16M4 16h16" />
                  }
                </svg>
              </button>

              <div className="hidden lg:flex items-center gap-1">
                {/* Novedades - simple link */}
                <Link href="/productos?filter=nuevos" className="px-3 py-2 text-[12px] font-semibold text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors uppercase tracking-[0.12em]">
                  Novedades
                </Link>

                {/* Tienda - dropdown */}
                <div
                  className="relative"
                  onMouseEnter={() => handleDropdownEnter('tienda')}
                  onMouseLeave={handleDropdownLeave}
                >
                  <Link href="/productos" className="flex items-center gap-1 px-3 py-2 text-[12px] font-semibold text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors uppercase tracking-[0.12em]">
                    Tienda
                    <svg className={`w-3 h-3 transition-transform duration-200 ${activeDropdown === 'tienda' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </Link>

                  {activeDropdown === 'tienda' && (
                    <div className="absolute top-full left-0 mt-0 pt-2">
                      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xl w-[560px] p-8 animate-fadeIn">
                        <div className="grid grid-cols-3 gap-10">
                          {/* Categorías */}
                          <div>
                            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400 mb-4">Categorías</h4>
                            <div className="space-y-2.5">
                              {categories.map(cat => (
                                <Link key={cat.id} href={`/productos?categoria=${cat.slug}`} className="block text-[13px] text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors">
                                  {cat.name}
                                </Link>
                              ))}
                            </div>
                          </div>

                          {/* Marcas */}
                          <div>
                            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400 mb-4">Marcas</h4>
                            <div className="space-y-2.5">
                              {brands.map(b => (
                                <Link key={b.slug} href={`/productos?marca=${encodeURIComponent(b.slug)}`} className="block text-[13px] text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors">
                                  {b.name}
                                </Link>
                              ))}
                            </div>
                          </div>

                          {/* Quick links */}
                          <div>
                            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400 mb-4">Descubrir</h4>
                            <div className="space-y-2.5">
                              <Link href="/productos" className="block text-[13px] text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors">Todos los productos</Link>
                              <Link href="/productos?filter=nuevos" className="block text-[13px] text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors">Novedades</Link>
                              <Link href="/productos?filter=ofertas" className="block text-[13px] text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors">Ofertas</Link>
                              <Link href="/productos?sortBy=rating" className="block text-[13px] text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors">Más vendidos</Link>
                              <Link href="/comparar" className="block text-[13px] text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors">Comparador</Link>
                            </div>
                          </div>
                        </div>

                        {/* Featured banner inside dropdown */}
                        <div className="mt-8 pt-6 border-t border-neutral-100 dark:border-neutral-800">
                          <Link href="/productos?filter=ofertas" className="flex items-center justify-between group">
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-500 mb-1">Oferta limitada</p>
                              <p className="text-sm font-bold text-neutral-900 dark:text-white">Hasta -40% en modelos seleccionados</p>
                            </div>
                            <svg className="w-5 h-5 text-neutral-400 group-hover:text-black dark:group-hover:text-white group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Categorías - dropdown */}
                <div
                  className="relative"
                  onMouseEnter={() => handleDropdownEnter('categorias')}
                  onMouseLeave={handleDropdownLeave}
                >
                  <Link href="/categorias" className="flex items-center gap-1 px-3 py-2 text-[12px] font-semibold text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors uppercase tracking-[0.12em]">
                    Categorías
                    <svg className={`w-3 h-3 transition-transform duration-200 ${activeDropdown === 'categorias' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </Link>

                  {activeDropdown === 'categorias' && (
                    <div className="absolute top-full left-0 mt-0 pt-2">
                      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xl w-[480px] p-8 animate-fadeIn">
                        <div className="grid grid-cols-2 gap-6">
                          {categories.map(cat => (
                            <div key={cat.id}>
                              <Link href={`/productos?categoria=${cat.slug}`} className="flex items-center gap-3 group mb-2">
                                <div className="w-10 h-10 bg-neutral-100 dark:bg-neutral-800 overflow-hidden flex-shrink-0">
                                  <img src={cat.image} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                                </div>
                                <span className="text-[13px] font-bold text-neutral-900 dark:text-white group-hover:underline underline-offset-2">{cat.name}</span>
                              </Link>
                              {cat.subcategories && cat.subcategories.length > 0 && (
                                <div className="ml-[52px] space-y-1.5">
                                  {cat.subcategories.map(sub => (
                                    <Link key={sub.id} href={`/productos?categoria=${cat.slug}&sub=${sub.slug}`} className="block text-[12px] text-neutral-400 hover:text-black dark:hover:text-white transition-colors">
                                      {sub.name}
                                    </Link>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Ofertas - simple link */}
                <Link href="/productos?filter=ofertas" className="px-3 py-2 text-[12px] font-semibold text-red-500 hover:text-red-600 transition-colors uppercase tracking-[0.12em]">
                  Ofertas
                </Link>

                {/* Contacto - simple link */}
                <Link href="/contacto" className="px-3 py-2 text-[12px] font-semibold text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors uppercase tracking-[0.12em]">
                  Contacto
                </Link>
              </div>
            </div>

            {/* Center: Logo */}
            <Link href="/" className="absolute left-1/2 -translate-x-1/2">
              <span className="text-lg font-black tracking-tight text-black dark:text-white uppercase">
                Sneakers Pro
              </span>
            </Link>

            {/* Right: actions */}
            <div className="flex items-center gap-3">
              <button onClick={() => setSearchOpen(!searchOpen)} className="p-1.5 text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors">
                <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </button>

              <button onClick={toggleTheme} className="p-1.5 text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white hidden sm:block transition-colors">
                {theme === 'dark' ? (
                  <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                ) : (
                  <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                )}
              </button>

              {/* Notificaciones */}
              <NotificationBell />

              {/* User */}
              {isAuthenticated ? (
                <div className="relative" ref={userMenuRef}>
                  <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="p-1.5 text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors">
                    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  </button>
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-3 w-56 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xl py-2 animate-fadeIn">
                      <div className="px-4 py-2 border-b border-neutral-100 dark:border-neutral-800">
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">{user?.name}</p>
                        <p className="text-[11px] text-neutral-500 truncate">{user?.email}</p>
                      </div>
                      {isAdmin && <Link href="/admin" className="block px-4 py-2.5 text-[13px] text-neutral-600 hover:text-black dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors" onClick={() => setUserMenuOpen(false)}>Panel Admin</Link>}
                      <Link href="/cuenta" className="block px-4 py-2.5 text-[13px] text-neutral-600 hover:text-black dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors" onClick={() => setUserMenuOpen(false)}>Mi Cuenta</Link>
                      <Link href="/cuenta/pedidos" className="block px-4 py-2.5 text-[13px] text-neutral-600 hover:text-black dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors" onClick={() => setUserMenuOpen(false)}>Mis Pedidos</Link>
                      <Link href="/cuenta/favoritos" className="block px-4 py-2.5 text-[13px] text-neutral-600 hover:text-black dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors" onClick={() => setUserMenuOpen(false)}>Favoritos</Link>
                      <div className="border-t border-neutral-100 dark:border-neutral-800 mt-1 pt-1">
                        <button onClick={() => { logout(); setUserMenuOpen(false); }} className="block w-full text-left px-4 py-2.5 text-[13px] text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">Cerrar Sesión</button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link href="/auth/login" className="p-1.5 text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors">
                  <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </Link>
              )}

              <Link href="/cuenta/favoritos" className="relative p-1.5 text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white hidden sm:block transition-colors">
                <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                {favorites.length > 0 && <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-black dark:bg-white text-white dark:text-black text-[8px] font-bold rounded-full flex items-center justify-center">{favorites.length}</span>}
              </Link>

              <Link href="/carrito" className="relative p-1.5 text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors">
                <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                {itemCount > 0 && <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-black dark:bg-white text-white dark:text-black text-[8px] font-bold rounded-full flex items-center justify-center">{itemCount}</span>}
                {syncing && <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-blue-500 rounded-full animate-pulse" title="Sincronizando carrito..." />}
              </Link>
            </div>
          </div>
        </div>

        {/* Search overlay */}
        {searchOpen && (
          <div className="border-t border-neutral-100 dark:border-neutral-800 bg-white dark:bg-black animate-fadeIn">
            <div className="max-w-[1440px] mx-auto px-6 lg:px-10 py-4">
              <SearchAutocomplete />
            </div>
          </div>
        )}
      </nav>

      <div className="h-14" />

      {/* ─── MOBILE MENU ─── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-white dark:bg-black pt-14 animate-fadeIn overflow-y-auto">
          <div className="px-6 py-8 space-y-1">
            <Link href="/" className="block py-3 text-2xl font-black text-black dark:text-white uppercase tracking-tight" onClick={() => setMobileOpen(false)}>
              Inicio
            </Link>
            <Link href="/productos?filter=nuevos" className="block py-3 text-2xl font-black text-black dark:text-white uppercase tracking-tight" onClick={() => setMobileOpen(false)}>
              Novedades
            </Link>

            {/* Tienda accordion */}
            <div>
              <button onClick={() => setMobileSubmenu(mobileSubmenu === 'tienda' ? null : 'tienda')} className="flex items-center justify-between w-full py-3">
                <span className="text-2xl font-black text-black dark:text-white uppercase tracking-tight">Tienda</span>
                <svg className={`w-5 h-5 text-neutral-400 transition-transform ${mobileSubmenu === 'tienda' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" /></svg>
              </button>
              {mobileSubmenu === 'tienda' && (
                <div className="pl-4 pb-4 space-y-4 border-l border-neutral-200 dark:border-neutral-800 ml-2 animate-fadeIn">
                  <Link href="/productos" className="block text-sm text-neutral-500 hover:text-black dark:hover:text-white" onClick={() => setMobileOpen(false)}>Todos los productos</Link>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-300 dark:text-neutral-600 mb-2">Marcas</p>
                    {brands.map(b => (
                      <Link key={b.slug} href={`/productos?marca=${encodeURIComponent(b.slug)}`} className="block py-1.5 text-sm text-neutral-500 hover:text-black dark:hover:text-white" onClick={() => setMobileOpen(false)}>{b.name}</Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Categorías accordion */}
            <div>
              <button onClick={() => setMobileSubmenu(mobileSubmenu === 'cat' ? null : 'cat')} className="flex items-center justify-between w-full py-3">
                <span className="text-2xl font-black text-black dark:text-white uppercase tracking-tight">Categorías</span>
                <svg className={`w-5 h-5 text-neutral-400 transition-transform ${mobileSubmenu === 'cat' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" /></svg>
              </button>
              {mobileSubmenu === 'cat' && (
                <div className="pl-4 pb-4 space-y-1 border-l border-neutral-200 dark:border-neutral-800 ml-2 animate-fadeIn">
                  {categories.map(cat => (
                    <div key={cat.id}>
                      <Link href={`/productos?categoria=${cat.slug}`} className="block py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:text-black dark:hover:text-white" onClick={() => setMobileOpen(false)}>{cat.name}</Link>
                      {cat.subcategories?.map(sub => (
                        <Link key={sub.id} href={`/productos?categoria=${cat.slug}&sub=${sub.slug}`} className="block py-1 pl-4 text-xs text-neutral-400 hover:text-black dark:hover:text-white" onClick={() => setMobileOpen(false)}>{sub.name}</Link>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Link href="/productos?filter=ofertas" className="block py-3 text-2xl font-black text-red-500 uppercase tracking-tight" onClick={() => setMobileOpen(false)}>
              Ofertas
            </Link>
            <Link href="/contacto" className="block py-3 text-2xl font-black text-black dark:text-white uppercase tracking-tight" onClick={() => setMobileOpen(false)}>
              Contacto
            </Link>

            {/* Account section */}
            <div className="pt-6 mt-4 border-t border-neutral-200 dark:border-neutral-800 space-y-3">
              <Link href="/cuenta/favoritos" className="flex items-center gap-3 text-sm text-neutral-500" onClick={() => setMobileOpen(false)}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                Favoritos {favorites.length > 0 && `(${favorites.length})`}
              </Link>
              {isAuthenticated ? (
                <>
                  {isAdmin && <Link href="/admin" className="block text-sm text-neutral-500" onClick={() => setMobileOpen(false)}>Panel Admin</Link>}
                  <Link href="/cuenta" className="block text-sm text-neutral-500" onClick={() => setMobileOpen(false)}>Mi Cuenta</Link>
                  <Link href="/cuenta/pedidos" className="block text-sm text-neutral-500" onClick={() => setMobileOpen(false)}>Mis Pedidos</Link>
                  <button onClick={() => { logout(); setMobileOpen(false); }} className="text-sm text-red-500">Cerrar Sesión</button>
                </>
              ) : (
                <Link href="/auth/login" className="inline-block mt-2 bg-black dark:bg-white text-white dark:text-black px-8 py-3 text-xs font-bold uppercase tracking-widest" onClick={() => setMobileOpen(false)}>
                  Iniciar Sesión
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
