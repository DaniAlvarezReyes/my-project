'use client';
import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { MainNav } from '@/components/MainNav';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/Button';
import { useCart } from '@/context/CartContext';
import { supabase } from '@/lib/supabase';

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { clearCart } = useCart();
  const [sessionId, setSessionId] = useState('');
  const [processed, setProcessed] = useState(false);

  useEffect(() => {
    const processSuccess = async () => {
      if (processed) return;

      const session = searchParams.get('session_id');
      if (session) {
        setSessionId(session);
        
        // Actualizar el pedido en Supabase
        const pendingOrderId = localStorage.getItem('pendingOrderId');
        if (pendingOrderId) {
          try {
            const { error } = await supabase
              .from('orders')
              .update({ 
                status: 'processing',
                payment_intent_id: session 
              })
              .eq('id', pendingOrderId);

            if (error) {
              console.error('Error updating order:', error);
            }

            // Limpiar localStorage
            localStorage.removeItem('pendingOrderId');
          } catch (err) {
            console.error('Error:', err);
          }
        }

        // Limpiar el carrito
        clearCart();
        setProcessed(true);
      } else {
        // Si no hay session_id, redirigir al inicio
        router.push('/');
      }
    };

    processSuccess();
  }, [searchParams, clearCart, router, processed]);

  return (
    <div className="min-h-screen bg-gray-50">
      <MainNav />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          {/* Icono de éxito */}
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            ¡Pago Completado con Éxito!
          </h1>

          <p className="text-lg text-gray-600 mb-8">
            Gracias por tu compra. Hemos recibido tu pedido y comenzaremos a procesarlo de inmediato.
          </p>

          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              <div>
                <p className="text-sm text-gray-600 mb-1">ID de Transacción</p>
                <p className="font-mono text-sm font-semibold break-all">
                  {sessionId}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Estado</p>
                <p className="font-semibold text-green-600">Pagado</p>
              </div>
            </div>
          </div>

          <div className="space-y-4 mb-8">
            <div className="flex items-start gap-3 text-left">
              <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <div>
                <p className="font-semibold">Confirmación enviada</p>
                <p className="text-sm text-gray-600">
                  Hemos enviado un email de confirmación con los detalles de tu pedido.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 text-left">
              <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <div>
                <p className="font-semibold">Preparando tu pedido</p>
                <p className="text-sm text-gray-600">
                  Lo prepararemos con cuidado y lo enviaremos en las próximas 24-48 horas.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 text-left">
              <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
              <div>
                <p className="font-semibold">Envío en 3-5 días laborables</p>
                <p className="text-sm text-gray-600">
                  Recibirás un número de seguimiento cuando se envíe tu pedido.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/cuenta/pedidos">
              <Button variant="primary" size="lg">
                Ver Mis Pedidos
              </Button>
            </Link>
            <Link href="/productos">
              <Button variant="outline" size="lg">
                Seguir Comprando
              </Button>
            </Link>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              ¿Necesitas ayuda?{' '}
              <Link href="/contacto" className="text-blue-600 hover:text-blue-700 font-medium">
                Contáctanos
              </Link>
            </p>
          </div>
        </div>
      </div>

      <Footer
        siteName="Sneakers Pro"
        description="Tu tienda de confianza"
        sections={[]}
        socialLinks={[]}
      />
    </div>
  );
}
