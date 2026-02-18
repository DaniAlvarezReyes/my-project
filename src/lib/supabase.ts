import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper para manejo de errores
export const handleSupabaseError = (error: any) => {
  console.error('Supabase error:', error);
  return {
    success: false,
    error: error.message || 'Error en la operación',
  };
};
