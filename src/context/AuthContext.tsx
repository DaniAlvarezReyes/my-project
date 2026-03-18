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
  const profileLoadedRef = useRef(false);

  // Cargar usuario desde Supabase al iniciar
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        // Safety timeout - if getSession hangs, still mark as loaded
        const timeoutId = setTimeout(() => {
          if (mounted && isLoading) {
            console.warn('Auth init timeout - proceeding without session');
            setIsLoading(false);
          }
        }, 5000);

        const { data: { session } } = await supabase.auth.getSession();
        clearTimeout(timeoutId);

        if (session?.user && mounted) {
          await loadUserProfile(session.user.id, session.user.email || '', session.user.user_metadata);
        }
      } catch (error: any) {
        console.warn('Auth init error:', error?.message || 'Unknown');
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    init();

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      console.log('Auth event:', event);

      if (event === 'SIGNED_IN' && session?.user) {
        await loadUserProfile(session.user.id, session.user.email || '', session.user.user_metadata);
        setIsLoading(false);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsAdmin(false);
        profileLoadedRef.current = false;
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        // Solo recargar si no tenemos usuario
        if (!user) {
          await loadUserProfile(session.user.id, session.user.email || '', session.user.user_metadata);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const loadUserProfile = async (userId: string, email: string, metadata?: any) => {
    try {
      console.log('Cargando perfil para:', email);

      // Intentar cargar perfil desde la tabla profiles
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) {
        console.warn('Error cargando perfil (posible RLS):', profileError.message);
      }

      if (profile) {
        setUser({
          id: profile.id,
          email: profile.email || email,
          name: profile.name,
          lastName: profile.last_name,
          phone: profile.phone,
          createdAt: new Date(profile.created_at),
        });
        
        const adminStatus = profile.role === 'admin';
        setIsAdmin(adminStatus);
        profileLoadedRef.current = true;
        console.log('✅ Perfil cargado:', profile.email, 'Role:', profile.role, 'IsAdmin:', adminStatus);
        return;
      }

      // FALLBACK: Si no se pudo cargar el perfil (RLS, no existe, etc.)
      // Crear un usuario temporal con los datos de la sesión de auth
      console.warn('⚠️ Perfil no accesible, usando datos de sesión como fallback');
      setUser({
        id: userId,
        email: email,
        name: metadata?.name || email.split('@')[0],
        lastName: metadata?.last_name || '',
        phone: '',
        createdAt: new Date(),
      });
      
      // Verificar admin con un approach diferente si el SELECT normal falló
      // Intentar con maybeSingle que no tira error si no encuentra nada
      try {
        const { data: roleCheck } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', userId)
          .maybeSingle();
        
        if (roleCheck?.role === 'admin') {
          setIsAdmin(true);
          console.log('✅ Admin confirmado via roleCheck');
        }
      } catch {
        // Si incluso esto falla, dejamos isAdmin en false
      }
      
      profileLoadedRef.current = true;
    } catch (error) {
      console.error('Error loading profile:', error);
      // Aún así, crear usuario fallback para que la sesión no se pierda
      setUser({
        id: userId,
        email: email,
        name: metadata?.name || email.split('@')[0],
        lastName: metadata?.last_name || '',
        phone: '',
        createdAt: new Date(),
      });
      profileLoadedRef.current = true;
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
        await loadUserProfile(data.user.id, data.user.email || '', data.user.user_metadata);
        return { success: true };
      }

      return { success: false, error: 'Error al iniciar sesión' };
    } catch (error: any) {
      return { success: false, error: error.message || 'Error inesperado' };
    }
  };

  const register = async (data: RegisterForm): Promise<{ success: boolean; error?: string }> => {
    try {
      if (data.password !== data.confirmPassword) {
        return { success: false, error: 'Las contraseñas no coinciden' };
      }

      if (data.password.length < 6) {
        return { success: false, error: 'La contraseña debe tener al menos 6 caracteres' };
      }

      if (!data.acceptTerms) {
        return { success: false, error: 'Debes aceptar los términos y condiciones' };
      }

      const isAdminEmail = data.email === 'danielalvarezreyes99@gmail.com';

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
        // Esperar un momento para que el trigger cree el perfil
        await new Promise(resolve => setTimeout(resolve, 500));
        
        await supabase
          .from('profiles')
          .update({ 
            last_name: data.lastName,
            role: isAdminEmail ? 'admin' : 'customer'
          })
          .eq('id', authData.user.id);

        await loadUserProfile(authData.user.id, data.email, { name: data.name, last_name: data.lastName });
        return { success: true };
      }

      return { success: false, error: 'Error al registrarse' };
    } catch (error: any) {
      console.error('Register error:', error);
      return { success: false, error: error.message || 'Error inesperado' };
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setIsAdmin(false);
      profileLoadedRef.current = false;
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const updateProfile = async (updatedData: Partial<User>) => {
    if (!user) return;

    try {
      await supabase
        .from('profiles')
        .update({
          name: updatedData.name,
          last_name: updatedData.lastName,
          phone: updatedData.phone,
        })
        .eq('id', user.id);

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
        isAdmin,
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
