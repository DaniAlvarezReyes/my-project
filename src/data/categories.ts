import { Category } from '@/types';

export const categories: Category[] = [
  {
    id: 'running',
    name: 'Running',
    slug: 'running',
    description: 'Zapatillas diseñadas para correr y entrenar',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=400&fit=crop',
    subcategories: [
      { id: 'running-road', name: 'Carretera', slug: 'carretera' },
      { id: 'running-trail', name: 'Trail', slug: 'trail' },
      { id: 'running-competition', name: 'Competición', slug: 'competicion' },
    ],
  },
  {
    id: 'lifestyle',
    name: 'Lifestyle',
    slug: 'lifestyle',
    description: 'Zapatillas casuales para el día a día',
    image: 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=600&h=400&fit=crop',
    subcategories: [
      { id: 'lifestyle-casual', name: 'Casual', slug: 'casual' },
      { id: 'lifestyle-retro', name: 'Retro', slug: 'retro' },
      { id: 'lifestyle-premium', name: 'Premium', slug: 'premium' },
    ],
  },
  {
    id: 'basketball',
    name: 'Basketball',
    slug: 'basketball',
    description: 'Zapatillas especializadas para baloncesto',
    image: 'https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=600&h=400&fit=crop',
    subcategories: [
      { id: 'basketball-high', name: 'Caña Alta', slug: 'cana-alta' },
      { id: 'basketball-low', name: 'Caña Baja', slug: 'cana-baja' },
    ],
  },
  {
    id: 'training',
    name: 'Training',
    slug: 'training',
    description: 'Para entrenamientos en el gimnasio',
    image: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600&h=400&fit=crop',
    subcategories: [
      { id: 'training-gym', name: 'Gimnasio', slug: 'gimnasio' },
      { id: 'training-crossfit', name: 'CrossFit', slug: 'crossfit' },
    ],
  },
  {
    id: 'football',
    name: 'Fútbol',
    slug: 'futbol',
    description: 'Botas de fútbol para césped',
    image: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=600&h=400&fit=crop',
    subcategories: [
      { id: 'football-fg', name: 'Césped Natural', slug: 'cesped-natural' },
      { id: 'football-ag', name: 'Césped Artificial', slug: 'cesped-artificial' },
      { id: 'football-indoor', name: 'Sala', slug: 'sala' },
    ],
  },
  {
    id: 'skateboarding',
    name: 'Skateboarding',
    slug: 'skateboarding',
    description: 'Zapatillas para skate con grip superior',
    image: 'https://images.unsplash.com/photo-1547447134-cd3f5c716030?w=600&h=400&fit=crop',
  },
];

export const getCategoryBySlug = (slug: string): Category | undefined => {
  return categories.find(cat => cat.slug === slug);
};

export const getSubcategoryBySlug = (categorySlug: string, subcategorySlug: string) => {
  const category = getCategoryBySlug(categorySlug);
  return category?.subcategories?.find(sub => sub.slug === subcategorySlug);
};
