'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MainNav } from '@/components/MainNav';
import { Footer } from '@/components/Footer';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { supabase } from '@/lib/supabase';
import AccountSidebar from '@/components/AccountSidebar';

const RETURN_REASONS = [
  'Talla incorrecta', 'No es como se muestra', 'Producto defectuoso',
  'Llegó dañado', 'Pedido incorrecto', 'Ya no lo necesito', 'Otro',
];

export default function DevolucionesPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [orders, setOrders] = useState<any[]>([]);
  const [returns, setReturns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState('');
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) { router.push('/auth/login'); return; }
    if (user?.id) loadData();
  }, [authLoading, isAuthenticated, user?.id]);

  const loadData = async () => {
    try {
      const [ordersRes, returnsRes] = await Promise.all([
        supabase.from('orders').select('id, created_at, total, status').eq('user_id', user!.id).in('status', ['processing', 'shipped', 'delivered']).order('created_at', { ascending: false }),
        supabase.from('returns').select('*, order:orders(id, total, created_at)').eq('user_id', user!.id).order('created_at', { ascending: false }),
      ]);
      setOrders(ordersRes.data || []);
      setReturns(returnsRes.data || []);
    } catch (err) { console.warn('Error loading returns:', err); }
    finally { setLoading(false); }
  };

  const submitReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !reason) { toast.warning('Selecciona un pedido y un motivo'); return; }
    setSubmitting(true);
    try {
      const { error } = await supabase.from('returns').insert({
        user_id: user!.id, order_id: selectedOrder, reason, details: details || null, status: 'requested',
      });
      if (error) throw error;
      toast.success('Solicitud de devolución enviada');
      setShowForm(false); setSelectedOrder(''); setReason(''); setDetails('');
      loadData();
    } catch (err) { toast.error('Error al enviar la solicitud'); }
    finally { setSubmitting(false); }
  };

  const statusLabel = (s: string) => ({
    requested: 'Solicitada', approved: 'Aprobada', rejected: 'Rechazada',
    in_transit: 'En tránsito', received: 'Recibida', refunded: 'Reembolsada',
  }[s] || s);

  const statusColor = (s: string) => ({
    requested: 'bg-amber-100 text-amber-700', approved: 'bg-blue-100 text-blue-700',
    rejected: 'bg-red-100 text-red-700', in_transit: 'bg-purple-100 text-purple-700',
    received: 'bg-indigo-100 text-indigo-700', refunded: 'bg-green-100 text-green-700',
  }[s] || 'bg-gray-100 text-gray-700');

  if (authLoading || loading) return <div className="min-h-screen bg-gray-50 dark:bg-gray-950"><MainNav /><div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div></div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <MainNav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Mis Devoluciones</h1>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <AccountSidebar />
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-gray-500">{returns.length} {returns.length === 1 ? 'devolución' : 'devoluciones'}</p>
              <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
                + Nueva devolución
              </button>
            </div>

        {/* Return form modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowForm(false)}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
              <h2 className="text-lg font-bold mb-4 dark:text-white">Solicitar Devolución</h2>
              <form onSubmit={submitReturn} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pedido</label>
                  <select value={selectedOrder} onChange={e => setSelectedOrder(e.target.value)} required className="w-full px-3 py-2 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                    <option value="">Seleccionar pedido...</option>
                    {orders.map(o => <option key={o.id} value={o.id}>#{o.id.slice(0,8)} — €{o.total?.toFixed(2)} — {new Date(o.created_at).toLocaleDateString('es-ES')}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Motivo</label>
                  <select value={reason} onChange={e => setReason(e.target.value)} required className="w-full px-3 py-2 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                    <option value="">Seleccionar motivo...</option>
                    {RETURN_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Detalles (opcional)</label>
                  <textarea value={details} onChange={e => setDetails(e.target.value)} rows={3} className="w-full px-3 py-2 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="Describe el problema..." />
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2 border rounded-lg text-sm dark:border-gray-600 dark:text-gray-300">Cancelar</button>
                  <button type="submit" disabled={submitting} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                    {submitting ? 'Enviando...' : 'Enviar solicitud'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Returns list */}
        {returns.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl">
            <p className="text-gray-500 dark:text-gray-400 mb-2">No tienes devoluciones</p>
            <p className="text-sm text-gray-400">Si necesitas devolver algo, haz click en "Nueva devolución"</p>
          </div>
        ) : (
          <div className="space-y-4">
            {returns.map(ret => (
              <div key={ret.id} className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-sm dark:text-white">Pedido #{ret.order?.id?.slice(0,8)}</p>
                    <p className="text-xs text-gray-500">{new Date(ret.created_at).toLocaleDateString('es-ES')}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{ret.reason}</p>
                    {ret.details && <p className="text-xs text-gray-500 mt-1">{ret.details}</p>}
                    {ret.admin_notes && <p className="text-xs text-blue-600 mt-2 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">Nota del equipo: {ret.admin_notes}</p>}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColor(ret.status)}`}>
                    {statusLabel(ret.status)}
                  </span>
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
