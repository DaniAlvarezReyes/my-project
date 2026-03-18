import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Catálogo de Zapatillas',
  description: 'Explora nuestra colección de zapatillas Nike, Adidas, New Balance, Puma y más. Filtros por categoría, marca y precio. Envío gratis +50€.',
};

export default function ProductosLayout({ children }: { children: React.ReactNode }) {
  return children;
}
