'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/context/ToastContext';
import { useConfirm } from '@/components/ConfirmDialog';

const STATUS_FLOW = ['requested', 'approved', 'in_transit', 'received', 'refunded'];
const STATUS_LABELS: Record<string, string> = { requested: 'Solicitada', approved: 'Aprobada', rejected: 'Rechazada', in_transit: 'En tránsito', received: 'Recibida', refunded: 'Reembolsada' };
const STATUS_COLORS: Record<string, string> = { requested: 'bg-amber-100 text-amber-700', approved: 'bg-blue-100 text-blue-700', rejected: 'bg-red-100 text-red-700', in_transit: 'bg-purple-100 text-purple-700', received: 'bg-indigo-100 text-indigo-700', refunded: 'bg-green-100 text-green-700' };

export default function AdminDevoluciones() {
  const [returns, setReturns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedReturn, setSelectedReturn] = useState<any>(null);
  const toast = useToast();
  const { confirm } = useConfirm();

  useEffect(() => { loadReturns(); }, []);

  const loadReturns = async () => {
    try {
      const { data } = await supabase
        .from('returns')
        .select('*, order:orders(id, total, created_at, user_id), profile:profiles!returns_user_id_fkey(name, email)')
        .order('created_at', { ascending: false });
      setReturns(data || []);
    } catch (err) { console.warn('Error loading returns:', err); }
    finally { setLoading(false); }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await supabase.from('returns').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
      setReturns(prev => prev.map(r => r.id === id ? { ...r, status } : r));
      if (selectedReturn?.id === id) setSelectedReturn({ ...selectedReturn, status });
      toast.success(`Estado actualizado a: ${STATUS_LABELS[status]}`);
    } catch { toast.error('Error al actualizar'); }
  };

  const addNote = async (id: string) => {
    const note = (document.getElementById('admin-note-input') as HTMLInputElement)?.value;
    if (!note?.trim()) return;
    try {
      await supabase.from('returns').update({ admin_notes: note }).eq('id', id);
      setSelectedReturn({ ...selectedReturn, admin_notes: note });
      toast.success('Nota guardada');
    } catch { toast.error('Error al guardar nota'); }
  };

  const rejectReturn = async (id: string) => {
    const ok = await confirm({ title: 'Rechazar devolución', message: '¿Rechazar esta solicitud? El cliente será notificado.', confirmText: 'Rechazar', variant: 'danger' });
    if (ok) await updateStatus(id, 'rejected');
  };

  const filtered = returns.filter(r => filter === 'all' || r.status === filter);
  const pendingCount = returns.filter(r => r.status === 'requested').length;

  if (loading) return <div className="text-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Devoluciones</h1>
          <p className="text-sm text-gray-500">{returns.length} total · {pendingCount} pendientes</p>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {['all', ...STATUS_FLOW, 'rejected'].map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === s ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>
            {s === 'all' ? `Todas (${returns.length})` : `${STATUS_LABELS[s]} (${returns.filter(r => r.status === s).length})`}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <table className="min-w-full">
          <thead className="bg-gray-50"><tr>
            <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
            <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
            <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pedido</th>
            <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Motivo</th>
            <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
            <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
            <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
          </tr></thead>
          <tbody className="divide-y">
            {filtered.map(ret => (
              <tr key={ret.id} className="hover:bg-gray-50">
                <td className="px-5 py-3 text-sm font-mono">#{ret.id?.slice(0,6)}</td>
                <td className="px-5 py-3 text-sm">{ret.profile?.name || ret.profile?.email || 'N/A'}</td>
                <td className="px-5 py-3 text-sm">#{ret.order?.id?.slice(0,8)} · €{ret.order?.total?.toFixed(2)}</td>
                <td className="px-5 py-3 text-sm text-gray-600">{ret.reason}</td>
                <td className="px-5 py-3"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[ret.status]}`}>{STATUS_LABELS[ret.status]}</span></td>
                <td className="px-5 py-3 text-xs text-gray-500">{new Date(ret.created_at).toLocaleDateString('es-ES')}</td>
                <td className="px-5 py-3">
                  <button onClick={() => setSelectedReturn(ret)} className="text-blue-600 text-sm font-medium hover:text-blue-800">Gestionar</button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={7} className="px-5 py-12 text-center text-gray-400">Sin devoluciones</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Detail modal */}
      {selectedReturn && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedReturn(null)}>
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Devolución #{selectedReturn.id?.slice(0,6)}</h2>
              <button onClick={() => setSelectedReturn(null)} className="p-1 hover:bg-gray-100 rounded-full">✕</button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-500">Cliente</p><p className="font-medium">{selectedReturn.profile?.name || 'N/A'}</p></div>
                <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-500">Pedido</p><p className="font-medium">#{selectedReturn.order?.id?.slice(0,8)}</p></div>
                <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-500">Importe</p><p className="font-medium">€{selectedReturn.order?.total?.toFixed(2)}</p></div>
                <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-500">Motivo</p><p className="font-medium">{selectedReturn.reason}</p></div>
              </div>

              {selectedReturn.details && <div className="bg-amber-50 rounded-lg p-3"><p className="text-xs text-amber-600 mb-1">Detalles del cliente</p><p className="text-sm">{selectedReturn.details}</p></div>}

              <div>
                <label className="block text-sm font-medium mb-1">Estado</label>
                <select value={selectedReturn.status} onChange={e => updateStatus(selectedReturn.id, e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm">
                  {[...STATUS_FLOW, 'rejected'].map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Nota interna</label>
                <div className="flex gap-2">
                  <input id="admin-note-input" defaultValue={selectedReturn.admin_notes || ''} className="flex-1 px-3 py-2 border rounded-lg text-sm" placeholder="Nota para el equipo..." />
                  <button onClick={() => addNote(selectedReturn.id)} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">Guardar</button>
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t">
                {selectedReturn.status === 'requested' && (
                  <>
                    <button onClick={() => updateStatus(selectedReturn.id, 'approved')} className="flex-1 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700">✓ Aprobar</button>
                    <button onClick={() => rejectReturn(selectedReturn.id)} className="flex-1 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700">✗ Rechazar</button>
                  </>
                )}
                {selectedReturn.status === 'received' && (
                  <button onClick={() => updateStatus(selectedReturn.id, 'refunded')} className="flex-1 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700">💰 Procesar reembolso</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
