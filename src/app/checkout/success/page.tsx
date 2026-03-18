'use client';
import React, { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { MainNav } from '@/components/MainNav';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/Button';
import { useCart } from '@/context/CartContext';
import { supabase } from '@/lib/supabase';

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { clearCart } = useCart();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const processedRef = useRef(false);

  useEffect(() => {
    if (processedRef.current) return;
    processedRef.current = true;

    const process = async () => {
      const orderId = searchParams.get('order_id') || localStorage.getItem('pendingOrderId');
      const method = searchParams.get('method') || 'stripe';
      const sessionId = searchParams.get('session_id');

      if (!orderId) {
        router.push('/');
        return;
      }

      try {
        if (method === 'stripe' && sessionId) {
          await supabase
            .from('orders')
            .update({ status: 'processing', payment_intent_id: sessionId })
            .eq('id', orderId)
            .eq('status', 'pending');
        }

        const { data } = await supabase
          .from('orders')
          .select(`
            *,
            order_items:order_items(
              id, product_id, quantity, price, selected_size, selected_color,
              product:products(name, images, brand)
            )
          `)
          .eq('id', orderId)
          .maybeSingle();

        if (data) setOrder(data);

        clearCart();
        localStorage.removeItem('pendingOrderId');
      } catch (err) {
        console.error('Error loading order:', err);
      } finally {
        setLoading(false);
      }
    };

    process();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <MainNav />
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
        </div>
      </div>
    );
  }

  const shippingAddress = (() => {
    try {
      return typeof order?.shipping_address === 'string'
        ? JSON.parse(order.shipping_address)
        : order?.shipping_address;
    } catch { return null; }
  })();

  return (
    <div className="min-h-screen bg-gray-50">
      <MainNav />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-8 text-center text-white">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-1">¡Pedido Confirmado!</h1>
            <p className="text-green-100">Gracias por tu compra, {shippingAddress?.name || 'cliente'}</p>
          </div>

          <div className="p-6 space-y-6">
            {/* Order info */}
            {order && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-500 mb-1">Nº Pedido</p>
                  <p className="font-mono font-bold text-sm">#{order.id?.slice(0, 8)}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-500 mb-1">Total</p>
                  <p className="font-bold text-blue-600">€{order.total?.toFixed(2)}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-500 mb-1">Método</p>
                  <p className="font-medium text-sm capitalize">{order.payment_method === 'card' ? 'Tarjeta' : 'PayPal'}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-500 mb-1">Estado</p>
                  <p className="font-medium text-sm text-green-600">Procesando</p>
                </div>
              </div>
            )}

            {/* Order items */}
            {order?.order_items && order.order_items.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">Productos</h3>
                <div className="space-y-3">
                  {order.order_items.map((item: any) => (
                    <div key={item.id} className="flex gap-3 p-3 bg-gray-50 rounded-xl">
                      {item.product?.images?.[0] && (
                        <img src={item.product.images[0]} alt="" className="w-14 h-14 object-cover rounded-lg" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{item.product?.name}</p>
                        <p className="text-xs text-gray-500">
                          x{item.quantity}
                          {item.selected_size && ` · T.${item.selected_size}`}
                          {item.selected_color && ` · ${item.selected_color}`}
                        </p>
                      </div>
                      <span className="text-sm font-bold">€{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Shipping address */}
            {shippingAddress && (
              <div className="bg-blue-50 rounded-xl p-4">
                <h3 className="font-semibold text-sm text-blue-900 mb-2">Envío a</h3>
                <p className="text-sm text-blue-800">
                  {shippingAddress.name} {shippingAddress.lastName}<br />
                  {shippingAddress.street}<br />
                  {shippingAddress.city}, {shippingAddress.state} {shippingAddress.postalCode}
                </p>
              </div>
            )}

            {/* Next steps */}
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-lg">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                </div>
                <div>
                  <p className="text-sm font-medium">Confirmación enviada</p>
                  <p className="text-xs text-gray-500">Recibirás un email con los detalles del pedido</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                </div>
                <div>
                  <p className="text-sm font-medium">Preparando tu pedido</p>
                  <p className="text-xs text-gray-500">Lo enviaremos en las próximas 24-48h</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
                </div>
                <div>
                  <p className="text-sm font-medium">Entrega en 3-5 días laborables</p>
                  <p className="text-xs text-gray-500">Recibirás un número de seguimiento por email</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
              <Link href="/cuenta/pedidos" className="flex-1">
                <Button variant="primary" size="lg" fullWidth>Ver Mis Pedidos</Button>
              </Link>
              <Link href="/productos" className="flex-1">
                <Button variant="outline" size="lg" fullWidth>Seguir Comprando</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>}>
      <SuccessContent />
    </Suspense>
  );
}
