import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Categorías',
  description: 'Running, Lifestyle, Basketball, Training, Fútbol, Skateboarding — encuentra tu estilo.',
};

export default function CategoriasLayout({ children }: { children: React.ReactNode }) {
  return children;
}
