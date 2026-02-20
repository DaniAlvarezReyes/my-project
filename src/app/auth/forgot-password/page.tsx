'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { TextField } from '@/components/TextField';
import { Button } from '@/components/Button';
import { supabase } from '@/lib/supabase';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        setError(error.message);
      } else {
        setSuccess(true);
      }
    } catch (err: any) {
      setError('Error al enviar el correo. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/" className="flex justify-center">
          <div className="flex items-center space-x-2">
            <svg className="w-10 h-10 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.8 7.4c.6-.8 1-1.8 1-2.9 0-2.8-2.2-5-5-5-1.1 0-2.1.4-2.9 1L12 2.3 10.1.6C9.3.4 8.4 0 7.5 0 4.7 0 2.5 2.2 2.5 5c0 1.1.3 2.1 1 2.9L12 17.4l8.8-10z"/>
            </svg>
            <span className="text-2xl font-bold text-gray-900">Sneakers Pro</span>
          </div>
        </Link>
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          Recupera tu contraseña
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          ¿Recordaste tu contraseña?{' '}
          <Link href="/auth/login" className="font-medium text-blue-600 hover:text-blue-500">
            Inicia sesión
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {success ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Correo Enviado
              </h3>
              <p className="text-gray-600 mb-6">
                Te hemos enviado un correo electrónico con instrucciones para restablecer tu contraseña.
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Si no lo recibes en unos minutos, revisa tu carpeta de spam.
              </p>
              <Link href="/auth/login">
                <Button variant="primary" fullWidth>
                  Volver al Login
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <p className="text-sm text-gray-600">
                  Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {error}
                  </div>
                )}

                <TextField
                  label="Correo Electrónico"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  required
                  fullWidth
                  disabled={loading}
                />

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  disabled={loading}
                >
                  {loading ? 'Enviando...' : 'Enviar Instrucciones'}
                </Button>

                <div className="text-center">
                  <Link href="/auth/login" className="text-sm text-gray-600 hover:text-gray-900">
                    ← Volver al login
                  </Link>
                </div>
              </form>
            </>
          )}
        </div>

        {/* Info adicional */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            ¿Necesitas ayuda? Contáctanos en{' '}
            <a href="mailto:soporte@sneakerspro.com" className="text-blue-600 hover:text-blue-700">
              soporte@sneakerspro.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
