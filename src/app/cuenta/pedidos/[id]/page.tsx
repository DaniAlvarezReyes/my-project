'use client';
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { MainNav } from '@/components/MainNav';
import { Footer } from '@/components/Footer';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

export default function OrderDetailPage() {
  const params = useParams();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    if (params.id) loadOrder();
  }, [isAuthenticated, authLoading, params.id]);

  const loadOrder = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items:order_items(
            id, product_id, quantity, price, selected_size, selected_color,
            product:products(name, images, brand)
          )
        `)
        .eq('id', params.id)
        .maybeSingle();
      
      if (error) {
        console.error('Error loading order:', error.message);
      }
      if (data) setOrder(data);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <MainNav />
        <div className="flex items-center justify-center py-24">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando pedido...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50">
        <MainNav />
        <div className="max-w-7xl mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Pedido no encontrado</h1>
          <Link href="/cuenta/pedidos" className="text-blue-600">← Volver a pedidos</Link>
        </div>
      </div>
    );
  }

  const shippingAddress = (() => {
    try {
      return typeof order.shipping_address === 'string' 
        ? JSON.parse(order.shipping_address) 
        : order.shipping_address;
    } catch { return null; }
  })();

  return (
    <div className="min-h-screen bg-gray-50">
      <MainNav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-6">
          <Link href="/cuenta/pedidos" className="text-blue-600 hover:text-blue-800">
            ← Volver a mis pedidos
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold">Pedido #{order.id.slice(0, 8)}</h1>
              <p className="text-gray-600">
                {new Date(order.created_at).toLocaleDateString('es-ES', {
                  year: 'numeric', month: 'long', day: 'numeric',
                  hour: '2-digit', minute: '2-digit'
                })}
              </p>
            </div>
            <span className={`px-4 py-2 rounded-full font-semibold ${
              order.status === 'delivered' ? 'bg-green-100 text-green-800' :
              order.status === 'shipped' ? 'bg-indigo-100 text-indigo-800' :
              order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
              order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
              order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {order.status === 'delivered' ? 'Entregado' :
               order.status === 'shipped' ? 'Enviado' :
               order.status === 'processing' ? 'Procesando' :
               order.status === 'pending' ? 'Pendiente' :
               order.status === 'cancelled' ? 'Cancelado' : order.status}
            </span>
          </div>

          {/* Order items */}
          {order.order_items && order.order_items.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold mb-4">Productos</h3>
              <div className="space-y-3">
                {order.order_items.map((item: any) => (
                  <div key={item.id} className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                    {item.product?.images?.[0] && (
                      <img src={item.product.images[0]} alt="" className="w-20 h-20 object-cover rounded-lg" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{item.product?.name || item.product_id}</p>
                      <p className="text-sm text-gray-600">{item.product?.brand}</p>
                      <div className="flex gap-4 mt-1 text-sm text-gray-500">
                        {item.selected_size && <span>Talla: {item.selected_size}</span>}
                        {item.selected_color && <span>Color: {item.selected_color}</span>}
                        <span>Cantidad: {item.quantity}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">€{(item.price * item.quantity).toFixed(2)}</p>
                      <p className="text-sm text-gray-500">€{item.price?.toFixed(2)}/u</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Dirección de Envío</h3>
              {shippingAddress ? (
                <div className="text-sm text-gray-700">
                  <p>{shippingAddress.name} {shippingAddress.lastName}</p>
                  <p>{shippingAddress.street}</p>
                  <p>{shippingAddress.city}, {shippingAddress.state} {shippingAddress.postalCode}</p>
                  <p>{shippingAddress.country}</p>
                  {shippingAddress.phone && <p className="mt-2">Tel: {shippingAddress.phone}</p>}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No disponible</p>
              )}
            </div>

            {order.tracking_number && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Número de Seguimiento</h3>
                <p className="font-mono text-lg text-blue-600">{order.tracking_number}</p>
              </div>
            )}
          </div>

          <div className="border-t pt-6">
            <h3 className="font-semibold mb-4">Detalles del Pedido</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>€{order.subtotal?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Envío</span>
                <span>{order.shipping === 0 ? <span className="text-green-600">GRATIS</span> : `€${order.shipping?.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between text-xl font-bold border-t pt-3">
                <span>Total</span>
                <span className="text-blue-600">€{order.total?.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
