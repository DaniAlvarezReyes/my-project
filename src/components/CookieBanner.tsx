'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';

type Prefs = { necessary: true; analytics: boolean; marketing: boolean };

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative w-10 h-5 rounded-full transition-colors duration-200 flex-shrink-0 ${checked ? 'bg-black dark:bg-white' : 'bg-gray-300 dark:bg-neutral-600'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white dark:bg-black shadow-sm transition-transform duration-200 ${checked ? 'translate-x-5' : ''}`} />
    </button>
  );
}

const COOKIE_CATEGORIES = [
  {
    key: 'necessary' as const,
    label: 'Esenciales',
    description: 'Carrito, sesión de usuario, preferencias de idioma. Sin estas, la tienda no funciona.',
    required: true,
  },
  {
    key: 'analytics' as const,
    label: 'Analíticas',
    description: 'Nos ayudan a entender qué productos son más populares y cómo mejorar tu experiencia.',
    required: false,
  },
  {
    key: 'marketing' as const,
    label: 'Marketing',
    description: 'Permiten mostrarte anuncios relevantes en otras plataformas y medir su eficacia.',
    required: false,
  },
];

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [prefs, setPrefs] = useState<Prefs>({ necessary: true, analytics: false, marketing: false });

  useEffect(() => {
    const saved = localStorage.getItem('cookie-consent-v2');
    if (!saved) {
      const timer = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const save = (p: Prefs) => {
    localStorage.setItem('cookie-consent-v2', JSON.stringify({ ...p, timestamp: Date.now() }));
    // Also emit a custom event for analytics initialisation
    window.dispatchEvent(new CustomEvent('cookieConsentUpdate', { detail: p }));
    setVisible(false);
    setShowPreferences(false);
  };

  if (!visible) return null;

  return (
    <>
      {/* Backdrop blur on mobile when preferences panel is open */}
      {showPreferences && (
        <div className="fixed inset-0 bg-black/30 z-[9996] lg:hidden" onClick={() => setShowPreferences(false)} />
      )}

      <div
        className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:w-[440px] z-[9997]"
        role="dialog" aria-label="Gestión de cookies"
      >
        <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-2xl shadow-2xl overflow-hidden">

          {!showPreferences ? (
            /* ── Main banner ─────────────────────────────────────── */
            <div className="p-5">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-9 h-9 bg-black dark:bg-white rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-white dark:text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white mb-0.5">Tu privacidad importa</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                    Usamos cookies para mejorar tu experiencia y personalizar el contenido.
                    {' '}<Link href="/legal/cookies" className="underline underline-offset-2 hover:text-black dark:hover:text-white transition-colors">Política de cookies</Link>
                  </p>
                </div>
              </div>

              {/* Quick summary of categories */}
              <div className="flex gap-1.5 mb-4 flex-wrap">
                {['Esenciales ✓', 'Analíticas', 'Marketing'].map((cat, i) => (
                  <span key={cat} className={`text-[10px] font-medium px-2 py-1 rounded-full ${i === 0 ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-gray-100 dark:bg-neutral-800 text-gray-500 dark:text-gray-400'}`}>
                    {cat}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2 mb-2">
                <button
                  onClick={() => save({ necessary: true, analytics: false, marketing: false })}
                  className="py-2.5 px-3 text-xs font-semibold text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-neutral-700 rounded-xl hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
                >
                  Solo esenciales
                </button>
                <button
                  onClick={() => save({ necessary: true, analytics: true, marketing: true })}
                  className="py-2.5 px-3 text-xs font-bold text-white dark:text-black bg-black dark:bg-white rounded-xl hover:opacity-90 transition-opacity"
                >
                  Aceptar todas
                </button>
              </div>
              <button
                onClick={() => setShowPreferences(true)}
                className="w-full py-2 text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                Personalizar preferencias →
              </button>
            </div>
          ) : (
            /* ── Preferences panel ───────────────────────────────── */
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <button onClick={() => setShowPreferences(false)} className="p-1.5 -ml-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-500 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <p className="text-sm font-bold text-gray-900 dark:text-white">Preferencias de cookies</p>
                <div className="w-7" />
              </div>

              <div className="space-y-3 mb-4">
                {COOKIE_CATEGORIES.map(cat => (
                  <div key={cat.key} className="flex items-start justify-between gap-4 p-3.5 bg-gray-50 dark:bg-neutral-800 rounded-xl">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{cat.label}</p>
                        {cat.required && (
                          <span className="text-[9px] font-bold uppercase tracking-wide bg-gray-200 dark:bg-neutral-700 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded-full">
                            Requerida
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">{cat.description}</p>
                    </div>
                    {cat.required ? (
                      <div className="w-10 h-5 rounded-full bg-black dark:bg-white flex-shrink-0 mt-1 relative opacity-60 cursor-not-allowed">
                        <span className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-white dark:bg-black shadow-sm" />
                      </div>
                    ) : (
                      <div className="mt-1">
                        <Toggle
                          checked={prefs[cat.key as 'analytics' | 'marketing']}
                          onChange={(v) => setPrefs(p => ({ ...p, [cat.key]: v }))}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="text-[11px] text-gray-400 dark:text-gray-500 mb-4 leading-relaxed">
                Conforme al <strong>RGPD</strong> y la Ley española de cookies. Puedes cambiar tus preferencias en cualquier momento desde{' '}
                <Link href="/legal/cookies" className="underline underline-offset-1 hover:text-gray-600 dark:hover:text-gray-300">nuestra política de cookies</Link>.
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => save({ necessary: true, analytics: false, marketing: false })}
                  className="py-2.5 text-xs font-semibold text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-neutral-700 rounded-xl hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
                >
                  Solo esenciales
                </button>
                <button
                  onClick={() => save(prefs)}
                  className="py-2.5 text-xs font-bold text-white dark:text-black bg-black dark:bg-white rounded-xl hover:opacity-90 transition-opacity"
                >
                  Guardar selección
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
