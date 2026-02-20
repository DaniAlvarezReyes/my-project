'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    totalUsers: 0,
    todayOrders: 0,
    todayRevenue: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
    loadRecentOrders();
  }, []);

  const loadStats = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [orders, users] = await Promise.all([
      supabase.from('orders').select('*'),
      supabase.from('users').select('id'),
    ]);

    const allOrders = orders.data || [];
    const totalRevenue = allOrders.reduce((sum, order) => sum + order.total, 0);
    const pendingOrders = allOrders.filter(o => o.status === 'pending').length;
    const todayOrders = allOrders.filter(o => new Date(o.created_at) >= today);
    const todayRevenue = todayOrders.reduce((sum, order) => sum + order.total, 0);

    setStats({
      totalOrders: allOrders.length,
      totalRevenue,
      pendingOrders,
      totalUsers: users.data?.length || 0,
      todayOrders: todayOrders.length,
      todayRevenue,
    });

    setLoading(false);
  };

  const loadRecentOrders = async () => {
    const { data } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (data) setRecentOrders(data);
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Cargando estadísticas...</p>
      </div>
    );
  }

  const statCards = [
    { label: 'Pedidos Totales', value: stats.totalOrders, icon: '📦', color: 'blue' },
    { label: 'Ingresos Totales', value: `€${stats.totalRevenue.toFixed(2)}`, icon: '💰', color: 'green' },
    { label: 'Pedidos Pendientes', value: stats.pendingOrders, icon: '⏱️', color: 'yellow' },
    { label: 'Usuarios Registrados', value: stats.totalUsers, icon: '👥', color: 'purple' },
    { label: 'Pedidos Hoy', value: stats.todayOrders, icon: '📅', color: 'indigo' },
    { label: 'Ingresos Hoy', value: `€${stats.todayRevenue.toFixed(2)}`, icon: '💵', color: 'teal' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className="text-4xl">{stat.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Pedidos Recientes</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">#{order.id.slice(0, 8)}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(order.created_at).toLocaleDateString('es-ES')}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">€{order.total.toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      order.status === 'completed' ? 'bg-green-100 text-green-800' :
                      order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                      order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
