'use client';
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const GUEST_FAV_KEY = 'guest_favorites';

interface FavoritesContextType {
  favorites: string[];
  toggleFavorite: (productId: string) => void;
  isFavorite: (productId: string) => boolean;
  loading: boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) throw new Error('useFavorites must be used within FavoritesProvider');
  return context;
};

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const toast = useToast();
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const prevUserRef = useRef<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (isAuthenticated && user?.id) {
        try {
          const { data } = await supabase
            .from('favorites')
            .select('product_id')
            .eq('user_id', user.id);
          const dbFavs = data ? data.map(f => f.product_id) : [];

          // Merge guest favorites on login
          if (!prevUserRef.current) {
            try {
              const guestFavs = JSON.parse(localStorage.getItem(GUEST_FAV_KEY) || '[]') as string[];
              const toMerge = guestFavs.filter(id => !dbFavs.includes(id));
              if (toMerge.length > 0) {
                await supabase.from('favorites').insert(
                  toMerge.map(product_id => ({ user_id: user.id, product_id }))
                );
                dbFavs.push(...toMerge);
              }
              localStorage.removeItem(GUEST_FAV_KEY);
            } catch {}
          }

          setFavorites(dbFavs);
        } catch {
          setFavorites([]);
          toast.error('No se pudieron cargar tus favoritos. Inténtalo de nuevo.');
        }
      } else {
        // Guest: load from localStorage
        try {
          setFavorites(JSON.parse(localStorage.getItem(GUEST_FAV_KEY) || '[]'));
        } catch {
          setFavorites([]);
        }
      }
      prevUserRef.current = user?.id || null;
      setLoading(false);
    };
    load();
  }, [user?.id, isAuthenticated]);

  const toggleFavorite = useCallback(async (productId: string) => {
    const isFav = favorites.includes(productId);
    const newFavs = isFav ? favorites.filter(id => id !== productId) : [...favorites, productId];
    setFavorites(newFavs);

    if (isAuthenticated && user?.id) {
      try {
        if (isFav) {
          await supabase.from('favorites').delete().eq('user_id', user.id).eq('product_id', productId);
        } else {
          await supabase.from('favorites').insert({ user_id: user.id, product_id: productId });
        }
      } catch {
        setFavorites(favorites);
        toast.error('No se pudo actualizar tus favoritos. Inténtalo de nuevo.');
      }
    } else {
      localStorage.setItem(GUEST_FAV_KEY, JSON.stringify(newFavs));
    }
  }, [favorites, user?.id, isAuthenticated]);

  const isFavorite = useCallback((productId: string) => favorites.includes(productId), [favorites]);

  return (
    <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFavorite, loading }}>
      {children}
    </FavoritesContext.Provider>
  );
};
