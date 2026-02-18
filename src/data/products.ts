import { Product } from '@/types';

export const products: Product[] = [
  // RUNNING
  {
    id: 'nike-pegasus-40',
    name: 'Nike Air Zoom Pegasus 40',
    description: 'Las Pegasus 40 ofrecen una amortiguación reactiva y duradera para tus entrenamientos diarios. Con malla mejorada y diseño actualizado.',
    price: 139.99,
    originalPrice: 159.99,
    images: [
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800&h=800&fit=crop',
    ],
    category: 'running',
    subcategory: 'carretera',
    brand: 'Nike',
    rating: 4.8,
    reviews: 456,
    inStock: true,
    stock: 45,
    sizes: ['39', '40', '41', '42', '43', '44', '45'],
    colors: ['Negro', 'Blanco', 'Azul'],
    badge: 'POPULAR',
  },
  {
    id: 'adidas-ultraboost-light',
    name: 'Adidas Ultraboost Light',
    description: 'La zapatilla de running más ligera de la familia Ultraboost. Amortiguación Boost responsiva y upper Primeknit adaptable.',
    price: 189.99,
    images: [
      'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800&h=800&fit=crop',
    ],
    category: 'running',
    subcategory: 'carretera',
    brand: 'Adidas',
    rating: 4.9,
    reviews: 623,
    inStock: true,
    stock: 32,
    sizes: ['39', '40', '41', '42', '43', '44', '45', '46'],
    colors: ['Blanco', 'Negro', 'Gris'],
    badge: 'NUEVO',
  },
  {
    id: 'asics-gel-nimbus-25',
    name: 'Asics Gel-Nimbus 25',
    description: 'Máxima amortiguación para largas distancias. Tecnología GEL en talón y antepié para una pisada suave.',
    price: 169.99,
    originalPrice: 189.99,
    images: [
      'https://images.unsplash.com/photo-1539185441755-769473a23570?w=800&h=800&fit=crop',
    ],
    category: 'running',
    subcategory: 'carretera',
    brand: 'Asics',
    rating: 4.7,
    reviews: 234,
    inStock: true,
    stock: 28,
    sizes: ['40', '41', '42', '43', '44', '45'],
    colors: ['Azul', 'Negro', 'Rojo'],
  },
  {
    id: 'hoka-speedgoat-5',
    name: 'Hoka Speedgoat 5',
    description: 'Diseñada para trail running. Suela Vibram Megagrip para máxima tracción en terrenos técnicos.',
    price: 159.99,
    images: [
      'https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=800&h=800&fit=crop',
    ],
    category: 'running',
    subcategory: 'trail',
    brand: 'Hoka',
    rating: 4.8,
    reviews: 189,
    inStock: true,
    stock: 15,
    sizes: ['40', '41', '42', '43', '44'],
    colors: ['Verde', 'Naranja', 'Gris'],
    badge: 'POPULAR',
  },

  // LIFESTYLE
  {
    id: 'nike-air-force-1',
    name: 'Nike Air Force 1 \'07',
    description: 'El clásico atemporal. Diseño icónico desde 1982, perfecto para el día a día con estilo urbano.',
    price: 119.99,
    images: [
      'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=800&h=800&fit=crop',
    ],
    category: 'lifestyle',
    subcategory: 'casual',
    brand: 'Nike',
    rating: 4.9,
    reviews: 1245,
    inStock: true,
    stock: 156,
    sizes: ['38', '39', '40', '41', '42', '43', '44', '45', '46'],
    colors: ['Blanco', 'Negro', 'Blanco/Negro'],
    badge: 'POPULAR',
  },
  {
    id: 'adidas-samba-og',
    name: 'Adidas Samba OG',
    description: 'Ícono del fútbol sala convertido en zapatilla lifestyle. Piel premium y suela de goma.',
    price: 109.99,
    images: [
      'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&h=800&fit=crop',
    ],
    category: 'lifestyle',
    subcategory: 'retro',
    brand: 'Adidas',
    rating: 4.8,
    reviews: 892,
    inStock: true,
    stock: 89,
    sizes: ['38', '39', '40', '41', '42', '43', '44', '45'],
    colors: ['Negro/Blanco', 'Blanco/Verde'],
    badge: 'POPULAR',
  },
  {
    id: 'new-balance-550',
    name: 'New Balance 550',
    description: 'Inspiradas en el baloncesto de los 80. Diseño retro con máximo confort para el uso diario.',
    price: 129.99,
    images: [
      'https://images.unsplash.com/photo-1539185441755-769473a23570?w=800&h=800&fit=crop',
    ],
    category: 'lifestyle',
    subcategory: 'retro',
    brand: 'New Balance',
    rating: 4.7,
    reviews: 445,
    inStock: true,
    stock: 67,
    sizes: ['39', '40', '41', '42', '43', '44', '45'],
    colors: ['Blanco/Verde', 'Blanco/Azul', 'Gris'],
    badge: 'NUEVO',
  },
  {
    id: 'vans-old-skool',
    name: 'Vans Old Skool',
    description: 'El clásico skate shoe. Suela waffle signature y construcción duradera.',
    price: 79.99,
    images: [
      'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=800&h=800&fit=crop',
    ],
    category: 'skateboarding',
    brand: 'Vans',
    rating: 4.8,
    reviews: 678,
    inStock: true,
    stock: 134,
    sizes: ['38', '39', '40', '41', '42', '43', '44', '45'],
    colors: ['Negro/Blanco', 'Azul Marino', 'Rojo'],
  },

  // BASKETBALL
  {
    id: 'air-jordan-1-high',
    name: 'Air Jordan 1 Retro High OG',
    description: 'La leyenda que empezó todo. Diseño clásico de 1985, perfecto tanto para la cancha como para la calle.',
    price: 189.99,
    images: [
      'https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=800&h=800&fit=crop',
    ],
    category: 'basketball',
    subcategory: 'cana-alta',
    brand: 'Nike',
    rating: 5.0,
    reviews: 2134,
    inStock: true,
    stock: 23,
    sizes: ['40', '41', '42', '43', '44', '45'],
    colors: ['Chicago', 'Bred', 'Royal'],
    badge: 'POPULAR',
  },
  {
    id: 'lebron-21',
    name: 'Nike LeBron 21',
    description: 'La última firma de LeBron. Tecnología Zoom Air para explosividad y soporte en la cancha.',
    price: 179.99,
    images: [
      'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800&h=800&fit=crop',
    ],
    category: 'basketball',
    subcategory: 'cana-baja',
    brand: 'Nike',
    rating: 4.7,
    reviews: 234,
    inStock: true,
    stock: 34,
    sizes: ['41', '42', '43', '44', '45', '46'],
    colors: ['Negro', 'Morado', 'Blanco'],
    badge: 'NUEVO',
  },

  // TRAINING
  {
    id: 'nike-metcon-9',
    name: 'Nike Metcon 9',
    description: 'Diseñada para entrenamientos de alta intensidad. Estabilidad y durabilidad para levantamientos.',
    price: 149.99,
    images: [
      'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800&h=800&fit=crop',
    ],
    category: 'training',
    subcategory: 'crossfit',
    brand: 'Nike',
    rating: 4.8,
    reviews: 567,
    inStock: true,
    stock: 45,
    sizes: ['39', '40', '41', '42', '43', '44', '45'],
    colors: ['Negro', 'Blanco', 'Azul'],
  },
  {
    id: 'reebok-nano-x3',
    name: 'Reebok Nano X3',
    description: 'La zapatilla de CrossFit por excelencia. Versatilidad para cualquier WOD.',
    price: 139.99,
    originalPrice: 159.99,
    images: [
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=800&fit=crop',
    ],
    category: 'training',
    subcategory: 'crossfit',
    brand: 'Reebok',
    rating: 4.7,
    reviews: 445,
    inStock: true,
    stock: 56,
    sizes: ['39', '40', '41', '42', '43', '44', '45'],
    colors: ['Negro', 'Gris', 'Azul'],
    badge: 'OFERTA',
  },

  // FÚTBOL
  {
    id: 'nike-mercurial-superfly',
    name: 'Nike Mercurial Superfly 9',
    description: 'Velocidad pura. Diseño aerodinámico y sistema de tracción optimizado.',
    price: 279.99,
    images: [
      'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&h=800&fit=crop',
    ],
    category: 'futbol',
    subcategory: 'cesped-natural',
    brand: 'Nike',
    rating: 4.9,
    reviews: 334,
    inStock: true,
    stock: 12,
    sizes: ['39', '40', '41', '42', '43', '44', '45'],
    colors: ['Naranja', 'Negro', 'Blanco'],
    badge: 'NUEVO',
  },
  {
    id: 'adidas-predator-accuracy',
    name: 'Adidas Predator Accuracy.1',
    description: 'Control y precisión absolutos. Zonas de strike para efectos en el balón.',
    price: 259.99,
    images: [
      'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&h=800&fit=crop',
    ],
    category: 'futbol',
    subcategory: 'cesped-natural',
    brand: 'Adidas',
    rating: 4.8,
    reviews: 267,
    inStock: true,
    stock: 18,
    sizes: ['39', '40', '41', '42', '43', '44'],
    colors: ['Blanco/Rojo', 'Negro'],
  },

  // Más productos...
  {
    id: 'puma-future-z',
    name: 'Puma Future Z 1.4',
    description: 'Agilidad extrema. Sistema de lazado adaptativo para ajuste personalizado.',
    price: 229.99,
    originalPrice: 269.99,
    images: [
      'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&h=800&fit=crop',
    ],
    category: 'futbol',
    subcategory: 'cesped-artificial',
    brand: 'Puma',
    rating: 4.6,
    reviews: 189,
    inStock: true,
    stock: 24,
    sizes: ['40', '41', '42', '43', '44', '45'],
    colors: ['Amarillo', 'Azul'],
    badge: 'OFERTA',
  },
  {
    id: 'converse-chuck-taylor',
    name: 'Converse Chuck Taylor All Star',
    description: 'El clásico de clásicos. Atemporal, versátil y cómodo para cualquier ocasión.',
    price: 69.99,
    images: [
      'https://images.unsplash.com/photo-1495555961986-6d4c1ecb7be3?w=800&h=800&fit=crop',
    ],
    category: 'lifestyle',
    subcategory: 'casual',
    brand: 'Converse',
    rating: 4.9,
    reviews: 3456,
    inStock: true,
    stock: 234,
    sizes: ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45'],
    colors: ['Negro', 'Blanco', 'Rojo', 'Azul Marino'],
    badge: 'POPULAR',
  },
];

export const getProductById = (id: string): Product | undefined => {
  return products.find(p => p.id === id);
};

export const getProductsByCategory = (category: string): Product[] => {
  return products.filter(p => p.category === category);
};

export const getProductsBySubcategory = (category: string, subcategory: string): Product[] => {
  return products.filter(p => p.category === category && p.subcategory === subcategory);
};

export const getFeaturedProducts = (): Product[] => {
  return products.filter(p => p.badge === 'POPULAR' || p.badge === 'NUEVO').slice(0, 8);
};

export const getNewProducts = (): Product[] => {
  return products.filter(p => p.badge === 'NUEVO');
};

export const getOnSaleProducts = (): Product[] => {
  return products.filter(p => p.originalPrice && p.originalPrice > p.price);
};
