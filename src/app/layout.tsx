import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { ToastProvider } from '@/context/ToastContext';
import { FavoritesProvider } from '@/context/FavoritesContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Sneakers Pro - Las mejores zapatillas online',
  description: 'Compra las mejores zapatillas deportivas y casuales',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <AuthProvider>
          <CartProvider>
            <FavoritesProvider>
              <ToastProvider>
                {children}
              </ToastProvider>
            </FavoritesProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
