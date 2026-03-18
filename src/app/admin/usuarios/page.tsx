'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/context/ToastContext';
import { useConfirm } from '@/components/ConfirmDialog';

export default function AdminUsuarios() {
  const [users, setUsers] = useState<any[]>([]);
  const toast = useToast();
  const { confirm } = useConfirm();
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (data) setUsers(data);
    } catch (error) {
      console.warn('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const makeAdmin = async (userId: string) => {
    const ok = await confirm({ title: 'Hacer administrador', message: '¿Conceder permisos de administrador a este usuario?', confirmText: 'Hacer Admin', variant: 'warning' }); if (ok) {
      await supabase.from('profiles').update({ role: 'admin' }).eq('id', userId);
      loadUsers();
      toast.success('Usuario ahora es admin');
    }
  };

  const removeAdmin = async (userId: string) => {
    const ok2 = await confirm({ title: 'Quitar admin', message: '¿Quitar permisos de administrador?', confirmText: 'Quitar', variant: 'warning' }); if (ok2) {
      await supabase.from('profiles').update({ role: 'customer' }).eq('id', userId);
      loadUsers();
    }
  };

  const exportCSV = () => {
    const csv = [
      ['Nombre', 'Email', 'Teléfono', 'Rol', 'Fecha Registro'].join(','),
      ...users.map(u => [
        // FIX: usar last_name (campo real en profiles) en vez de lastName
        `${u.name} ${u.last_name || ''}`.trim(),
        u.email,
        u.phone || '',
        u.role || 'customer',
        new Date(u.created_at).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'usuarios.csv';
    a.click();
  };

  const filteredUsers = filter === 'all' ? users : users.filter(u => u.role === filter);

  if (loading) return <div className="text-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Usuarios ({users.length})</h1>
        <button onClick={exportCSV} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">📥 Exportar CSV</button>
      </div>

      <div className="bg-white rounded-lg shadow p-4 flex gap-2">
        {['all', 'admin', 'customer'].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-lg font-medium ${filter === f ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>
            {f === 'all' ? 'Todos' : f === 'admin' ? 'Admins' : 'Clientes'}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teléfono</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rol</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Registro</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id} className="border-t hover:bg-gray-50">
                {/* FIX: usar last_name (campo real) */}
                <td className="px-6 py-4 font-medium">{user.name} {user.last_name || ''}</td>
                <td className="px-6 py-4">{user.email}</td>
                <td className="px-6 py-4">{user.phone || 'N/A'}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>
                    {user.role || 'customer'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">{new Date(user.created_at).toLocaleDateString('es-ES')}</td>
                <td className="px-6 py-4 text-sm space-x-2">
                  {user.role !== 'admin' ? (
                    <button onClick={() => makeAdmin(user.id)} className="text-blue-600 hover:text-blue-800">👑 Hacer Admin</button>
                  ) : (
                    <button onClick={() => removeAdmin(user.id)} className="text-orange-600 hover:text-orange-800">Quitar Admin</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
