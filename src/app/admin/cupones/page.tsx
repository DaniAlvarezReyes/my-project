'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/context/ToastContext';
import { useConfirm } from '@/components/ConfirmDialog';

interface Coupon {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_purchase: number;
  max_uses: number;
  uses: number;
  active: boolean;
  expires_at?: string;
  created_at: string;
}

export default function AdminCupones() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const toast = useToast();
  const { confirm } = useConfirm();
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    discount_type: 'percentage' as 'percentage' | 'fixed',
    discount_value: 0,
    min_purchase: 0,
    max_uses: 100,
    active: true,
    expires_at: '',
  });

  useEffect(() => {
    loadCoupons();
  }, []);

  const loadCoupons = async () => {
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error loading coupons:', error);
      return;
    }
    if (data) setCoupons(data);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.code || formData.discount_value <= 0) {
      toast.warning('Por favor completa todos los campos requeridos');
      return;
    }

    try {
      if (editingCoupon) {
        // Editar cupón existente
        const { error } = await supabase
          .from('coupons')
          .update(formData)
          .eq('id', editingCoupon.id);

        if (error) throw error;
        toast.success('Cupón actualizado correctamente');
      } else {
        // Crear nuevo cupón
        const { error } = await supabase
          .from('coupons')
          .insert(formData);

        if (error) throw error;
        toast.success('Cupón creado correctamente');
      }

      loadCoupons();
      closeModal();
    } catch (error: any) {
      console.error('Error saving coupon:', error);
      toast.error('Error al guardar cupón');
    }
  };

  const handleEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      min_purchase: coupon.min_purchase,
      max_uses: coupon.max_uses,
      active: coupon.active,
      expires_at: coupon.expires_at || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string, code: string) => {
    const ok = await confirm({ title: 'Eliminar cupón', message: `¿Eliminar el cupón "${code}"?`, confirmText: 'Eliminar', variant: 'danger' }); if (!ok) return;

    try {
      const { error } = await supabase
        .from('coupons')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Cupón eliminado');
      loadCoupons();
    } catch (error: any) {
      console.error('Error deleting coupon:', error);
      toast.error('Error al eliminar cupón');
    }
  };

  const toggleActive = async (id: string, active: boolean) => {
    try {
      const { error } = await supabase
        .from('coupons')
        .update({ active: !active })
        .eq('id', id);

      if (error) throw error;
      loadCoupons();
    } catch (error: any) {
      console.error('Error toggling active:', error);
      toast.error('Error al cambiar estado');
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCoupon(null);
    setFormData({
      code: '',
      discount_type: 'percentage',
      discount_value: 0,
      min_purchase: 0,
      max_uses: 100,
      active: true,
      expires_at: '',
    });
  };

  const isExpired = (expiresAt?: string) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cupones de Descuento</h1>
          <p className="text-gray-600 mt-1">Gestiona los cupones de descuento de tu tienda</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
        >
          <span className="text-xl">+</span> Nuevo Cupón
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600">Total Cupones</div>
          <div className="text-3xl font-bold text-gray-900">{coupons.length}</div>
        </div>
        <div className="bg-green-50 p-6 rounded-lg shadow">
          <div className="text-sm text-green-600">Activos</div>
          <div className="text-3xl font-bold text-green-700">{coupons.filter(c => c.active).length}</div>
        </div>
        <div className="bg-red-50 p-6 rounded-lg shadow">
          <div className="text-sm text-red-600">Inactivos</div>
          <div className="text-3xl font-bold text-red-700">{coupons.filter(c => !c.active).length}</div>
        </div>
        <div className="bg-yellow-50 p-6 rounded-lg shadow">
          <div className="text-sm text-yellow-600">Expirados</div>
          <div className="text-3xl font-bold text-yellow-700">{coupons.filter(c => isExpired(c.expires_at)).length}</div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descuento</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Min. Compra</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usos</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expira</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {coupons.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No hay cupones creados. ¡Crea tu primer cupón!
                  </td>
                </tr>
              ) : (
                coupons.map((coupon) => (
                  <tr key={coupon.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-mono font-bold text-lg text-blue-600">{coupon.code}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-semibold">
                        {coupon.discount_type === 'percentage' 
                          ? `${coupon.discount_value}%` 
                          : `€${coupon.discount_value.toFixed(2)}`}
                      </div>
                      <div className="text-xs text-gray-500">
                        {coupon.discount_type === 'percentage' ? 'Porcentaje' : 'Cantidad fija'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-gray-900">€{coupon.min_purchase.toFixed(2)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-gray-900">{coupon.uses || 0} / {coupon.max_uses}</div>
                      <div className="text-xs text-gray-500">
                        {((coupon.uses || 0) / coupon.max_uses * 100).toFixed(0)}% usado
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {coupon.expires_at ? (
                        <div>
                          <div className={isExpired(coupon.expires_at) ? 'text-red-600 font-semibold' : 'text-gray-900'}>
                            {new Date(coupon.expires_at).toLocaleDateString('es-ES')}
                          </div>
                          {isExpired(coupon.expires_at) && (
                            <div className="text-xs text-red-600">Expirado</div>
                          )}
                        </div>
                      ) : (
                        <div className="text-gray-500">Sin expiración</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => toggleActive(coupon.id, coupon.active)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                          coupon.active && !isExpired(coupon.expires_at)
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                        }`}
                      >
                        {coupon.active && !isExpired(coupon.expires_at) ? '✓ Activo' : '✗ Inactivo'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(coupon)}
                          className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded transition-colors"
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(coupon.id, coupon.code)}
                          className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded transition-colors"
                          title="Eliminar"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6">
              {editingCoupon ? 'Editar Cupón' : 'Nuevo Cupón'}
            </h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block mb-2 font-medium text-gray-700">Código del Cupón *</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase().replace(/\s/g, '')})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="VERANO2026"
                  required
                  maxLength={20}
                />
                <p className="text-xs text-gray-500 mt-1">Sin espacios, letras mayúsculas</p>
              </div>

              <div>
                <label className="block mb-2 font-medium text-gray-700">Tipo de Descuento *</label>
                <select
                  value={formData.discount_type}
                  onChange={(e) => setFormData({...formData, discount_type: e.target.value as 'percentage' | 'fixed'})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="percentage">Porcentaje (%)</option>
                  <option value="fixed">Cantidad Fija (€)</option>
                </select>
              </div>

              <div>
                <label className="block mb-2 font-medium text-gray-700">
                  Valor del Descuento * {formData.discount_type === 'percentage' ? '(%)' : '(€)'}
                </label>
                <input
                  type="number"
                  value={formData.discount_value}
                  onChange={(e) => setFormData({...formData, discount_value: parseFloat(e.target.value)})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  min="0"
                  max={formData.discount_type === 'percentage' ? 100 : undefined}
                  step="0.01"
                  required
                />
              </div>

              <div>
                <label className="block mb-2 font-medium text-gray-700">Compra Mínima (€)</label>
                <input
                  type="number"
                  value={formData.min_purchase}
                  onChange={(e) => setFormData({...formData, min_purchase: parseFloat(e.target.value)})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  min="0"
                  step="0.01"
                />
                <p className="text-xs text-gray-500 mt-1">Deja 0 para sin mínimo</p>
              </div>

              <div>
                <label className="block mb-2 font-medium text-gray-700">Usos Máximos</label>
                <input
                  type="number"
                  value={formData.max_uses}
                  onChange={(e) => setFormData({...formData, max_uses: parseInt(e.target.value)})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  min="1"
                />
              </div>

              <div>
                <label className="block mb-2 font-medium text-gray-700">Fecha de Expiración (opcional)</label>
                <input
                  type="date"
                  value={formData.expires_at}
                  onChange={(e) => setFormData({...formData, expires_at: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="active"
                  checked={formData.active}
                  onChange={(e) => setFormData({...formData, active: e.target.checked})}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor="active" className="font-medium text-gray-700">Cupón activo</label>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  {editingCoupon ? 'Actualizar' : 'Crear'} Cupón
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
