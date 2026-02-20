'use client';
import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login?redirect=/admin');
    }
    // Aquí podrías verificar si el usuario es admin
  }, [isAuthenticated, router]);

  if (!isAuthenticated) return null;

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: '📊' },
    { name: 'Productos', href: '/admin/productos', icon: '📦' },
    { name: 'Pedidos', href: '/admin/pedidos', icon: '🛒' },
    { name: 'Usuarios', href: '/admin/usuarios', icon: '👥' },
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
