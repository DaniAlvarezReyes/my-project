import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Preguntas Frecuentes',
  description: 'Resuelve tus dudas sobre envíos, devoluciones, tallas, métodos de pago y más.',
};

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return children;
}
