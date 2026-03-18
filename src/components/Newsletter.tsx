'use client';
import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/context/ToastContext';

export const Newsletter: React.FC = () => {
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('newsletter_subscribers')
        .insert({ email, name });

      if (error) {
        if (error.code === '23505') {
          toast.info('Este email ya está suscrito');
        } else {
          throw error;
        }
      } else {
        setSuccess(true);
        setEmail('');
        setName('');
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err) {
      toast.error('Error al suscribirse');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-12 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl font-bold mb-2">¡Suscríbete a nuestro Newsletter!</h2>
        <p className="mb-6 text-blue-100">Recibe ofertas exclusivas y novedades directamente en tu email</p>
        
        {success ? (
          <div className="bg-green-500 text-white px-6 py-3 rounded-lg inline-block">
            ✓ ¡Suscripción exitosa! Revisa tu email.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tu nombre"
              className="flex-1 px-4 py-3 rounded-lg text-gray-900"
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              className="flex-1 px-4 py-3 rounded-lg text-gray-900"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 disabled:opacity-50"
            >
              {loading ? 'Enviando...' : 'Suscribirse'}
            </button>
          </form>
        )}
        
        <p className="mt-4 text-sm text-blue-100">
          No spam. Puedes cancelar cuando quieras.
        </p>
      </div>
    </div>
  );
};
