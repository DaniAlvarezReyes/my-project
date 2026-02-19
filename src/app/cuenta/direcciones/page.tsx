'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MainNav } from '@/components/MainNav';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

interface Address {
  id: string;
  street: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: boolean;
}

export default function DireccionesPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    street: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'España',
    is_default: false,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    loadAddresses();
  }, [isAuthenticated, router]);

  const loadAddresses = async () => {
    if (!user?.id) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false });

    if (!error && data) {
      setAddresses(data);
    }
    setLoading(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id) return;

    // Si la nueva dirección es predeterminada, quitar predeterminado de las demás
    if (formData.is_default) {
      await supabase
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', user.id);
    }

    const { error } = await supabase
      .from('addresses')
      .insert({
        user_id: user.id,
        ...formData,
      });

    if (!error) {
      setShowModal(false);
      setFormData({
        street: '',
        city: '',
        state: '',
        postal_code: '',
        country: 'España',
        is_default: false,
      });
      loadAddresses();
    } else {
      alert('Error al guardar la dirección');
    }
  };

  const setAsDefault = async (addressId: string) => {
    if (!user?.id) return;

    // Quitar predeterminado de todas
    await supabase
      .from('addresses')
      .update({ is_default: false })
      .eq('user_id', user.id);

    // Establecer como predeterminada
    const { error } = await supabase
      .from('addresses')
      .update({ is_default: true })
      .eq('id', addressId);

    if (!error) {
      loadAddresses();
    }
  };

  const deleteAddress = async (addressId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta dirección?')) {
      return;
    }

    const { error } = await supabase
      .from('addresses')
      .delete()
      .eq('id', addressId);

    if (!error) {
      loadAddresses();
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <MainNav />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Mis Direcciones</h1>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <nav className="bg-white rounded-lg shadow-md p-4 space-y-2">
              <Link
                href="/cuenta"
                className="block px-4 py-2 rounded-lg hover:bg-gray-50 text-gray-700"
              >
                Mi Perfil
              </Link>
              <Link
                href="/cuenta/pedidos"
                className="block px-4 py-2 rounded-lg hover:bg-gray-50 text-gray-700"
              >
                Mis Pedidos
              </Link>
              <Link
                href="/cuenta/favoritos"
                className="block px-4 py-2 rounded-lg hover:bg-gray-50 text-gray-700"
              >
                Favoritos
              </Link>
              <Link
                href="/cuenta/direcciones"
                className="block px-4 py-2 rounded-lg bg-blue-50 text-blue-600 font-medium"
              >
                Direcciones
              </Link>
            </nav>
          </aside>

          {/* Contenido principal */}
          <div className="lg:col-span-3">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">
                {addresses.length} {addresses.length === 1 ? 'dirección' : 'direcciones'}
              </h2>
              <Button variant="primary" onClick={() => setShowModal(true)}>
                + Añadir Dirección
              </Button>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <p className="text-gray-600">Cargando direcciones...</p>
              </div>
            ) : addresses.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <svg className="mx-auto h-24 w-24 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                  No tienes direcciones guardadas
                </h2>
                <p className="text-gray-600 mb-6">
                  Añade una dirección para agilizar tus compras
                </p>
                <Button variant="primary" onClick={() => setShowModal(true)}>
                  Añadir Primera Dirección
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {addresses.map((address) => (
                  <div
                    key={address.id}
                    className={`bg-white rounded-lg shadow-md p-6 relative ${
                      address.is_default ? 'ring-2 ring-blue-500' : ''
                    }`}
                  >
                    {address.is_default && (
                      <span className="absolute top-4 right-4 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded">
                        PRINCIPAL
                      </span>
                    )}

                    <div className="mb-4">
                      <p className="font-semibold text-gray-900">{address.street}</p>
                      <p className="text-gray-600">
                        {address.city}, {address.state}
                      </p>
                      <p className="text-gray-600">
                        {address.postal_code}, {address.country}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      {!address.is_default && (
                        <button
                          onClick={() => setAsDefault(address.id)}
                          className="flex-1 px-3 py-2 text-sm border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 font-medium"
                        >
                          Hacer Principal
                        </button>
                      )}
                      <button
                        onClick={() => deleteAddress(address.id)}
                        className="px-3 py-2 text-sm border border-red-300 text-red-600 rounded-lg hover:bg-red-50 font-medium"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal para añadir dirección */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Nueva Dirección</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <TextField
                label="Dirección"
                name="street"
                value={formData.street}
                onChange={handleInputChange}
                placeholder="Calle, número, piso, puerta"
                required
                fullWidth
                className="mb-4"
              />

              <div className="grid grid-cols-2 gap-4 mb-4">
                <TextField
                  label="Ciudad"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  required
                  fullWidth
                />
                <TextField
                  label="Provincia"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  required
                  fullWidth
                />
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <TextField
                  label="Código Postal"
                  name="postal_code"
                  value={formData.postal_code}
                  onChange={handleInputChange}
                  required
                  fullWidth
                />
                <TextField
                  label="País"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  fullWidth
                />
              </div>

              <label className="flex items-center mb-6">
                <input
                  type="checkbox"
                  name="is_default"
                  checked={formData.is_default}
                  onChange={handleInputChange}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Establecer como dirección principal</span>
              </label>

              <div className="flex gap-3">
                <Button type="submit" variant="primary" fullWidth>
                  Guardar Dirección
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowModal(false)}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer
        siteName="Sneakers Pro"
        description="Tu tienda de confianza"
        sections={[]}
        socialLinks={[]}
      />
    </div>
  );
}
