'use client';
import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';

export default function StockAlert({ productId, productName }: { productId: string; productName: string }) {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const alertEmail = email || user?.email;
    if (!alertEmail) { toast.warning('Introduce tu email'); return; }
    setLoading(true);
    try {
      await supabase.from('stock_alerts').insert({ product_id: productId, email: alertEmail });
      setSubmitted(true);
      toast.success('Te avisaremos cuando esté disponible');
    } catch {
      toast.error('Error al registrar la alerta');
    } finally { setLoading(false); }
  };

  if (submitted) {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 text-center">
        <p className="text-sm text-green-700 dark:text-green-400 font-medium">✓ Te avisaremos cuando "{productName}" esté disponible</p>
      </div>
    );
  }

  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
      <p className="text-sm font-medium text-amber-800 dark:text-amber-300 mb-3">⚡ Producto agotado — Recibe una alerta cuando vuelva</p>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={user?.email || 'tu@email.com'}
          className="flex-1 px-3 py-2 text-sm border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 bg-white dark:bg-gray-800 dark:border-gray-600"
        />
        <button type="submit" disabled={loading} className="px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 disabled:opacity-50">
          {loading ? '...' : 'Avisarme'}
        </button>
      </form>
    </div>
  );
}
