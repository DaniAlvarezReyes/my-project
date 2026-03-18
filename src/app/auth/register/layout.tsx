import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Crear Cuenta',
  description: 'Regístrate en Sneakers Pro y disfruta de ofertas exclusivas, seguimiento de pedidos y envío gratis.',
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
