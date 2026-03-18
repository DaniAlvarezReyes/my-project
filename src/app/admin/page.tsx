'use client';
import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { BarChart, DonutChart, StatCard } from '@/components/AdminCharts';
import Link from 'next/link';
import { exportOrdersReport, exportProductsReport } from '@/lib/pdfExport';

export default function AdminDashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    try {
      const [o, p, u] = await Promise.all([
        supabase.from('orders').select('*').order('created_at', { ascending: false }),
        supabase.from('products').select('id, name, price, stock, in_stock, brand, category, images'),
        supabase.from('profiles').select('id, created_at'),
      ]);
      setOrders(o.data || []);
      setProducts(p.data || []);
      setUsers(u.data || []);
    } catch (err) {
      console.warn('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  // ── Computed stats ──────────────────────────────────────
  const stats = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const totalRevenue = orders.reduce((s, o) => s + (o.total || 0), 0);
    const todayOrders = orders.filter(o => new Date(o.created_at) >= today);
    const thisMonthOrders = orders.filter(o => new Date(o.created_at) >= thisMonth);
    const lastMonthOrders = orders.filter(o => {
      const d = new Date(o.created_at);
      return d >= lastMonth && d <= lastMonthEnd;
    });

    const thisMonthRev = thisMonthOrders.reduce((s, o) => s + (o.total || 0), 0);
    const lastMonthRev = lastMonthOrders.reduce((s, o) => s + (o.total || 0), 0);
    const revenueChange = lastMonthRev > 0 ? ((thisMonthRev - lastMonthRev) / lastMonthRev) * 100 : 0;

    const pending = orders.filter(o => o.status === 'pending').length;
    const processing = orders.filter(o => o.status === 'processing').length;
    const avgOrder = orders.length > 0 ? totalRevenue / orders.length : 0;

    const lowStock = products.filter(p => (p.stock || 0) <= 5 && p.in_stock !== false).length;

    return { totalRevenue, todayOrders, thisMonthOrders, revenueChange, pending, processing, avgOrder, lowStock, thisMonthRev };
  }, [orders, products]);

  // ── Revenue by last 7 days ─────────────────────────────
  const revenueByDay = useMemo(() => {
    const days: { label: string; value: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStr = d.toLocaleDateString('es-ES', { weekday: 'short' });
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const dayEnd = new Date(dayStart.getTime() + 86400000);
      const rev = orders
        .filter(o => { const od = new Date(o.created_at); return od >= dayStart && od < dayEnd; })
        .reduce((s, o) => s + (o.total || 0), 0);
      days.push({ label: dayStr, value: rev });
    }
    return days;
  }, [orders]);

  // ── Order status breakdown ─────────────────────────────
  const statusBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    orders.forEach(o => { counts[o.status] = (counts[o.status] || 0) + 1; });
    const colorMap: Record<string, string> = {
      pending: '#F59E0B', processing: '#3B82F6', shipped: '#8B5CF6',
      delivered: '#10B981', cancelled: '#EF4444',
    };
    return Object.entries(counts).map(([status, value]) => ({
      label: status === 'pending' ? 'Pendiente' : status === 'processing' ? 'Procesando' :
             status === 'shipped' ? 'Enviado' : status === 'delivered' ? 'Entregado' :
             status === 'cancelled' ? 'Cancelado' : status,
      value,
      color: colorMap[status] || '#6B7280',
    }));
  }, [orders]);

  // ── Top products by revenue ────────────────────────────
  const topProducts = useMemo(() => {
    // We'd need order_items for real data, approximate with products
    return products
      .sort((a, b) => (b.price * (b.stock || 1)) - (a.price * (a.stock || 1)))
      .slice(0, 5);
  }, [products]);

  // ── Sparkline data (last 30 days orders count) ─────────
  const orderSparkline = useMemo(() => {
    const days: number[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const end = new Date(start.getTime() + 86400000);
      days.push(orders.filter(o => { const od = new Date(o.created_at); return od >= start && od < end; }).length);
    }
    return days;
  }, [orders]);

  const revenueSparkline = useMemo(() => {
    const days: number[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const end = new Date(start.getTime() + 86400000);
      days.push(orders.filter(o => { const od = new Date(o.created_at); return od >= start && od < end; }).reduce((s, o) => s + (o.total || 0), 0));
    }
    return days;
  }, [orders]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-40 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-32 bg-gray-200 rounded-xl animate-pulse" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-72 bg-gray-200 rounded-xl animate-pulse" />
          <div className="h-72 bg-gray-200 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">Resumen de tu tienda</p>
        </div>
        <span className="text-xs text-gray-400">Actualizado: {new Date().toLocaleString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
        <div className="flex gap-2">
          <button onClick={() => exportOrdersReport(orders)} className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg font-medium text-gray-700 transition-colors">📄 PDF Pedidos</button>
          <button onClick={() => exportProductsReport(products)} className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg font-medium text-gray-700 transition-colors">📄 PDF Inventario</button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Ingresos este mes"
          value={`€${stats.thisMonthRev.toFixed(2)}`}
          change={stats.revenueChange}
          sparkData={revenueSparkline}
          color="#10B981"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatCard
          label="Pedidos totales"
          value={orders.length}
          sparkData={orderSparkline}
          color="#3B82F6"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>}
        />
        <StatCard
          label="Ticket medio"
          value={`€${stats.avgOrder.toFixed(2)}`}
          color="#8B5CF6"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>}
        />
        <StatCard
          label="Usuarios registrados"
          value={users.length}
          color="#F59E0B"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
        />
      </div>

      {/* Alerts row */}
      {(stats.pending > 0 || stats.lowStock > 0) && (
        <div className="flex gap-4">
          {stats.pending > 0 && (
            <Link href="/admin/pedidos" className="flex-1 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3 hover:bg-amber-100 transition-colors">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 font-bold">{stats.pending}</div>
              <div>
                <p className="text-sm font-semibold text-amber-900">Pedidos pendientes</p>
                <p className="text-xs text-amber-700">Requieren atención</p>
              </div>
            </Link>
          )}
          {stats.lowStock > 0 && (
            <Link href="/admin/productos" className="flex-1 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 hover:bg-red-100 transition-colors">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-red-600 font-bold">{stats.lowStock}</div>
              <div>
                <p className="text-sm font-semibold text-red-900">Stock bajo</p>
                <p className="text-xs text-red-700">Productos con ≤5 unidades</p>
              </div>
            </Link>
          )}
        </div>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue chart */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Ingresos - Últimos 7 días</h3>
          <BarChart data={revenueByDay} color="#3B82F6" />
        </div>

        {/* Status donut */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Estado de Pedidos</h3>
          <DonutChart data={statusBreakdown} />
        </div>
      </div>

      {/* Bottom row: recent orders + top products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent orders */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <h3 className="font-semibold text-gray-900">Últimos Pedidos</h3>
            <Link href="/admin/pedidos" className="text-sm text-blue-600 hover:text-blue-800 font-medium">Ver todos →</Link>
          </div>
          <div className="divide-y">
            {orders.slice(0, 5).map((order) => (
              <div key={order.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50">
                <div>
                  <p className="text-sm font-medium text-gray-900">#{order.id?.slice(0, 8)}</p>
                  <p className="text-xs text-gray-500">{new Date(order.created_at).toLocaleDateString('es-ES')}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">€{(order.total || 0).toFixed(2)}</p>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    order.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                    order.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                    order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                    order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>{order.status}</span>
                </div>
              </div>
            ))}
            {orders.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-8">Sin pedidos todavía</p>
            )}
          </div>
        </div>

        {/* Top products / low stock */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <h3 className="font-semibold text-gray-900">Productos</h3>
            <Link href="/admin/productos" className="text-sm text-blue-600 hover:text-blue-800 font-medium">Gestionar →</Link>
          </div>
          <div className="divide-y">
            {products.slice(0, 5).map((product) => (
              <div key={product.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50">
                <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                  {product.images?.[0] && <img src={product.images[0]} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                  <p className="text-xs text-gray-500">{product.brand} · €{product.price?.toFixed(2)}</p>
                </div>
                <div className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  (product.stock || 0) === 0 ? 'bg-red-100 text-red-700' :
                  (product.stock || 0) <= 5 ? 'bg-amber-100 text-amber-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {(product.stock || 0) === 0 ? 'Agotado' : `${product.stock} uds`}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
