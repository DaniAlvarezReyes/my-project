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
  global: {
    fetch: (...args: Parameters<typeof fetch>) => {
      // Add timeout to all supabase fetch calls to prevent hanging
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      const [input, init] = args;
      return fetch(input, { ...init, signal: controller.signal })
        .finally(() => clearTimeout(timeout));
    },
  },
});

// Auto-refresh session when user returns to tab after being away
if (isBrowser) {
  let lastActivity = Date.now();

  // Track activity
  const updateActivity = () => { lastActivity = Date.now(); };
  document.addEventListener('click', updateActivity, { passive: true });
  document.addEventListener('keydown', updateActivity, { passive: true });

  document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState === 'visible') {
      const inactiveMs = Date.now() - lastActivity;
      // If inactive for more than 2 minutes, refresh session
      if (inactiveMs > 120_000) {
        try {
          await supabase.auth.getSession();
        } catch {
          // Silent fail - will retry on next query
        }
      }
      lastActivity = Date.now();
    }
  });
}

export const handleSupabaseError = (error: any) => {
  console.error('Supabase error:', error);
  return { success: false, error: error.message || 'Error en la operación' };
};
