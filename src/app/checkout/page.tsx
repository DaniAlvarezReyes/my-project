'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { MainNav } from '@/components/MainNav';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, shipping, tax, total } = useCart();
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [shippingInfo, setShippingInfo] = useState({
    name: user?.name || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    street: user?.address?.street || '',
    city: user?.address?.city || '',
    state: user?.address?.state || '',
    postalCode: user?.address?.postalCode || '',
    country: user?.address?.country || 'España',
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login?redirect=/checkout');
    }
    if (items.length === 0) {
      router.push('/carrito');
    }
  }, [isAuthenticated, items, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShippingInfo({
      ...shippingInfo,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validar campos requeridos
      if (!shippingInfo.name || !shippingInfo.email || !shippingInfo.street || 
          !shippingInfo.city || !shippingInfo.postalCode) {
        setError('Por favor completa todos los campos requeridos');
        setLoading(false);
        return;
      }

      // Crear sesión de Stripe
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items,
          userId: user?.id,
          shippingInfo,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear la sesión de pago');
      }

      // Redirigir a Stripe Checkout
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Error al cargar Stripe');
      }

      const { error: stripeError } = await stripe.redirectToCheckout({
        sessionId: data.sessionId,
      });

      if (stripeError) {
        throw new Error(stripeError.message);
      }
    } catch (err: any) {
      setError(err.message || 'Error al procesar el pago');
      setLoading(false);
    }
  };

  if (!isAuthenticated || items.length === 0) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <MainNav />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Finalizar Compra</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formulario de envío */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-6">Información de Envío</h2>

              {error && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 mb-4">
                <TextField
                  label="Nombre *"
                  name="name"
                  value={shippingInfo.name}
                  onChange={handleInputChange}
                  required
                  fullWidth
                />
                <TextField
                  label="Apellidos"
                  name="lastName"
                  value={shippingInfo.lastName}
                  onChange={handleInputChange}
                  fullWidth
                />
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <TextField
                  label="Email *"
                  type="email"
                  name="email"
                  value={shippingInfo.email}
                  onChange={handleInputChange}
                  required
                  fullWidth
                />
                <TextField
                  label="Teléfono"
                  type="tel"
                  name="phone"
                  value={shippingInfo.phone}
                  onChange={handleInputChange}
                  fullWidth
                />
              </div>

              <TextField
                label="Dirección *"
                name="street"
                value={shippingInfo.street}
                onChange={handleInputChange}
                placeholder="Calle, número, piso, puerta"
                required
                fullWidth
                className="mb-4"
              />

              <div className="grid grid-cols-2 gap-4 mb-4">
                <TextField
                  label="Ciudad *"
                  name="city"
                  value={shippingInfo.city}
                  onChange={handleInputChange}
                  required
                  fullWidth
                />
                <TextField
                  label="Provincia *"
                  name="state"
                  value={shippingInfo.state}
                  onChange={handleInputChange}
                  required
                  fullWidth
                />
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <TextField
                  label="Código Postal *"
                  name="postalCode"
                  value={shippingInfo.postalCode}
                  onChange={handleInputChange}
                  required
                  fullWidth
                />
                <TextField
                  label="País"
                  name="country"
                  value={shippingInfo.country}
                  onChange={handleInputChange}
                  fullWidth
                />
              </div>

              <div className="border-t border-gray-200 pt-6 mt-6">
                <h3 className="text-lg font-semibold mb-4">Método de Pago</h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center">
                    <svg className="w-6 h-6 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    <div>
                      <p className="font-semibold">Pago seguro con tarjeta</p>
                      <p className="text-sm text-gray-600">Procesado por Stripe</p>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Serás redirigido a Stripe para completar el pago de forma segura.
                </p>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                disabled={loading}
              >
                {loading ? 'Procesando...' : `Pagar €${total.toFixed(2)}`}
              </Button>
            </form>
          </div>

          {/* Resumen del pedido */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
              <h2 className="text-xl font-bold mb-6">Resumen del Pedido</h2>

              <div className="space-y-4 mb-6">
                {items.map((item) => (
                  <div key={`${item.product.id}-${item.selectedSize}`} className="flex gap-4">
                    <img
                      src={item.product.images[0]}
                      alt={item.product.name}
                      className="w-20 h-20 object-cover rounded"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm">{item.product.name}</h3>
                      <p className="text-sm text-gray-600">
                        Cantidad: {item.quantity}
                      </p>
                      {item.selectedSize && (
                        <p className="text-sm text-gray-600">
                          Talla: {item.selectedSize}
                        </p>
                      )}
                      <p className="font-semibold text-sm mt-1">
                        €{(item.product.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-200 pt-4 space-y-2">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>€{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Envío</span>
                  <span>{shipping === 0 ? 'GRATIS' : `€${shipping.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>IVA (21%)</span>
                  <span>€{tax.toFixed(2)}</span>
                </div>
                <div className="border-t border-gray-200 pt-2 mt-2">
                  <div className="flex justify-between">
                    <span className="text-lg font-bold">Total</span>
                    <span className="text-2xl font-bold text-blue-600">
                      €{total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200 space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span>Pago 100% seguro</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Envío en 3-5 días laborables</span>
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
