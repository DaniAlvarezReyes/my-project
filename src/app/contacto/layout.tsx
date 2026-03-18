import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contacto',
  description: 'Contacta con Sneakers Pro. Atención al cliente, devoluciones, reclamaciones. Estamos aquí para ayudarte.',
};

export default function ContactoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
