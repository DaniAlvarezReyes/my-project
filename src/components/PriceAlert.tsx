'use client';
import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';

interface PriceAlertProps {
  productId: string;
  productName: string;
  currentPrice: number;
}

export default function PriceAlert({ productId, productName, currentPrice }: PriceAlertProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [targetPrice, setTargetPrice] = useState(Math.floor(currentPrice * 0.9));
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const alertEmail = email.trim() || user?.email;
    if (!alertEmail) { toast.warning('Introduce tu email'); return; }
    if (targetPrice >= currentPrice) { toast.warning('El precio objetivo debe ser menor al precio actual'); return; }

    setLoading(true);
    try {
      const { error } = await supabase.from('price_alerts').insert({
        product_id: productId,
        email: alertEmail,
        target_price: targetPrice,
        current_price: currentPrice,
      });
      if (error && error.code !== '23505') throw error;
      setSubmitted(true);
      toast.success(`Te avisamos si "${productName}" baja de €${targetPrice}`);
    } catch {
      toast.error('Error al registrar la alerta de precio');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800">
        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        <span>Te avisamos si baja de <strong>€{targetPrice}</strong></span>
      </div>
    );
  }

  return (
    <div>
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          Avisarme si baja el precio
        </button>
      ) : (
        <div className="bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Alerta de bajada de precio</p>
            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-lg leading-none">×</button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Precio actual: <span className="font-bold text-gray-900 dark:text-white">€{currentPrice.toFixed(2)}</span>. Te avisaremos cuando baje de tu precio objetivo.
          </p>
          <form onSubmit={handleSubmit} className="space-y-2.5">
            <div>
              <label className="text-[11px] text-gray-400 uppercase tracking-wider block mb-1">Precio objetivo (€)</label>
              <input
                type="number"
                min={1}
                max={currentPrice - 0.01}
                step={0.01}
                value={targetPrice}
                onChange={(e) => setTargetPrice(parseFloat(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent"
              />
              <p className="text-[10px] text-gray-400 mt-1">
                {targetPrice < currentPrice
                  ? `Ahorro estimado: €${(currentPrice - targetPrice).toFixed(2)} (${Math.round((1 - targetPrice/currentPrice)*100)}%)`
                  : 'El precio objetivo debe ser menor al actual'}
              </p>
            </div>
            {!user?.email && (
              <div>
                <label className="text-[11px] text-gray-400 uppercase tracking-wider block mb-1">Tu email *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent"
                />
              </div>
            )}
            {user?.email && (
              <p className="text-xs text-gray-400">Notificación a: <span className="font-medium text-gray-600 dark:text-gray-300">{user.email}</span></p>
            )}
            <button
              type="submit"
              disabled={loading || targetPrice >= currentPrice}
              className="w-full py-2.5 bg-black dark:bg-white text-white dark:text-black text-sm font-bold rounded-xl hover:opacity-90 disabled:opacity-40 transition-opacity flex items-center justify-center gap-2"
            >
              {loading ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
              )}
              Activar alerta de precio
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
