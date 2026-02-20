'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { TextField } from '@/components/TextField';
import { Button } from '@/components/Button';
import { supabase } from '@/lib/supabase';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Verificar si hay un token válido
  useEffect(() => {
    const checkToken = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('El enlace de recuperación es inválido o ha expirado.');
      }
    };
    checkToken();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validaciones
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        setError(error.message);
      } else {
        setSuccess(true);
        // Redirigir al login después de 3 segundos
        setTimeout(() => {
          router.push('/auth/login');
        }, 3000);
      }
    } catch (err: any) {
      setError('Error al actualizar la contraseña. Intenta de nuevo.');
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
          Nueva Contraseña
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Ingresa tu nueva contraseña para tu cuenta
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
                ¡Contraseña Actualizada!
              </h3>
              <p className="text-gray-600 mb-6">
                Tu contraseña ha sido cambiada exitosamente.
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Redirigiendo al login...
              </p>
              <Link href="/auth/login">
                <Button variant="primary" fullWidth>
                  Ir al Login
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <div>
                <TextField
                  label="Nueva Contraseña"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required
                  fullWidth
                  disabled={loading}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Usa al menos 6 caracteres con una combinación de letras y números
                </p>
              </div>

              <TextField
                label="Confirmar Contraseña"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite tu contraseña"
                required
                fullWidth
                disabled={loading}
              />

              {/* Indicador de fortaleza */}
              {password.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          password.length < 6
                            ? 'w-1/3 bg-red-500'
                            : password.length < 10
                            ? 'w-2/3 bg-yellow-500'
                            : 'w-full bg-green-500'
                        }`}
                      />
                    </div>
                    <span className="text-xs text-gray-600">
                      {password.length < 6
                        ? 'Débil'
                        : password.length < 10
                        ? 'Media'
                        : 'Fuerte'}
                    </span>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                disabled={loading || !password || !confirmPassword}
              >
                {loading ? 'Actualizando...' : 'Actualizar Contraseña'}
              </Button>

              <div className="text-center">
                <Link href="/auth/login" className="text-sm text-gray-600 hover:text-gray-900">
                  ← Volver al login
                </Link>
              </div>
            </form>
          )}
        </div>

        {/* Consejos de seguridad */}
        <div className="mt-6 bg-blue-50 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">
            💡 Consejos para una contraseña segura:
          </h4>
          <ul className="text-xs text-blue-800 space-y-1">
            <li>• Usa al menos 8-12 caracteres</li>
            <li>• Combina letras mayúsculas y minúsculas</li>
            <li>• Incluye números y símbolos</li>
            <li>• No uses información personal</li>
            <li>• No reutilices contraseñas de otras cuentas</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
