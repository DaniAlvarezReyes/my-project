'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import type { CartItem, Product, Order } from '@/types';

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  addItem: (product: Product, quantity?: number, size?: string, color?: string) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  isInCart: (productId: string) => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const SHIPPING_COST = 5.99;
const FREE_SHIPPING_THRESHOLD = 50;
const TAX_RATE = 0.21; // IVA 21%

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  // Cargar carrito desde localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (error) {
        console.error('Error loading cart:', error);
      }
    }
  }, []);

  // Guardar carrito en localStorage
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  // Calcular subtotal
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  // Calcular envío
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;

  // Calcular impuestos
  const tax = subtotal * TAX_RATE;

  // Calcular total
  const total = subtotal + shipping + tax;

  // Contar items
  const itemCount = items.reduce((count, item) => count + item.quantity, 0);

  const addItem = (
    product: Product,
    quantity: number = 1,
    size?: string,
    color?: string
  ) => {
    setItems(prevItems => {
      const existingItem = prevItems.find(
        item =>
          item.product.id === product.id &&
          item.selectedSize === size &&
          item.selectedColor === color
      );

      if (existingItem) {
        return prevItems.map(item =>
          item.product.id === product.id &&
          item.selectedSize === size &&
          item.selectedColor === color
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }

      return [
        ...prevItems,
        {
          product,
          quantity,
          selectedSize: size,
          selectedColor: color,
        },
      ];
    });
  };

  const removeItem = (productId: string) => {
    setItems(prevItems => prevItems.filter(item => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }

    setItems(prevItems =>
      prevItems.map(item =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const isInCart = (productId: string): boolean => {
    return items.some(item => item.product.id === productId);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        subtotal,
        shipping,
        tax,
        total,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        isInCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart debe usarse dentro de CartProvider');
  }
  return context;
};
