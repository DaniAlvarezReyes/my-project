'use client';
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MainNav } from '@/components/MainNav';
import { Footer } from '@/components/Footer';
import { useAuth } from '@/context/AuthContext';

export default function PedidosPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return null;
  }

  // Por ahora, datos ficticios hasta conectar con Supabase
  const orders = [];

  return (
    <div className="min-h-screen bg-gray-50">
      <MainNav />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Mis Pedidos</h1>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <nav className="bg-white rounded-lg shadow-md p-4 space-y-2">
              <Link
                href="/cuenta"
                className="block px-4 py-2 rounded-lg hover:bg-gray-50 text-gray-700"
              >
                Mi Perfil
              </Link>
              <Link
                href="/cuenta/pedidos"
                className="block px-4 py-2 rounded-lg bg-blue-50 text-blue-600 font-medium"
              >
                Mis Pedidos
              </Link>
              <Link
                href="/cuenta/direcciones"
                className="block px-4 py-2 rounded-lg hover:bg-gray-50 text-gray-700"
              >
                Direcciones
              </Link>
              <Link
                href="/cuenta/favoritos"
                className="block px-4 py-2 rounded-lg hover:bg-gray-50 text-gray-700"
              >
                Favoritos
              </Link>
            </nav>
          </aside>

          {/* Lista de pedidos */}
          <div className="lg:col-span-3">
            {orders.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <svg className="mx-auto h-24 w-24 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                  No tienes pedidos todavía
                </h2>
                <p className="text-gray-600 mb-6">
                  Cuando realices una compra, aparecerá aquí
                </p>
                <Link href="/productos">
                  <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium">
                    Explorar Productos
                  </button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Aquí irían los pedidos cuando se conecte Supabase */}
              </div>
            )}
          </div>
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
