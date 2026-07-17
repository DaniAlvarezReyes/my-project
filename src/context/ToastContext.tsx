'use client';
import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import Link from 'next/link';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration: number;
  createdAt: number;
}

export interface CartToastData {
  productId: string;
  name: string;
  image?: string;
  price: number;
  currency?: string;
  size?: string;
  color?: string;
  quantity: number;
}

interface ToastContextType {
  showToast: (message: string, type?: Toast['type'], duration?: number) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  cartAdd: (data: CartToastData) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
};

/* ─── Standard toast item ─────────────────────────────────────────────────── */
const ToastItem: React.FC<{ toast: Toast; onDismiss: (id: string) => void }> = ({ toast, onDismiss }) => {
  const [isExiting, setIsExiting] = useState(false);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / toast.duration) * 100);
      setProgress(remaining);
      if (remaining <= 0) clearInterval(interval);
    }, 50);

    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onDismiss(toast.id), 300);
    }, toast.duration);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [toast.id, toast.duration, onDismiss]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => onDismiss(toast.id), 300);
  };

  const config = {
    success: {
      bg: 'bg-white',
      border: 'border-green-500',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      progressColor: 'bg-green-500',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      ),
    },
    error: {
      bg: 'bg-white',
      border: 'border-red-500',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      progressColor: 'bg-red-500',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
        </svg>
      ),
    },
    warning: {
      bg: 'bg-white',
      border: 'border-amber-500',
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      progressColor: 'bg-amber-500',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
    },
    info: {
      bg: 'bg-white',
      border: 'border-blue-500',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      progressColor: 'bg-blue-500',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  };

  const c = config[toast.type];

  return (
    <div
      className={`
        ${c.bg} border-l-4 ${c.border} rounded-lg shadow-xl
        flex items-start gap-3 p-4 pr-3 min-w-[340px] max-w-[420px] relative overflow-hidden
        transform transition-all duration-300 ease-out
        ${isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'}
      `}
      style={{ animation: isExiting ? 'none' : 'slideInRight 0.35s ease-out' }}
    >
      <div className={`flex-shrink-0 w-8 h-8 rounded-full ${c.iconBg} ${c.iconColor} flex items-center justify-center`}>
        {c.icon}
      </div>
      <p className="flex-1 text-sm font-medium text-gray-800 pt-1 leading-snug">{toast.message}</p>
      <button
        onClick={handleDismiss}
        className="flex-shrink-0 p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-100">
        <div className={`h-full ${c.progressColor} transition-all duration-100 ease-linear`} style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
};

/* ─── Cart toast (rich product preview) ──────────────────────────────────── */
const CART_TOAST_DURATION = 4000;

const CartToastItem: React.FC<{ data: CartToastData; onDismiss: () => void }> = ({ data, onDismiss }) => {
  const [isExiting, setIsExiting] = useState(false);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / CART_TOAST_DURATION) * 100);
      setProgress(remaining);
      if (remaining <= 0) clearInterval(interval);
    }, 50);

    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(onDismiss, 350);
    }, CART_TOAST_DURATION);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [onDismiss]);

  const dismiss = () => {
    setIsExiting(true);
    setTimeout(onDismiss, 350);
  };

  const cur = data.currency || '€';

  return (
    <div
      className={`
        bg-white dark:bg-neutral-900 rounded-xl shadow-2xl border border-neutral-100 dark:border-neutral-800
        w-[360px] max-w-[calc(100vw-2rem)] relative overflow-hidden
        transform transition-all duration-350 ease-out
        ${isExiting ? 'translate-x-full opacity-0 scale-95' : 'translate-x-0 opacity-100 scale-100'}
      `}
      style={{ animation: isExiting ? 'none' : 'slideInRight 0.4s cubic-bezier(0.16,1,0.3,1)' }}
    >
      {/* Header strip */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-neutral-100 dark:border-neutral-800">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </span>
          <span className="text-xs font-bold text-neutral-800 dark:text-neutral-100 uppercase tracking-wider">
            Añadido al carrito
          </span>
        </div>
        <button
          onClick={dismiss}
          className="p-1 rounded-full text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Product row */}
      <div className="flex gap-3 p-3">
        {/* Image */}
        <div className="w-20 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-800">
          {data.image ? (
            <img src={data.image} alt={data.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-neutral-300">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 py-0.5">
          <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 leading-snug line-clamp-2 mb-1.5">
            {data.name}
          </p>

          {/* Variants */}
          <div className="flex flex-wrap gap-1 mb-2">
            {data.size && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400">
                Talla {data.size}
              </span>
            )}
            {data.color && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400">
                {data.color}
              </span>
            )}
            {data.quantity > 1 && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                ×{data.quantity}
              </span>
            )}
          </div>

          {/* Price */}
          <p className="text-base font-bold text-neutral-900 dark:text-white">
            {cur}{(data.price * data.quantity).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="px-3 pb-3 flex gap-2">
        <Link
          href="/carrito"
          onClick={dismiss}
          className="flex-1 bg-black dark:bg-white text-white dark:text-black text-xs font-bold uppercase tracking-wider py-2.5 rounded-lg text-center hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors"
        >
          Ver carrito
        </Link>
        <button
          onClick={dismiss}
          className="flex-1 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-bold uppercase tracking-wider py-2.5 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
        >
          Seguir comprando
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-0.5 bg-neutral-100 dark:bg-neutral-800">
        <div
          className="h-full bg-black dark:bg-white transition-all duration-100 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

/* ─── Provider ────────────────────────────────────────────────────────────── */
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [cartToast, setCartToast] = useState<CartToastData | null>(null);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const dismissCart = useCallback(() => {
    setCartToast(null);
  }, []);

  const showToast = useCallback((message: string, type: Toast['type'] = 'success', duration: number = 3500) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => {
      const limited = prev.length >= 5 ? prev.slice(1) : prev;
      return [...limited, { id, message, type, duration, createdAt: Date.now() }];
    });
  }, []);

  const success = useCallback((msg: string, dur?: number) => showToast(msg, 'success', dur), [showToast]);
  const error = useCallback((msg: string, dur?: number) => showToast(msg, 'error', dur ?? 5000), [showToast]);
  const info = useCallback((msg: string, dur?: number) => showToast(msg, 'info', dur), [showToast]);
  const warning = useCallback((msg: string, dur?: number) => showToast(msg, 'warning', dur ?? 4500), [showToast]);

  const cartAdd = useCallback((data: CartToastData) => {
    // Replace any existing cart toast immediately
    setCartToast(null);
    setTimeout(() => setCartToast(data), 10);
  }, []);

  const ctxValue = useMemo(
    () => ({ showToast, success, error, info, warning, cartAdd }),
    [showToast, success, error, info, warning, cartAdd]
  );

  return (
    <ToastContext.Provider value={ctxValue}>
      {children}

      {/* Standard toast container */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
        {toasts.map(toast => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem toast={toast} onDismiss={dismiss} />
          </div>
        ))}
      </div>

      {/* Cart toast container (bottom-right, above standard toasts level) */}
      {cartToast && (
        <div className="fixed bottom-6 right-4 z-[9998] pointer-events-auto">
          <CartToastItem data={cartToast} onDismiss={dismissCart} />
        </div>
      )}
    </ToastContext.Provider>
  );
};
