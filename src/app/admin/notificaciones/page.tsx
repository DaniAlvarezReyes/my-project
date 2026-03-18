'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/context/ToastContext';

export default function AdminNotificaciones() {
  const [users, setUsers] = useState<any[]>([]);
  const toast = useToast();
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [notificationType, setNotificationType] = useState('promotion');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [link, setLink] = useState('');
  const [sendToAll, setSendToAll] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const { data } = await supabase.from('profiles').select('id, name, email');
      if (data) setUsers(data);
    } catch (error) {
      console.warn('Error loading users:', error);
    }
  };

  const sendNotifications = async () => {
    if (!title || !message) {
      toast.warning('Título y mensaje son requeridos');
      return;
    }

    const targetUsers = sendToAll ? users.map(u => u.id) : selectedUsers;

    if (targetUsers.length === 0) {
      toast.warning('Selecciona al menos un usuario');
      return;
    }

    const notifications = targetUsers.map(userId => ({
      user_id: userId,
      type: notificationType,
      title,
      message,
      link: link || null,
      read: false
    }));

    try {
      await supabase.from('notifications').insert(notifications);
      toast.success(`${notifications.length} notificaciones enviadas`);
    } catch (error) {
      toast.error('Error al enviar notificaciones');
      return;
    }
    setTitle('');
    setMessage('');
    setLink('');
    setSelectedUsers([]);
    setSendToAll(false);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Enviar Notificaciones</h1>

      <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
        <div>
          <label className="block font-semibold mb-2">Tipo de Notificación</label>
          <select
            value={notificationType}
            onChange={(e) => setNotificationType(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value="order_update">Actualización de Pedido</option>
            <option value="promotion">Promoción</option>
            <option value="system">Sistema</option>
          </select>
        </div>

        <div>
          <label className="block font-semibold mb-2">Título *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
            placeholder="Ej: ¡Nueva Promoción!"
          />
        </div>

        <div>
          <label className="block font-semibold mb-2">Mensaje *</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border rounded-lg"
            placeholder="Escribe tu mensaje aquí..."
          />
        </div>

        <div>
          <label className="block font-semibold mb-2">Link (opcional)</label>
          <input
            type="text"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
            placeholder="/productos"
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            checked={sendToAll}
            onChange={(e) => setSendToAll(e.target.checked)}
            className="w-4 h-4"
          />
          <label className="ml-2">Enviar a todos los usuarios ({users.length})</label>
        </div>

        {!sendToAll && (
          <div>
            <label className="block font-semibold mb-2">Seleccionar Usuarios</label>
            <div className="border rounded-lg p-4 max-h-64 overflow-y-auto">
              {users.map(user => (
                <label key={user.id} className="flex items-center py-2">
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedUsers([...selectedUsers, user.id]);
                      } else {
                        setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                      }
                    }}
                    className="w-4 h-4"
                  />
                  <span className="ml-2">{user.name} ({user.email})</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={sendNotifications}
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
        >
          Enviar Notificaciones
        </button>
      </div>
    </div>
  );
}
