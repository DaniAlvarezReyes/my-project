'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MainNav } from '@/components/MainNav';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { useAuth } from '@/context/AuthContext';

export default function CuentaPage() {
  const { user, isAuthenticated, updateProfile } = useAuth();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    lastName: '',
    email: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'España',
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
    } else if (user) {
      setFormData({
        name: user.name || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        street: user.address?.street || '',
        city: user.address?.city || '',
        state: user.address?.state || '',
        postalCode: user.address?.postalCode || '',
        country: user.address?.country || 'España',
      });
    }
  }, [isAuthenticated, user, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      ...user!,
      name: formData.name,
      lastName: formData.lastName,
      phone: formData.phone,
      address: {
        street: formData.street,
        city: formData.city,
        state: formData.state,
        postalCode: formData.postalCode,
        country: formData.country,
      },
    });
    setEditing(false);
    alert('Perfil actualizado correctamente');
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <MainNav />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Mi Cuenta</h1>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar de navegación */}
          <aside className="lg:col-span-1">
            <nav className="bg-white rounded-lg shadow-md p-4 space-y-2">
              <Link
                href="/cuenta"
                className="block px-4 py-2 rounded-lg bg-blue-50 text-blue-600 font-medium"
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
                href="/cuenta/direcciones"
                className="block px-4 py-2 rounded-lg hover:bg-gray-50 text-gray-700"
              >
                Direcciones
              </Link>
              <Link
                href="/cuenta/favoritos"
                className="block px-4 py-2 rounded-lg hover:bg-gray-50 text-gray-700"
              >
                Favoritos
              </Link>
            </nav>
          </aside>

          {/* Contenido principal */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Información Personal</h2>
                {!editing && (
                  <Button variant="outline" onClick={() => setEditing(true)}>
                    Editar
                  </Button>
                )}
              </div>

              <form onSubmit={handleSubmit}>
                <div className="space-y-6">
                  {/* Información básica */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Datos Básicos</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <TextField
                        label="Nombre"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        disabled={!editing}
                        fullWidth
                      />
                      <TextField
                        label="Apellidos"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        disabled={!editing}
                        fullWidth
                      />
                      <TextField
                        label="Email"
                        name="email"
                        type="email"
                        value={formData.email}
                        disabled={true}
                        fullWidth
                        helperText="El email no se puede cambiar"
                      />
                      <TextField
                        label="Teléfono"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleChange}
                        disabled={!editing}
                        fullWidth
                      />
                    </div>
                  </div>

                  {/* Dirección */}
                  <div className="pt-6 border-t border-gray-200">
                    <h3 className="text-lg font-semibold mb-4">Dirección Principal</h3>
                    <div className="space-y-4">
                      <TextField
                        label="Calle"
                        name="street"
                        value={formData.street}
                        onChange={handleChange}
                        disabled={!editing}
                        fullWidth
                      />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <TextField
                          label="Ciudad"
                          name="city"
                          value={formData.city}
                          onChange={handleChange}
                          disabled={!editing}
                          fullWidth
                        />
                        <TextField
                          label="Provincia"
                          name="state"
                          value={formData.state}
                          onChange={handleChange}
                          disabled={!editing}
                          fullWidth
                        />
                        <TextField
                          label="Código Postal"
                          name="postalCode"
                          value={formData.postalCode}
                          onChange={handleChange}
                          disabled={!editing}
                          fullWidth
                        />
                        <TextField
                          label="País"
                          name="country"
                          value={formData.country}
                          onChange={handleChange}
                          disabled={!editing}
                          fullWidth
                        />
                      </div>
                    </div>
                  </div>

                  {/* Botones de acción */}
                  {editing && (
                    <div className="flex gap-4 pt-6 border-t border-gray-200">
                      <Button type="submit" variant="primary">
                        Guardar Cambios
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setEditing(false)}
                      >
                        Cancelar
                      </Button>
                    </div>
                  )}
                </div>
              </form>

              {/* Estadísticas */}
              <div className="mt-8 pt-8 border-t border-gray-200">
                <h3 className="text-lg font-semibold mb-4">Resumen de Cuenta</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Total de Pedidos</p>
                    <p className="text-2xl font-bold text-blue-600">0</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Total Gastado</p>
                    <p className="text-2xl font-bold text-green-600">€0.00</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Productos Favoritos</p>
                    <p className="text-2xl font-bold text-purple-600">0</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer
        siteName="Sneakers Pro"
        description="Tu tienda de confianza"
        sections={[]}
        socialLinks={[]}
      />
    </div>
  );
}
