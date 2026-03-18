'use client';
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { CartItem, Product } from '@/types';
import { useAuth } from '@/context/AuthContext';

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  shipping: number;
  total: number;
  addItem: (product: Product, quantity?: number, size?: string, color?: string) => void;
  removeItem: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  isInCart: (productId: string) => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const SHIPPING_COST = 5.99;
const FREE_SHIPPING_THRESHOLD = 50;

const makeCartItemId = (productId: string, size?: string, color?: string) => {
  const s = size?.trim() || '_';
  const c = color?.trim() || '_';
  return `${productId}::${s}::${c}`;
};

const getCartKey = (userId?: string | null) => {
  if (userId) return `cart_${userId}`;
  return 'cart_guest';
};

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const prevUserRef = useRef<string | null>(null);

  useEffect(() => {
    const currentUserId = user?.id || null;
    const cartKey = getCartKey(currentUserId);

    if (prevUserRef.current && !currentUserId) {
      setItems([]);
      try { localStorage.removeItem(getCartKey(prevUserRef.current)); } catch {}
      setHydrated(true);
      prevUserRef.current = null;
      return;
    }

    try {
      const saved = localStorage.getItem(cartKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        setItems(parsed.map((item: any) => ({
          ...item,
          id: item.id || makeCartItemId(item.product?.id, item.selectedSize, item.selectedColor),
        })));
      } else {
        setItems([]);
      }
    } catch { setItems([]); }

    prevUserRef.current = currentUserId;
    setHydrated(true);
  }, [user?.id]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(getCartKey(user?.id), JSON.stringify(items));
  }, [items, hydrated, user?.id]);

  useEffect(() => { try { localStorage.removeItem('cart'); } catch {} }, []);

  // Prices already include IVA — no tax calculation needed
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : (subtotal > 0 ? SHIPPING_COST : 0);
  const total = subtotal + shipping;
  const itemCount = items.reduce((count, item) => count + item.quantity, 0);

  const addItem = useCallback((product: Product, quantity: number = 1, size?: string, color?: string) => {
    const normalizedSize = size?.trim() || undefined;
    const normalizedColor = color?.trim() || undefined;
    const cartItemId = makeCartItemId(product.id, normalizedSize, normalizedColor);
    setItems(prev => {
      const existing = prev.find(item => item.id === cartItemId);
      if (existing) return prev.map(item => item.id === cartItemId ? { ...item, quantity: item.quantity + quantity } : item);
      return [...prev, { id: cartItemId, product, quantity, selectedSize: normalizedSize, selectedColor: normalizedColor }];
    });
  }, []);

  const removeItem = useCallback((cartItemId: string) => {
    setItems(prev => prev.filter(item => item.id !== cartItemId));
  }, []);

  const updateQuantity = useCallback((cartItemId: string, quantity: number) => {
    if (quantity <= 0) { removeItem(cartItemId); return; }
    setItems(prev => prev.map(item => item.id === cartItemId ? { ...item, quantity } : item));
  }, [removeItem]);

  const clearCart = useCallback(() => {
    setItems([]);
    try { localStorage.removeItem(getCartKey(user?.id)); } catch {}
  }, [user?.id]);

  const isInCart = useCallback((productId: string) => items.some(item => item.product.id === productId), [items]);

  return (
    <CartContext.Provider value={{ items, itemCount, subtotal, shipping, total, addItem, removeItem, updateQuantity, clearCart, isInCart }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart debe usarse dentro de CartProvider');
  return context;
};
