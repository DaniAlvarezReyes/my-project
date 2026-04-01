import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const isBrowser = typeof window !== 'undefined';

const safeStorage = {
  getItem: (key: string): string | null => {
    if (!isBrowser) return null;
    try { return localStorage.getItem(key); } catch { return null; }
  },
  setItem: (key: string, value: string) => {
    if (!isBrowser) return;
    try { localStorage.setItem(key, value); } catch {}
  },
  removeItem: (key: string) => {
    if (!isBrowser) return;
    try { localStorage.removeItem(key); } catch {}
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: isBrowser,
    flowType: 'pkce',
    storage: safeStorage,
    lock: (async (_n: string, _t: number, fn: () => Promise<any>) => fn()),
  } as any,
  realtime: {
    params: { eventsPerSecond: 0 },
  },
  global: {
    fetch: (...args: Parameters<typeof fetch>) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      const [input, init] = args;
      return fetch(input, { ...init, signal: controller.signal })
        .finally(() => clearTimeout(timeout));
    },
  },
});

// Kill any Realtime channels immediately
if (isBrowser) {
  supabase.removeAllChannels();
}

export const handleSupabaseError = (error: any) => {
  console.error('Supabase error:', error);
  return { success: false, error: error.message || 'Error en la operación' };
};
