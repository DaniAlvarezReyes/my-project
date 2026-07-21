'use client';
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { CartItem, Product } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { supabase } from '@/lib/supabase';

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  shipping: number;
  total: number;
  syncing: boolean;
  addItem: (product: Product, quantity?: number, size?: string, color?: string) => void;
  removeItem: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  changeVariant: (cartItemId: string, size?: string, color?: string) => void;
  clearCart: () => void;
  isInCart: (productId: string) => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};

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

// Debounce helper for Supabase syncs
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const toast = useToast();
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const prevUserRef = useRef<string | null>(null);
  const syncInProgress = useRef(false);
  const syncErrorShownRef = useRef(false);

  // ─── Load cart on mount / user change ───────────────────────────────────
  useEffect(() => {
    const currentUserId = user?.id || null;

    // Logout: clear cart
    if (prevUserRef.current && !currentUserId) {
      setItems([]);
      try { localStorage.removeItem(getCartKey(prevUserRef.current)); } catch {}
      prevUserRef.current = null;
      setHydrated(true);
      return;
    }

    const loadCart = async () => {
      if (currentUserId) {
        // Logged-in: try Supabase first, merge with localStorage guest cart
        setSyncing(true);
        try {
          const { data: dbItems } = await supabase
            .from('cart_items')
            .select(`
              id, quantity, selected_size, selected_color,
              product:products(*)
            `)
            .eq('user_id', currentUserId);

          const cartFromDB: CartItem[] = (dbItems || [])
            .filter((row: any) => row.product)
            .map((row: any) => ({
              id: makeCartItemId(row.product.id, row.selected_size, row.selected_color),
              product: row.product as Product,
              quantity: row.quantity,
              selectedSize: row.selected_size || undefined,
              selectedColor: row.selected_color || undefined,
              _dbId: row.id,
            }));

          // Merge guest cart into DB cart (add new items, skip duplicates)
          const guestKey = 'cart_guest';
          const guestRaw = localStorage.getItem(guestKey);
          if (guestRaw) {
            try {
              const guestItems: CartItem[] = JSON.parse(guestRaw);
              for (const gItem of guestItems) {
                const existing = cartFromDB.find(d => d.id === gItem.id);
                if (!existing) {
                  cartFromDB.push(gItem);
                  // Persist new item to Supabase
                  await supabase.from('cart_items').upsert({
                    user_id: currentUserId,
                    product_id: gItem.product.id,
                    quantity: gItem.quantity,
                    selected_size: gItem.selectedSize || null,
                    selected_color: gItem.selectedColor || null,
                  }, { onConflict: 'user_id,product_id,selected_size,selected_color' });
                }
              }
              localStorage.removeItem(guestKey);
            } catch {}
          }

          setItems(cartFromDB);
        } catch {
          // Fallback to localStorage
          const saved = localStorage.getItem(getCartKey(currentUserId));
          if (saved) {
            try { setItems(JSON.parse(saved)); } catch { setItems([]); }
          } else {
            setItems([]);
          }
        } finally {
          setSyncing(false);
        }
      } else {
        // Guest: load from localStorage
        const saved = localStorage.getItem('cart_guest');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            setItems(parsed.map((item: any) => ({
              ...item,
              id: item.id || makeCartItemId(item.product?.id, item.selectedSize, item.selectedColor),
            })));
          } catch { setItems([]); }
        } else {
          setItems([]);
        }
      }

      prevUserRef.current = currentUserId;
      setHydrated(true);
    };

    loadCart();
  }, [user?.id]);

  // ─── Persist to localStorage (always, as fast cache) ─────────────────────
  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(getCartKey(user?.id), JSON.stringify(items));
  }, [items, hydrated, user?.id]);

  // ─── Debounced sync to Supabase for logged-in users ──────────────────────
  const debouncedItems = useDebounce(items, 800);

  useEffect(() => {
    if (!hydrated || !user?.id || syncInProgress.current) return;

    const syncToSupabase = async () => {
      if (syncInProgress.current) return;
      syncInProgress.current = true;
      setSyncing(true);
      try {
        // Upsert all current items
        if (debouncedItems.length > 0) {
          const rows = debouncedItems.map(item => ({
            user_id: user.id,
            product_id: item.product.id,
            quantity: item.quantity,
            selected_size: item.selectedSize || null,
            selected_color: item.selectedColor || null,
          }));
          await supabase.from('cart_items').upsert(rows, {
            onConflict: 'user_id,product_id,selected_size,selected_color',
          });
        }

        // Delete items that are in DB but no longer in local state
        const { data: dbItems } = await supabase
          .from('cart_items')
          .select('id, product_id, selected_size, selected_color')
          .eq('user_id', user.id);

        if (dbItems) {
          const localIds = new Set(debouncedItems.map(i => i.id));
          const toDelete = dbItems.filter((row: any) => {
            const localId = makeCartItemId(row.product_id, row.selected_size, row.selected_color);
            return !localIds.has(localId);
          });
          if (toDelete.length > 0) {
            await supabase.from('cart_items')
              .delete()
              .in('id', toDelete.map((r: any) => r.id));
          }
        }
        syncErrorShownRef.current = false;
      } catch {
        if (!syncErrorShownRef.current) {
          syncErrorShownRef.current = true;
          toast.error('No se pudo sincronizar el carrito. Tus cambios están guardados localmente.');
        }
      } finally {
        syncInProgress.current = false;
        setSyncing(false);
      }
    };

    syncToSupabase();
  }, [debouncedItems, user?.id, hydrated]);

  // Clean up old cart key
  useEffect(() => { try { localStorage.removeItem('cart'); } catch {} }, []);

  // ─── Computed values ─────────────────────────────────────────────────────
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : (subtotal > 0 ? SHIPPING_COST : 0);
  const total = subtotal + shipping;
  const itemCount = items.reduce((count, item) => count + item.quantity, 0);

  // ─── Actions ─────────────────────────────────────────────────────────────
  const addItem = useCallback((product: Product, quantity: number = 1, size?: string, color?: string) => {
    const normalizedSize = size?.trim() || undefined;
    const normalizedColor = color?.trim() || undefined;
    const cartItemId = makeCartItemId(product.id, normalizedSize, normalizedColor);
    setItems(prev => {
      const existing = prev.find(item => item.id === cartItemId);
      if (existing) {
        return prev.map(item =>
          item.id === cartItemId ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [...prev, { id: cartItemId, product, quantity, selectedSize: normalizedSize, selectedColor: normalizedColor }];
    });
    // Show rich cart toast with product preview
    const images = (product as any).images || (product as any).color_variants?.[0]?.images || [];
    toast.cartAdd({
      productId: product.id,
      name: product.name,
      image: images[0] || undefined,
      price: product.price,
      currency: '€',
      size: normalizedSize,
      color: normalizedColor,
      quantity,
    });
  }, [toast]);

  const removeItem = useCallback((cartItemId: string) => {
    setItems(prev => prev.filter(item => item.id !== cartItemId));
  }, []);

  const updateQuantity = useCallback((cartItemId: string, quantity: number) => {
    if (quantity <= 0) { removeItem(cartItemId); return; }
    setItems(prev => prev.map(item => item.id === cartItemId ? { ...item, quantity } : item));
  }, [removeItem]);

  // Cambiar la talla y/o color de una línea del carrito.
  // Recalcula el id de la línea; si ya existe una línea con esa variante, fusiona cantidades.
  const changeVariant = useCallback((cartItemId: string, size?: string, color?: string) => {
    setItems(prev => {
      const item = prev.find(i => i.id === cartItemId);
      if (!item) return prev;
      const normalizedSize = size?.trim() || undefined;
      const normalizedColor = color?.trim() || undefined;
      const newId = makeCartItemId(item.product.id, normalizedSize, normalizedColor);
      if (newId === cartItemId) return prev;

      const existing = prev.find(i => i.id === newId);
      if (existing) {
        // Ya hay una línea con esa variante → sumamos cantidades y quitamos la antigua
        return prev
          .filter(i => i.id !== cartItemId)
          .map(i => i.id === newId ? { ...i, quantity: i.quantity + item.quantity } : i);
      }
      return prev.map(i =>
        i.id === cartItemId
          ? { ...i, id: newId, selectedSize: normalizedSize, selectedColor: normalizedColor }
          : i
      );
    });
  }, []);

  const clearCart = useCallback(async () => {
    setItems([]);
    try { localStorage.removeItem(getCartKey(user?.id)); } catch {}
    if (user?.id) {
      try {
        await supabase.from('cart_items').delete().eq('user_id', user.id);
      } catch {}
    }
  }, [user?.id]);

  const isInCart = useCallback((productId: string) => items.some(item => item.product.id === productId), [items]);

  return (
    <CartContext.Provider value={{ items, itemCount, subtotal, shipping, total, syncing, addItem, removeItem, updateQuantity, changeVariant, clearCart, isInCart }}>
      {children}
    </CartContext.Provider>
  );
}
