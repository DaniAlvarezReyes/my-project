'use client';
import React, { useState, useEffect } from 'react';

export default function PushNotificationPrompt() {
  const [show, setShow] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if (!('Notification' in window)) return;
    setPermission(Notification.permission);
    if (Notification.permission === 'default') {
      const dismissed = localStorage.getItem('push-dismissed');
      if (!dismissed) {
        const timer = setTimeout(() => setShow(true), 10000);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  const requestPermission = async () => {
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === 'granted') {
        new Notification('Sneakers Pro', {
          body: '¡Genial! Te notificaremos sobre ofertas y actualizaciones de pedidos.',
          icon: '/icons/icon-192.png',
        });
      }
    } catch {}
    setShow(false);
  };

  const dismiss = () => {
    localStorage.setItem('push-dismissed', 'true');
    setShow(false);
  };

  if (!show || permission !== 'default') return null;

  return (
    <div className="fixed bottom-20 right-4 z-40 max-w-sm bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 p-5 animate-slideUp">
      <div className="flex gap-3">
        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </div>
        <div className="flex-1">
          <p className="font-semibold text-sm text-gray-900 dark:text-white">¿Activar notificaciones?</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Recibe alertas de ofertas y actualizaciones de pedidos</p>
          <div className="flex gap-2 mt-3">
            <button onClick={requestPermission} className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700">
              Activar
            </button>
            <button onClick={dismiss} className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400">
              Ahora no
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
