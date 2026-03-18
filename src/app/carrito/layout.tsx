import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Carrito de Compra',
  description: 'Revisa tu carrito y procede al pago. Envío gratis en pedidos superiores a 50€.',
};

export default function CarritoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
