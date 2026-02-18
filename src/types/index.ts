// Tipos de Usuario
export interface User {
  id: string;
  email: string;
  name: string;
  lastName: string;
  phone?: string;
  address?: Address;
  createdAt: Date;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

// Tipos de Producto
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  images: string[];
  category: string;
  subcategory?: string;
  brand: string;
  rating: number;
  reviews: number;
  inStock: boolean;
  stock: number;
  sizes?: string[];
  colors?: string[];
  badge?: 'NUEVO' | 'POPULAR' | 'OFERTA' | 'AGOTADO';
}

// Tipos de Categoría
export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  subcategories?: Subcategory[];
}

export interface Subcategory {
  id: string;
  name: string;
  slug: string;
}

// Tipos de Carrito
export interface CartItem {
  product: Product;
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
}

// Tipos de Pedido
export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentMethod: 'card' | 'paypal' | 'cash';
  shippingAddress: Address;
  createdAt: Date;
  updatedAt: Date;
  trackingNumber?: string;
}

// Tipos de Formularios
export interface ContactForm {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  name: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

// Tipos de Filtros
export interface ProductFilters {
  category?: string;
  subcategory?: string;
  minPrice?: number;
  maxPrice?: number;
  brands?: string[];
  inStock?: boolean;
  sortBy?: 'price-asc' | 'price-desc' | 'name-asc' | 'name-desc' | 'rating' | 'newest';
}
