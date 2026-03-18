'use client';
import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // FIX: Esperar a que AuthContext termine de cargar en vez de un setTimeout arbitrario
    if (isLoading) return; // Aún cargando, no hacer nada todavía

    const checkAdmin = async () => {
      if (!isAuthenticated || !user) {
        console.log('No autenticado, redirigiendo...');
        router.push('/auth/login?redirect=/admin');
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();

        console.log('Admin check:', { 
          userId: user.id, 
          email: user.email, 
          role: data?.role,
          error: error?.message 
        });

        if (data?.role === 'admin') {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
          // Redirect handled below
          router.push('/');
        }
      } catch (err) {
        console.error('Error checking admin:', err);
        setIsAdmin(false);
        router.push('/');
      } finally {
        setChecking(false);
      }
    };

    checkAdmin();
  }, [isLoading, isAuthenticated, user?.id]);

  if (isLoading || checking || isAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: '📊' },
    { name: 'Productos', href: '/admin/productos', icon: '📦' },
    { name: 'Pedidos', href: '/admin/pedidos', icon: '🛒' },
    { name: 'Usuarios', href: '/admin/usuarios', icon: '👥' },
    { name: 'Reseñas', href: '/admin/resenas', icon: '⭐' },
    { name: 'Devoluciones', href: '/admin/devoluciones', icon: '↩️' },
    { name: 'Cupones', href: '/admin/cupones', icon: '🎟️' },
    { name: 'Newsletter', href: '/admin/newsletter', icon: '📧' },
    { name: 'Notificaciones', href: '/admin/notificaciones', icon: '🔔' },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold">
                A
              </div>
              <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">
                ADMIN
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-gray-600 hover:text-gray-900">
                Ver tienda →
              </Link>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-700">{user?.name}</span>
                <button
                  onClick={logout}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  Salir
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="w-64 flex-shrink-0">
            <nav className="bg-white rounded-lg shadow p-4 space-y-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive(item.href)
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className="font-medium">{item.name}</span>
                </Link>
              ))}
            </nav>
          </aside>

          {/* Main content */}
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}
