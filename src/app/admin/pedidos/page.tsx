'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function AdminPedidos() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    const { data } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setOrders(data);
    setLoading(false);
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId);
    
    loadOrders();
  };

  const filteredOrders = filter === 'all' 
    ? orders 
    : orders.filter(o => o.status === filter);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Gestión de Pedidos ({orders.length})</h1>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex gap-2">
          {['all', 'pending', 'processing', 'completed', 'cancelled'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium ${
                filter === status 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status === 'all' ? 'Todos' : status}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de pedidos */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID Pedido</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredOrders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">#{order.id.slice(0, 8)}</td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {new Date(order.created_at).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">{order.user_email || 'N/A'}</td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">€{order.total.toFixed(2)}</td>
                <td className="px-6 py-4">
                  <select
                    value={order.status}
                    onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold border-0 ${
                      order.status === 'completed' ? 'bg-green-100 text-green-800' :
                      order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                      order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <option value="pending">Pendiente</option>
                    <option value="processing">Procesando</option>
                    <option value="completed">Completado</option>
                    <option value="cancelled">Cancelado</option>
                  </select>
                </td>
                <td className="px-6 py-4 text-sm">
                  <button className="text-blue-600 hover:text-blue-800">Ver detalles</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
