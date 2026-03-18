'use client';
import React from 'react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="es">
      <body className="bg-gray-50 min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="mb-6">
            <span className="text-6xl font-bold text-red-500">Error</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Algo salió mal</h1>
          <p className="text-gray-600 mb-8 text-sm">
            Ha ocurrido un error inesperado. Puedes intentar recargar la página o volver al inicio.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={reset}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Intentar de nuevo
            </button>
            <Link
              href="/"
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Volver al Inicio
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
