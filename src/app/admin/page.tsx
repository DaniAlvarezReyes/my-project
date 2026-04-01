'use client';
import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { BarChart, DonutChart, StatCard } from '@/components/AdminCharts';
import { exportOrdersReport, exportProductsReport } from '@/lib/pdfExport';
import Link from 'next/link';

export default function AdminDashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [o, p, u] = await Promise.all([
          supabase.from('orders').select('*').order('created_at', { ascending: false }),
          supabase.from('products').select('id, name, price, stock, in_stock, brand, category, images'),
          supabase.from('profiles').select('id, created_at'),
        ]);
        setOrders(o.data || []);
        setProducts(p.data || []);
        setUsers(u.data || []);
      } catch {} finally { setLoading(false); }
    };
    load();
  }, []);

  const stats = useMemo(() => {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const totalRevenue = orders.reduce((s, o) => s + (o.total || 0), 0);
    const thisMonthOrders = orders.filter(o => new Date(o.created_at) >= thisMonth);
    const lastMonthOrders = orders.filter(o => { const d = new Date(o.created_at); return d >= lastMonth && d <= lastMonthEnd; });
    const thisMonthRev = thisMonthOrders.reduce((s, o) => s + (o.total || 0), 0);
    const lastMonthRev = lastMonthOrders.reduce((s, o) => s + (o.total || 0), 0);
    const revenueChange = lastMonthRev > 0 ? ((thisMonthRev - lastMonthRev) / lastMonthRev) * 100 : 0;
    const pending = orders.filter(o => o.status === 'pending').length;
    const avgOrder = orders.length > 0 ? totalRevenue / orders.length : 0;
    const lowStock = products.filter(p => (p.stock || 0) <= 5 && p.in_stock !== false).length;
    return { totalRevenue, revenueChange, pending, avgOrder, lowStock, thisMonthRev };
  }, [orders, products]);

  const revenueByDay = useMemo(() => {
    const days: { label: string; value: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const dayStr = d.toLocaleDateString('es-ES', { weekday: 'short' });
      const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const end = new Date(start.getTime() + 86400000);
      const rev = orders.filter(o => { const od = new Date(o.created_at); return od >= start && od < end; }).reduce((s, o) => s + (o.total || 0), 0);
      days.push({ label: dayStr, value: rev });
    }
    return days;
  }, [orders]);

  const statusBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    orders.forEach(o => { counts[o.status] = (counts[o.status] || 0) + 1; });
    const colorMap: Record<string, string> = { pending: '#f59e0b', processing: '#3b82f6', shipped: '#8b5cf6', delivered: '#10b981', cancelled: '#ef4444' };
    const labelMap: Record<string, string> = { pending: 'Pendiente', processing: 'Procesando', shipped: 'Enviado', delivered: 'Entregado', cancelled: 'Cancelado' };
    return Object.entries(counts).map(([s, v]) => ({ label: labelMap[s] || s, value: v, color: colorMap[s] || '#6b7280' }));
  }, [orders]);

  const orderSparkline = useMemo(() => {
    const d: number[] = [];
    for (let i = 29; i >= 0; i--) { const dt = new Date(); dt.setDate(dt.getDate() - i); const s = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate()); const e = new Date(s.getTime() + 86400000); d.push(orders.filter(o => { const od = new Date(o.created_at); return od >= s && od < e; }).length); }
    return d;
  }, [orders]);

  const revenueSparkline = useMemo(() => {
    const d: number[] = [];
    for (let i = 29; i >= 0; i--) { const dt = new Date(); dt.setDate(dt.getDate() - i); const s = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate()); const e = new Date(s.getTime() + 86400000); d.push(orders.filter(o => { const od = new Date(o.created_at); return od >= s && od < e; }).reduce((sum, o) => sum + (o.total || 0), 0)); }
    return d;
  }, [orders]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-neutral-200 rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-36 bg-neutral-200 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-72 bg-neutral-200 rounded-xl" />
          <div className="h-72 bg-neutral-200 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-neutral-900">Dashboard</h1>
          <p className="text-xs text-neutral-400 uppercase tracking-widest mt-1">Resumen de tu tienda</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => exportOrdersReport(orders)} className="px-3 py-2 text-[11px] font-bold uppercase tracking-widest text-neutral-500 border border-neutral-200 hover:border-neutral-900 hover:text-neutral-900 transition-colors">
            Exportar Pedidos
          </button>
          <button onClick={() => exportProductsReport(products)} className="px-3 py-2 text-[11px] font-bold uppercase tracking-widest text-neutral-500 border border-neutral-200 hover:border-neutral-900 hover:text-neutral-900 transition-colors">
            Exportar Inventario
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Ingresos este mes" value={`€${stats.thisMonthRev.toFixed(2)}`} change={stats.revenueChange} sparkData={revenueSparkline} color="#000"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
        <StatCard label="Total pedidos" value={orders.length} sparkData={orderSparkline} color="#000"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>} />
        <StatCard label="Ticket medio" value={`€${stats.avgOrder.toFixed(2)}`} color="#000"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>} />
        <StatCard label="Usuarios" value={users.length} color="#000"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>} />
      </div>

      {/* Alerts */}
      {(stats.pending > 0 || stats.lowStock > 0) && (
        <div className="flex gap-4">
          {stats.pending > 0 && (
            <Link href="/admin/pedidos" className="flex-1 border border-amber-200 bg-amber-50 rounded-xl p-4 flex items-center gap-4 hover:border-amber-400 transition-colors">
              <div className="w-10 h-10 bg-amber-500 text-white rounded-full flex items-center justify-center text-sm font-black">{stats.pending}</div>
              <div>
                <p className="text-sm font-bold text-amber-900">Pedidos pendientes</p>
                <p className="text-xs text-amber-600">Requieren atención</p>
              </div>
            </Link>
          )}
          {stats.lowStock > 0 && (
            <Link href="/admin/productos" className="flex-1 border border-red-200 bg-red-50 rounded-xl p-4 flex items-center gap-4 hover:border-red-400 transition-colors">
              <div className="w-10 h-10 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-black">{stats.lowStock}</div>
              <div>
                <p className="text-sm font-bold text-red-900">Stock bajo</p>
                <p className="text-xs text-red-600">Productos con ≤5 uds</p>
              </div>
            </Link>
          )}
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-neutral-200 rounded-xl p-6">
          <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-6">Ingresos — Últimos 7 días</h3>
          <BarChart data={revenueByDay} color="#171717" />
        </div>
        <div className="bg-white border border-neutral-200 rounded-xl p-6">
          <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-6">Estado de Pedidos</h3>
          <DonutChart data={statusBreakdown} />
        </div>
      </div>

      {/* Bottom: Orders + Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
            <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-400">Últimos Pedidos</h3>
            <Link href="/admin/pedidos" className="text-[11px] font-bold uppercase tracking-widest text-neutral-400 hover:text-neutral-900 hover-line transition-colors">Ver todo →</Link>
          </div>
          <div className="divide-y divide-neutral-100">
            {orders.slice(0, 5).map(order => (
              <div key={order.id} className="flex items-center justify-between px-6 py-3.5 hover:bg-neutral-50 transition-colors">
                <div>
                  <p className="text-sm font-medium text-neutral-900">#{order.id?.slice(0,8)}</p>
                  <p className="text-[11px] text-neutral-400">{new Date(order.created_at).toLocaleDateString('es-ES')}</p>
                </div>
                <div className="text-right flex items-center gap-3">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                    order.status === 'processing' ? 'bg-blue-50 text-blue-600' :
                    order.status === 'pending' ? 'bg-amber-50 text-amber-600' :
                    order.status === 'delivered' ? 'bg-green-50 text-green-600' :
                    order.status === 'cancelled' ? 'bg-red-50 text-red-600' :
                    'bg-neutral-100 text-neutral-500'
                  }`}>{order.status}</span>
                  <span className="text-sm font-bold">€{(order.total || 0).toFixed(2)}</span>
                </div>
              </div>
            ))}
            {orders.length === 0 && <p className="text-sm text-neutral-400 text-center py-10">Sin pedidos</p>}
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
            <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-400">Productos</h3>
            <Link href="/admin/productos" className="text-[11px] font-bold uppercase tracking-widest text-neutral-400 hover:text-neutral-900 hover-line transition-colors">Gestionar →</Link>
          </div>
          <div className="divide-y divide-neutral-100">
            {products.slice(0, 5).map(product => (
              <div key={product.id} className="flex items-center gap-3 px-6 py-3.5 hover:bg-neutral-50 transition-colors">
                <div className="w-10 h-10 bg-neutral-100 rounded overflow-hidden flex-shrink-0">
                  {product.images?.[0] && <img src={product.images[0]} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-900 truncate">{product.name}</p>
                  <p className="text-[11px] text-neutral-400">{product.brand} · €{product.price?.toFixed(2)}</p>
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                  (product.stock || 0) === 0 ? 'bg-red-50 text-red-600' :
                  (product.stock || 0) <= 5 ? 'bg-amber-50 text-amber-600' :
                  'bg-green-50 text-green-600'
                }`}>
                  {(product.stock || 0) === 0 ? 'Agotado' : `${product.stock} uds`}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
