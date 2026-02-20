'use client';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';

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
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Cargar favoritos
  useEffect(() => {
    const loadFavorites = async () => {
      if (isAuthenticated && user?.id) {
        const { data } = await supabase
          .from('favorites')
          .select('product_id')
          .eq('user_id', user.id);
        
        if (data) {
          setFavorites(data.map(f => f.product_id));
        }
      } else {
        // Si no está logueado, usar localStorage
        const saved = localStorage.getItem('favorites');
        if (saved) setFavorites(JSON.parse(saved));
      }
      setLoading(false);
    };

    loadFavorites();
  }, [user, isAuthenticated]);

  const toggleFavorite = useCallback(async (productId: string) => {
    const isFav = favorites.includes(productId);

    if (isAuthenticated && user?.id) {
      // Guardar en Supabase
      if (isFav) {
        await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', productId);
        setFavorites(prev => prev.filter(id => id !== productId));
      } else {
        await supabase
          .from('favorites')
          .insert({ user_id: user.id, product_id: productId });
        setFavorites(prev => [...prev, productId]);
      }
    } else {
      // Guardar en localStorage
      const newFavorites = isFav 
        ? favorites.filter(id => id !== productId)
        : [...favorites, productId];
      setFavorites(newFavorites);
      localStorage.setItem('favorites', JSON.stringify(newFavorites));
    }
  }, [favorites, user, isAuthenticated]);

  const isFavorite = useCallback((productId: string) => {
    return favorites.includes(productId);
  }, [favorites]);

  return (
    <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFavorite, loading }}>
      {children}
    </FavoritesContext.Provider>
  );
};
