'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import LoyaltyCard from '@/components/LoyaltyPoints';

const links = [
  { href: '/cuenta', label: 'Mi Perfil', icon: '👤' },
  { href: '/cuenta/pedidos', label: 'Mis Pedidos', icon: '📦' },
  { href: '/cuenta/direcciones', label: 'Direcciones', icon: '📍' },
  { href: '/cuenta/favoritos', label: 'Favoritos', icon: '❤️' },
  { href: '/cuenta/devoluciones', label: 'Devoluciones', icon: '↩️' },
];

export default function AccountSidebar() {
  const pathname = usePathname();

  return (
    <aside className="lg:col-span-1">
      <nav className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 space-y-1">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              pathname === link.href
                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <span>{link.icon}</span>
            {link.label}
          </Link>
        ))}
      </nav>
      <div className="mt-4">
        <LoyaltyCard />
      </div>
    </aside>
  );
}
