'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import type { User, LoginForm, RegisterForm } from '@/types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginForm) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterForm) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar usuario desde Supabase al iniciar
  useEffect(() => {
    checkUser();

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadUserProfile(session.user.id);
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await loadUserProfile(session.user.id);
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserProfile = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      if (profile) {
        setUser({
          id: profile.id,
          email: profile.email,
          name: profile.name,
          lastName: profile.last_name,
          phone: profile.phone,
          createdAt: new Date(profile.created_at),
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const login = async (credentials: LoginForm): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        await loadUserProfile(data.user.id);
        return { success: true };
      }

      return { success: false, error: 'Error al iniciar sesión' };
    } catch (error: any) {
      return { success: false, error: error.message || 'Error inesperado' };
    }
  };

  const register = async (data: RegisterForm): Promise<{ success: boolean; error?: string }> => {
    try {
      // Validaciones
      if (data.password !== data.confirmPassword) {
        return { success: false, error: 'Las contraseñas no coinciden' };
      }

      if (data.password.length < 6) {
        return { success: false, error: 'La contraseña debe tener al menos 6 caracteres' };
      }

      if (!data.acceptTerms) {
        return { success: false, error: 'Debes aceptar los términos y condiciones' };
      }

      // Registrar en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
            last_name: data.lastName,
          }
        }
      });

      if (authError) {
        return { success: false, error: authError.message };
      }

      if (authData.user) {
        // El perfil se crea automáticamente por el trigger en Supabase
        // Actualizar con apellido
        await supabase
          .from('profiles')
          .update({ last_name: data.lastName })
          .eq('id', authData.user.id);

        await loadUserProfile(authData.user.id);
        return { success: true };
      }

      return { success: false, error: 'Error al registrarse' };
    } catch (error: any) {
      return { success: false, error: error.message || 'Error inesperado' };
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const updateProfile = async (updatedData: Partial<User>) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: updatedData.name,
          last_name: updatedData.lastName,
          phone: updatedData.phone,
        })
        .eq('id', user.id);

      if (error) throw error;

      setUser({ ...user, ...updatedData });
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
};
