'use client';
import AccountSidebar from '@/components/AccountSidebar';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MainNav } from '@/components/MainNav';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/Button';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useFavorites } from '@/context/FavoritesContext';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/context/ToastContext';
import ShareWishlist from '@/components/ShareWishlist';

export default function FavoritosPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { addItem } = useCart();
  const { favorites, toggleFavorite, loading: favLoading } = useFavorites();
  const router = useRouter();
  const toast = useToast();
  const [favoriteProducts, setFavoriteProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.push('/auth/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    const loadFavoriteProducts = async () => {
      if (favorites.length === 0) {
        setFavoriteProducts([]);
        setLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .in('id', favorites);
        if (error) throw error;
        setFavoriteProducts(data || []);
      } catch (err) {
        console.error('Error loading favorite products:', err);
      } finally {
        setLoading(false);
      }
    };
    if (!favLoading) loadFavoriteProducts();
  }, [favorites, favLoading]);

  const handleAddToCart = (product: any) => {
    if ((product.sizes?.length > 0) || (product.colors?.length > 0)) {
      router.push(`/productos/${product.id}`);
      return;
    }
    addItem(product);
    toast.success(`${product.name} añadido al carrito`);
  };

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <MainNav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Mis Favoritos</h1>
          <ShareWishlist favorites={favorites} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <AccountSidebar />
          <div className="lg:col-span-3">
            {loading || favLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Cargando favoritos...</p>
              </div>
            ) : favoriteProducts.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <svg className="mx-auto h-24 w-24 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">No tienes favoritos todavía</h2>
                <p className="text-gray-600 mb-6">Guarda tus productos favoritos para verlos más tarde</p>
                <Link href="/productos"><Button variant="primary">Explorar Productos</Button></Link>
              </div>
            ) : (
              <>
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                  <h2 className="text-xl font-semibold">{favoriteProducts.length} {favoriteProducts.length === 1 ? 'producto' : 'productos'}</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {favoriteProducts.map((product) => (
                    <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                      <div className="relative aspect-square overflow-hidden bg-gray-100">
                        <Link href={`/productos/${product.id}`}>
                          <img src={product.images?.[0] || 'https://via.placeholder.com/400'} alt={product.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                        </Link>
                        {product.badge && <span className="absolute top-3 left-3 px-3 py-1 text-xs font-bold text-white rounded-full bg-blue-600">{product.badge}</span>}
                      </div>
                      <div className="p-4">
                        <p className="text-sm text-gray-600 mb-1">{product.brand}</p>
                        <Link href={`/productos/${product.id}`}><h3 className="font-semibold text-gray-900 mb-2 hover:text-blue-600 line-clamp-2">{product.name}</h3></Link>
                        <div className="flex items-baseline gap-2 mb-4">
                          <span className="text-xl font-bold text-gray-900">€{product.price?.toFixed(2)}</span>
                          {product.original_price && <span className="text-sm text-gray-500 line-through">€{product.original_price.toFixed(2)}</span>}
                        </div>
                        <div className="flex gap-2">
                          <Button variant="primary" size="sm" fullWidth onClick={() => handleAddToCart(product)}>Añadir al Carrito</Button>
                          <button onClick={() => toggleFavorite(product.id)} className="px-3 py-2 border-2 border-red-300 rounded-lg hover:border-red-600 hover:bg-red-50 text-red-600 transition-colors" title="Eliminar de favoritos">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" /></svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
