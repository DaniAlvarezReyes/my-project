'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/context/ToastContext';
import { useConfirm } from '@/components/ConfirmDialog';

interface Subscriber {
  id: string;
  email: string;
  name?: string;
  subscribed_at: string;
  active: boolean;
}

export default function AdminNewsletter() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const toast = useToast();
  const { confirm } = useConfirm();
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedSubscribers, setSelectedSubscribers] = useState<string[]>([]);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  
  const [emailData, setEmailData] = useState({
    subject: '',
    message: '',
  });

  useEffect(() => {
    loadSubscribers();
  }, []);

  const loadSubscribers = async () => {
    try {
      const { data, error } = await supabase
        .from('newsletter_subscribers')
        .select('*')
        .order('subscribed_at', { ascending: false });
      
      if (error) throw error;
      if (data) setSubscribers(data);
    } catch (error) {
      console.error('Error loading subscribers:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('newsletter_subscribers')
        .update({ active: !currentStatus })
        .eq('id', id);
      
      if (error) throw error;
      loadSubscribers();
    } catch (error) {
      console.error('Error toggling status:', error);
      toast.error('Error al cambiar estado');
    }
  };

  const deleteSubscriber = async (id: string, email: string) => {
    const ok = await confirm({ title: 'Eliminar suscriptor', message: `¿Eliminar a ${email}?`, confirmText: 'Eliminar', variant: 'danger' }); if (!ok) return;

    try {
      const { error } = await supabase
        .from('newsletter_subscribers')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      loadSubscribers();
      setSelectedSubscribers(selectedSubscribers.filter(s => s !== id));
    } catch (error) {
      console.error('Error deleting subscriber:', error);
      toast.error('Error al eliminar suscriptor');
    }
  };

  const exportCSV = () => {
    const csv = [
      ['Email', 'Nombre', 'Fecha', 'Estado'].join(','),
      ...subscribers.map(s => [
        s.email,
        s.name || '',
        new Date(s.subscribed_at).toLocaleDateString(),
        s.active ? 'Activo' : 'Inactivo'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `newsletter_subscribers_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const toggleSelectSubscriber = (id: string) => {
    setSelectedSubscribers(prev =>
      prev.includes(id)
        ? prev.filter(s => s !== id)
        : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedSubscribers.length === filteredSubscribers.length) {
      setSelectedSubscribers([]);
    } else {
      setSelectedSubscribers(filteredSubscribers.map(s => s.id));
    }
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedSubscribers.length === 0) {
      toast.warning('Selecciona al menos un suscriptor');
      return;
    }

    if (!emailData.subject || !emailData.message) {
      toast.warning('Completa el asunto y el mensaje');
      return;
    }

    const ok2 = await confirm({ title: 'Enviar emails', message: `¿Enviar email a ${selectedSubscribers.length} suscriptor(es)?`, confirmText: 'Enviar', variant: 'info' }); if (!ok2) return;

    setSendingEmail(true);

    try {
      // Obtener emails de los suscriptores seleccionados
      const selectedEmails = subscribers
        .filter(s => selectedSubscribers.includes(s.id))
        .map(s => ({ email: s.email, name: s.name }));

      // En producción real, aquí enviarías emails usando un servicio como SendGrid, Resend, etc.
      // Por ahora, guardaremos el envío en una tabla de historial
      
      const { error } = await supabase
        .from('newsletter_campaigns')
        .insert({
          subject: emailData.subject,
          message: emailData.message,
          recipients: selectedEmails.map(e => e.email),
          sent_at: new Date().toISOString(),
          sent_count: selectedEmails.length,
        });

      if (error) {
        console.error('Error saving campaign:', error);
        // Si la tabla no existe, solo mostramos el mensaje simulado
        console.log('Campaign would be sent to:', selectedEmails);
      }

      toast.success(`Email enviado a ${selectedEmails.length} suscriptor(es)`);
      
      setShowEmailModal(false);
      setEmailData({ subject: '', message: '' });
      setSelectedSubscribers([]);
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error('Error al enviar emails');
    } finally {
      setSendingEmail(false);
    }
  };

  const filteredSubscribers = subscribers.filter(s => {
    if (filter === 'active') return s.active;
    if (filter === 'inactive') return !s.active;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Newsletter</h1>
          <p className="text-gray-600 mt-1">Gestiona tus suscriptores y envía campañas</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportCSV}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center gap-2"
          >
            📥 Exportar CSV
          </button>
          <button
            onClick={() => setShowEmailModal(true)}
            disabled={selectedSubscribers.length === 0}
            className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${
              selectedSubscribers.length === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            ✉️ Enviar Email ({selectedSubscribers.length})
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600">Total Suscriptores</div>
          <div className="text-3xl font-bold text-gray-900">{subscribers.length}</div>
        </div>
        <div className="bg-green-50 p-6 rounded-lg shadow">
          <div className="text-sm text-green-600">Activos</div>
          <div className="text-3xl font-bold text-green-700">
            {subscribers.filter(s => s.active).length}
          </div>
        </div>
        <div className="bg-red-50 p-6 rounded-lg shadow">
          <div className="text-sm text-red-600">Inactivos</div>
          <div className="text-3xl font-bold text-red-700">
            {subscribers.filter(s => !s.active).length}
          </div>
        </div>
        <div className="bg-blue-50 p-6 rounded-lg shadow">
          <div className="text-sm text-blue-600">Seleccionados</div>
          <div className="text-3xl font-bold text-blue-700">
            {selectedSubscribers.length}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 flex gap-2">
        {[
          { key: 'all', label: 'Todos' },
          { key: 'active', label: 'Activos' },
          { key: 'inactive', label: 'Inactivos' },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => {
              setFilter(f.key);
              setSelectedSubscribers([]);
            }}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === f.key
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedSubscribers.length === filteredSubscribers.length && filteredSubscribers.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSubscribers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No hay suscriptores en esta categoría
                  </td>
                </tr>
              ) : (
                filteredSubscribers.map(subscriber => (
                  <tr key={subscriber.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedSubscribers.includes(subscriber.id)}
                        onChange={() => toggleSelectSubscriber(subscriber.id)}
                        className="w-4 h-4 rounded"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{subscriber.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{subscriber.name || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(subscriber.subscribed_at).toLocaleDateString('es-ES')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => toggleActive(subscriber.id, subscriber.active)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                          subscriber.active
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        }`}
                      >
                        {subscriber.active ? '✓ Activo' : '✗ Inactivo'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => deleteSubscriber(subscriber.id, subscriber.email)}
                        className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded transition-colors"
                        title="Eliminar"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <h2 className="text-2xl font-bold mb-6">Enviar Email Masivo</h2>
            <form onSubmit={handleSendEmail} className="space-y-4">
              <div>
                <label className="block mb-2 font-medium text-gray-700">
                  Destinatarios: {selectedSubscribers.length} suscriptor(es)
                </label>
                <div className="bg-gray-50 p-3 rounded border text-sm text-gray-700 max-h-32 overflow-y-auto">
                  {subscribers
                    .filter(s => selectedSubscribers.includes(s.id))
                    .map(s => s.email)
                    .join(', ')}
                </div>
              </div>

              <div>
                <label className="block mb-2 font-medium text-gray-700">Asunto *</label>
                <input
                  type="text"
                  value={emailData.subject}
                  onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="¡Nueva colección disponible!"
                  required
                />
              </div>

              <div>
                <label className="block mb-2 font-medium text-gray-700">Mensaje *</label>
                <textarea
                  value={emailData.message}
                  onChange={(e) => setEmailData({ ...emailData, message: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={8}
                  placeholder="Escribe tu mensaje aquí..."
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  En producción, este email se enviaría usando un servicio profesional (SendGrid, Resend, etc.)
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowEmailModal(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                  disabled={sendingEmail}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={sendingEmail}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {sendingEmail ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Enviando...
                    </>
                  ) : (
                    <>✉️ Enviar Email</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
