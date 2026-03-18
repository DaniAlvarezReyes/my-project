import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Iniciar Sesión',
  description: 'Accede a tu cuenta en Sneakers Pro para gestionar pedidos, favoritos y direcciones.',
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
