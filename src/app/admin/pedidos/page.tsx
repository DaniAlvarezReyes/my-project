'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/context/ToastContext';

export default function AdminPedidos() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const toast = useToast();

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const { data } = await supabase
        .from('orders')
        .select(`
          *,
          order_items:order_items(
            id,
            product_id,
            quantity,
            price,
            selected_size,
            selected_color,
            product:products(name, images, brand)
          )
        `)
        .order('created_at', { ascending: false });
      if (data) setOrders(data);
    } catch (error) {
      console.warn('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId: string, newStatus: string) => {
    try {
      await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
      loadOrders();
    } catch (error) {
      console.warn('Error updating status:', error);
    }
  };

  const exportCSV = () => {
    const csv = [
      ['ID', 'Fecha', 'Cliente', 'Total', 'Estado'].join(','),
      ...orders.map(o => [o.id.slice(0,8), new Date(o.created_at).toLocaleDateString(), o.user_email, o.total, o.status].join(','))
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pedidos.csv';
    a.click();
  };

  const filteredOrders = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  if (loading) return <div className="text-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Pedidos ({orders.length})</h1>
        <button onClick={exportCSV} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">📥 Exportar</button>
      </div>
      <div className="bg-white rounded-lg shadow p-4 flex gap-2 flex-wrap">
        {['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'].map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === s ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>
            {s === 'all' ? 'Todos' : s === 'pending' ? 'Pendientes' : s === 'processing' ? 'Procesando' : s === 'shipped' ? 'Enviados' : s === 'delivered' ? 'Entregados' : 'Cancelados'}
          </button>
        ))}
      </div>
      <div className="bg-white rounded-lg shadow">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order) => (
              <tr key={order.id} className="border-t hover:bg-gray-50">
                <td className="px-6 py-4 font-mono text-sm">#{order.id.slice(0,8)}</td>
                <td className="px-6 py-4 text-sm">{new Date(order.created_at).toLocaleDateString('es-ES')}</td>
                <td className="px-6 py-4 text-sm">{order.user_email || 'N/A'}</td>
                <td className="px-6 py-4 font-bold">€{order.total?.toFixed(2) || '0.00'}</td>
                <td className="px-6 py-4">
                  <select value={order.status} onChange={(e) => updateStatus(order.id, e.target.value)} className={`px-3 py-1 rounded-full text-xs font-semibold ${order.status === 'delivered' ? 'bg-green-100 text-green-800' : order.status === 'shipped' ? 'bg-indigo-100 text-indigo-800' : order.status === 'processing' ? 'bg-blue-100 text-blue-800' : order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : order.status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                    <option value="pending">Pendiente</option>
                    <option value="processing">Procesando</option>
                    <option value="shipped">Enviado</option>
                    <option value="delivered">Entregado</option>
                    <option value="cancelled">Cancelado</option>
                  </select>
                </td>
                <td className="px-6 py-4"><button onClick={() => setSelectedOrder(order)} className="text-blue-600">👁️ Ver</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedOrder(null)}>
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-xl font-bold">Pedido #{selectedOrder.id?.slice(0,8)}</h2>
                <p className="text-sm text-gray-500">{new Date(selectedOrder.created_at).toLocaleString('es-ES')}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Status timeline */}
              <div className="flex items-center justify-between">
                {['pending', 'processing', 'shipped', 'delivered'].map((s, i) => {
                  const statusLabels: Record<string, string> = { pending: 'Pendiente', processing: 'Procesando', shipped: 'Enviado', delivered: 'Entregado' };
                  const isCancelled = selectedOrder.status === 'cancelled';
                  const statusOrder = ['pending', 'processing', 'shipped', 'delivered'];
                  const currentIdx = statusOrder.indexOf(selectedOrder.status);
                  const isActive = !isCancelled && i <= currentIdx;
                  const isCurrent = !isCancelled && s === selectedOrder.status;
                  return (
                    <div key={s} className="flex items-center flex-1">
                      <div className="flex flex-col items-center flex-1">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                          isCurrent ? 'bg-blue-600 text-white ring-4 ring-blue-100' :
                          isActive ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
                        }`}>
                          {isActive && !isCurrent ? '✓' : i + 1}
                        </div>
                        <span className={`text-[10px] mt-1 font-medium ${isCurrent ? 'text-blue-600' : isActive ? 'text-green-600' : 'text-gray-400'}`}>
                          {statusLabels[s]}
                        </span>
                      </div>
                      {i < 3 && <div className={`h-0.5 flex-1 mx-1 ${isActive && i < currentIdx ? 'bg-green-400' : 'bg-gray-200'}`} />}
                    </div>
                  );
                })}
              </div>

              {/* Status + tracking update */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                  <select
                    value={selectedOrder.status}
                    onChange={async (e) => {
                      await updateStatus(selectedOrder.id, e.target.value);
                      setSelectedOrder({ ...selectedOrder, status: e.target.value });
                    }}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="pending">Pendiente</option>
                    <option value="processing">Procesando</option>
                    <option value="shipped">Enviado</option>
                    <option value="delivered">Entregado</option>
                    <option value="cancelled">Cancelado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nº Seguimiento</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      defaultValue={selectedOrder.tracking_number || ''}
                      placeholder="Ej: ES123456789"
                      className="flex-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                      id="tracking-input"
                    />
                    <button
                      onClick={async () => {
                        const val = (document.getElementById('tracking-input') as HTMLInputElement)?.value;
                        try {
                          await supabase.from('orders').update({ tracking_number: val, status: val ? 'shipped' : selectedOrder.status }).eq('id', selectedOrder.id);
                          setSelectedOrder({ ...selectedOrder, tracking_number: val, status: val ? 'shipped' : selectedOrder.status });
                          loadOrders();
                          toast.success(val ? 'Seguimiento guardado y pedido marcado como enviado' : 'Seguimiento actualizado');
                        } catch { toast.error('Error al guardar'); }
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                    >
                      Guardar
                    </button>
                  </div>
                </div>
              </div>

              {/* Order info grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-blue-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-blue-600 mb-0.5">Total</p>
                  <p className="font-bold text-blue-900">€{selectedOrder.total?.toFixed(2)}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-500 mb-0.5">Subtotal</p>
                  <p className="font-semibold text-gray-900">€{selectedOrder.subtotal?.toFixed(2)}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-500 mb-0.5">Envío</p>
                  <p className="font-semibold text-gray-900">{selectedOrder.shipping === 0 ? 'Gratis' : `€${selectedOrder.shipping?.toFixed(2)}`}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-500 mb-0.5">Método</p>
                  <p className="font-semibold text-gray-900 capitalize">{selectedOrder.payment_method === 'card' ? 'Tarjeta' : selectedOrder.payment_method}</p>
                </div>
              </div>

              {/* Shipping address */}
              {selectedOrder.shipping_address && (
                <div className="p-4 bg-gray-50 rounded-xl">
                  <h3 className="font-semibold text-sm mb-2">Dirección de Envío</h3>
                  {(() => {
                    try {
                      const addr = typeof selectedOrder.shipping_address === 'string'
                        ? JSON.parse(selectedOrder.shipping_address) : selectedOrder.shipping_address;
                      return (
                        <div className="text-sm text-gray-700">
                          <p className="font-medium">{addr.name} {addr.lastName}</p>
                          <p>{addr.street}</p>
                          <p>{addr.city}, {addr.state} {addr.postalCode}</p>
                          {addr.phone && <p className="mt-1 text-gray-500">Tel: {addr.phone}</p>}
                          {addr.email && <p className="text-gray-500">{addr.email}</p>}
                        </div>
                      );
                    } catch { return <p className="text-sm text-gray-400">No disponible</p>; }
                  })()}
                </div>
              )}

              {/* Items */}
              {selectedOrder.order_items && selectedOrder.order_items.length > 0 && (
                <div>
                  <h3 className="font-semibold text-sm mb-3">Productos ({selectedOrder.order_items.length})</h3>
                  <div className="space-y-2">
                    {selectedOrder.order_items.map((item: any) => (
                      <div key={item.id} className="flex gap-3 p-3 bg-gray-50 rounded-xl">
                        {item.product?.images?.[0] && (
                          <img src={item.product.images[0]} alt="" className="w-14 h-14 object-cover rounded-lg" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{item.product?.name || item.product_id}</p>
                          <div className="flex gap-3 mt-0.5 text-xs text-gray-500">
                            {item.selected_size && <span>Talla: {item.selected_size}</span>}
                            {item.selected_color && <span>Color: {item.selected_color}</span>}
                            <span>x{item.quantity}</span>
                          </div>
                        </div>
                        <p className="font-bold text-sm">€{(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
