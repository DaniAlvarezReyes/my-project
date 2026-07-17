import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { ToastProvider } from '@/context/ToastContext';
import { FavoritesProvider } from '@/context/FavoritesContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { ConfirmProvider } from '@/components/ConfirmDialog';
import CookieBanner from '@/components/CookieBanner';
import ScrollToTop from '@/components/ScrollToTop';
import PushNotificationPrompt from '@/components/PushNotificationPrompt';
import PageTransition from '@/components/PageTransition';
import AIAssistant from '@/components/AIAssistant';
import WhatsAppButton from '@/components/WhatsAppButton';

const inter = Inter({ subsets: ['latin'] });

export const viewport: Viewport = {
  themeColor: '#2563eb',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: { default: 'Sneakers Pro — Las mejores zapatillas online', template: '%s | Sneakers Pro' },
  description: 'Compra las mejores zapatillas deportivas y casuales. Nike, Adidas, New Balance y más. Envío gratis en pedidos +50€.',
  keywords: ['zapatillas', 'sneakers', 'nike', 'adidas', 'new balance', 'running', 'lifestyle', 'tienda online', 'españa'],
  authors: [{ name: 'Sneakers Pro' }],
  manifest: '/manifest.json',
  openGraph: { type: 'website', locale: 'es_ES', siteName: 'Sneakers Pro', title: 'Sneakers Pro', description: 'Las mejores zapatillas online. Envío gratis +50€.' },
  twitter: { card: 'summary_large_image', title: 'Sneakers Pro', description: 'Las mejores zapatillas online' },
  robots: { index: true, follow: true },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Sneakers Pro' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const adsenseId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

  return (
    <html lang="es" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        {adsenseId && (
          <script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseId}`}
            crossOrigin="anonymous"
          />
        )}
      </head>
      <body className={`${inter.className} bg-white dark:bg-black text-neutral-900 dark:text-neutral-100`}>
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              <CartProvider>
                <FavoritesProvider>
                  <ConfirmProvider>
                    <PageTransition>
                      {children}
                    </PageTransition>
                    <CookieBanner />
                    <ScrollToTop />
                    <PushNotificationPrompt />
                    <AIAssistant />
                    <WhatsAppButton />
                  </ConfirmProvider>
                </FavoritesProvider>
              </CartProvider>
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
