'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState({
    necessary: true,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      // Small delay so it doesn't flash on load
      const timer = setTimeout(() => setVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const acceptAll = () => {
    const consent = { necessary: true, analytics: true, marketing: true, timestamp: Date.now() };
    localStorage.setItem('cookie-consent', JSON.stringify(consent));
    setVisible(false);
  };

  const acceptNecessary = () => {
    const consent = { necessary: true, analytics: false, marketing: false, timestamp: Date.now() };
    localStorage.setItem('cookie-consent', JSON.stringify(consent));
    setVisible(false);
  };

  const savePreferences = () => {
    const consent = { ...preferences, timestamp: Date.now() };
    localStorage.setItem('cookie-consent', JSON.stringify(consent));
    setVisible(false);
    setShowPreferences(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9998] animate-slideUp">
      <div className="bg-white border-t border-gray-200 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {!showPreferences ? (
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1">
                <p className="text-sm text-gray-700">
                  Usamos cookies para mejorar tu experiencia de compra. Las cookies esenciales son necesarias
                  para el funcionamiento del sitio. Puedes aceptar todas o personalizar tus preferencias.{' '}
                  <Link href="/legal/cookies" className="text-blue-600 hover:underline font-medium">
                    Más información
                  </Link>
                </p>
              </div>
              <div className="flex flex-wrap gap-2 flex-shrink-0">
                <button
                  onClick={() => setShowPreferences(true)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Personalizar
                </button>
                <button
                  onClick={acceptNecessary}
                  className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Solo esenciales
                </button>
                <button
                  onClick={acceptAll}
                  className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Aceptar todas
                </button>
              </div>
            </div>
          ) : (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Preferencias de cookies</h3>
              <div className="space-y-3 mb-4">
                <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <span className="font-medium text-sm text-gray-900">Esenciales</span>
                    <p className="text-xs text-gray-500">Necesarias para el funcionamiento de la tienda</p>
                  </div>
                  <input type="checkbox" checked disabled className="w-4 h-4 rounded" />
                </label>
                <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                  <div>
                    <span className="font-medium text-sm text-gray-900">Analíticas</span>
                    <p className="text-xs text-gray-500">Nos ayudan a entender cómo usas la web</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.analytics}
                    onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                    className="w-4 h-4 rounded text-blue-600"
                  />
                </label>
                <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                  <div>
                    <span className="font-medium text-sm text-gray-900">Marketing</span>
                    <p className="text-xs text-gray-500">Permiten mostrarte ofertas personalizadas</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.marketing}
                    onChange={(e) => setPreferences({ ...preferences, marketing: e.target.checked })}
                    className="w-4 h-4 rounded text-blue-600"
                  />
                </label>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowPreferences(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Volver
                </button>
                <button
                  onClick={savePreferences}
                  className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  Guardar preferencias
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
