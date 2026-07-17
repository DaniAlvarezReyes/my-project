'use client';
import AccountSidebar from '@/components/AccountSidebar';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MainNav } from '@/components/MainNav';
import { Footer } from '@/components/Footer';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { OrderCardSkeleton } from '@/components/Skeletons';

export default function PedidosPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    if (user?.id) {
      loadOrders();
    } else {
      setLoading(false);
    }
  }, [authLoading, isAuthenticated, user?.id]);

  const cancelOrder = async (orderId: string) => {
    if (!confirm('¿Seguro que quieres cancelar este pedido?')) return;
    setCancellingId(orderId);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', orderId)
        .eq('user_id', user!.id)
        .eq('status', 'pending');
      if (!error) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'cancelled' } : o));
      }
    } catch (err) {
      console.error('Error cancelling order:', err);
    } finally {
      setCancellingId(null);
    }
  };

  const loadOrders = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) console.error('Error loading orders:', error.message);
      if (data) setOrders(data);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  // Por ahora, datos ficticios hasta conectar con Supabase
  // const orders = [];

  return (
    <div className="min-h-screen bg-gray-50">
      <MainNav />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Mis Pedidos</h1>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <AccountSidebar />

          {/* Lista de pedidos */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="space-y-4">
                {[1,2,3].map(i => <OrderCardSkeleton key={i} />)}
              </div>
            ) : orders.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <svg className="mx-auto h-24 w-24 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                  No tienes pedidos todavía
                </h2>
                <p className="text-gray-600 mb-6">
                  Cuando realices una compra, aparecerá aquí
                </p>
                <Link href="/productos">
                  <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium">
                    Explorar Productos
                  </button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-sm text-gray-600">Pedido #{order.id.slice(0, 8)}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(order.created_at).toLocaleDateString('es-ES')}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        order.status === 'completed' ? 'bg-green-100 text-green-800' :
                        order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.status === 'completed' ? 'Completado' :
                         order.status === 'processing' ? 'Procesando' :
                         order.status === 'pending' ? 'Pendiente' :
                         order.status === 'cancelled' ? 'Cancelado' : order.status}
                      </span>
                    </div>
                    <div className="border-t pt-4">
                      <p className="text-2xl font-bold text-gray-900">€{order.total.toFixed(2)}</p>
                      {order.tracking_number && (
                        <div className="mt-2 flex items-center gap-2 text-sm">
                          <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
                          <span className="text-gray-600">Seguimiento:</span>
                          <a
                            href={`/seguimiento?n=${order.tracking_number}&pedido=${order.id}`}
                            className="font-mono font-semibold text-blue-700 hover:text-blue-900 hover:underline"
                          >
                            {order.tracking_number}
                          </a>
                        </div>
                      )}
                      <div className="flex gap-2 mt-3">
                        <Link href={`/cuenta/pedidos/${order.id}`} className="flex-1">
                          <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
                            Ver Detalles
                          </button>
                        </Link>
                        {(order.status === 'processing' || order.status === 'completed') && (
                          <a
                            href={`/seguimiento?pedido=${order.id}${order.tracking_number ? `&n=${order.tracking_number}` : ''}`}
                            className="px-4 py-2 border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 font-medium text-sm flex items-center gap-1 whitespace-nowrap"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
                            Rastrear
                          </a>
                        )}
                        {order.status === 'pending' && (
                          <button
                            onClick={() => cancelOrder(order.id)}
                            disabled={cancellingId === order.id}
                            className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 font-medium text-sm disabled:opacity-50"
                          >
                            {cancellingId === order.id ? 'Cancelando...' : 'Cancelar'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
