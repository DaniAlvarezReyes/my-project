'use client';
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import type { User, LoginForm, RegisterForm } from '@/types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  login: (credentials: LoginForm) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterForm) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Ref to track current user ID — prevents stale closure in onAuthStateChange
  const currentUserIdRef = useRef<string | null>(null);
  const profileLoadedRef = useRef(false);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        const timeoutId = setTimeout(() => {
          if (mounted && isLoading) setIsLoading(false);
        }, 5000);

        const { data: { session } } = await supabase.auth.getSession();
        clearTimeout(timeoutId);

        if (session?.user && mounted) {
          await loadUserProfile(session.user.id, session.user.email || '', session.user.user_metadata);
        }
      } catch {
        // Silent
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (event === 'SIGNED_IN' && session?.user) {
        // Only load profile if it's a DIFFERENT user than current
        if (currentUserIdRef.current !== session.user.id) {
          await loadUserProfile(session.user.id, session.user.email || '', session.user.user_metadata);
        }
        setIsLoading(false);
      } else if (event === 'SIGNED_OUT') {
        currentUserIdRef.current = null;
        profileLoadedRef.current = false;
        setUser(null);
        setIsAdmin(false);
      }
      // TOKEN_REFRESHED, USER_UPDATED → deliberately ignored
      // The token refreshes silently without triggering re-renders
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const loadUserProfile = async (userId: string, email: string, metadata?: any) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profile) {
        const userData: User = {
          id: profile.id,
          email: profile.email || email,
          name: profile.name,
          lastName: profile.last_name,
          phone: profile.phone,
          createdAt: new Date(profile.created_at),
        };
        setUser(userData);
        setIsAdmin(profile.role === 'admin');
        currentUserIdRef.current = userId;
        profileLoadedRef.current = true;
        return;
      }

      // Fallback: use session metadata
      setUser({
        id: userId,
        email,
        name: metadata?.name || email.split('@')[0],
        lastName: metadata?.last_name || '',
        phone: '',
        createdAt: new Date(),
      });
      currentUserIdRef.current = userId;
      profileLoadedRef.current = true;

      // Try role check separately
      try {
        const { data: roleCheck } = await supabase
          .from('profiles').select('role').eq('id', userId).maybeSingle();
        if (roleCheck?.role === 'admin') setIsAdmin(true);
      } catch {}
    } catch {
      setUser({
        id: userId, email,
        name: metadata?.name || email.split('@')[0],
        lastName: metadata?.last_name || '', phone: '',
        createdAt: new Date(),
      });
      currentUserIdRef.current = userId;
      profileLoadedRef.current = true;
    }
  };

  const login = async (credentials: LoginForm) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email, password: credentials.password,
      });
      if (error) return { success: false, error: error.message };
      if (data.user) {
        await loadUserProfile(data.user.id, data.user.email || '', data.user.user_metadata);
        return { success: true };
      }
      return { success: false, error: 'Error al iniciar sesión' };
    } catch (error: any) {
      return { success: false, error: error.message || 'Error inesperado' };
    }
  };

  const register = async (data: RegisterForm) => {
    try {
      if (data.password !== data.confirmPassword) return { success: false, error: 'Las contraseñas no coinciden' };
      if (data.password.length < 6) return { success: false, error: 'La contraseña debe tener al menos 6 caracteres' };
      if (!data.acceptTerms) return { success: false, error: 'Debes aceptar los términos y condiciones' };

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email, password: data.password,
        options: { data: { name: data.name, last_name: data.lastName } },
      });
      if (authError) return { success: false, error: authError.message };
      if (authData.user) {
        await new Promise(r => setTimeout(r, 500));
        await supabase.from('profiles').update({
          last_name: data.lastName, role: 'customer',
        }).eq('id', authData.user.id);
        await loadUserProfile(authData.user.id, data.email, { name: data.name, last_name: data.lastName });
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
      currentUserIdRef.current = null;
      profileLoadedRef.current = false;
      setUser(null);
      setIsAdmin(false);
    } catch {}
  };

  const updateProfile = async (updatedData: Partial<User>) => {
    if (!user) return;
    try {
      await supabase.from('profiles').update({
        name: updatedData.name, last_name: updatedData.lastName, phone: updatedData.phone,
      }).eq('id', user.id);
      setUser({ ...user, ...updatedData });
    } catch {}
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, isAdmin, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
};
