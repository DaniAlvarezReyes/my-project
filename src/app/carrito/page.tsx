'use client';
import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MainNav } from '@/components/MainNav';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/Button';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';

export default function CarritoPage() {
  const {
    items,
    subtotal,
    shipping,
    tax,
    total,
    updateQuantity,
    removeItem,
  } = useCart();
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  const handleCheckout = () => {
    if (!isAuthenticated) {
      router.push('/auth/login?redirect=/checkout');
    } else {
      router.push('/checkout');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <MainNav />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Breadcrumb */}
        <nav className="flex mb-8" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li>
              <Link href="/" className="text-gray-700 hover:text-blue-600">
                Inicio
              </Link>
            </li>
            <li>
              <span className="text-gray-400 mx-2">/</span>
              <span className="text-gray-900 font-medium">Carrito</span>
            </li>
          </ol>
        </nav>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Carrito de Compra
        </h1>

        {items.length === 0 ? (
          /* Carrito vacío */
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <svg
              className="mx-auto h-24 w-24 text-gray-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Tu carrito está vacío
            </h2>
            <p className="text-gray-600 mb-6">
              ¡Añade productos para empezar a comprar!
            </p>
            <Link href="/productos">
              <Button variant="primary" size="lg">
                Ver Productos
              </Button>
            </Link>
          </div>
        ) : (
          /* Carrito con productos */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Lista de productos */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <div
                  key={`${item.product.id}-${item.selectedSize}-${item.selectedColor}`}
                  className="bg-white rounded-lg shadow-md p-6 flex gap-6"
                >
                  {/* Imagen */}
                  <div className="flex-shrink-0">
                    <img
                      src={item.product.images[0]}
                      alt={item.product.name}
                      className="w-32 h-32 object-cover rounded-lg"
                    />
                  </div>

                  {/* Detalles */}
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {item.product.name}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {item.product.brand}
                        </p>
                        {item.selectedSize && (
                          <p className="text-sm text-gray-600">
                            Talla: <span className="font-medium">{item.selectedSize}</span>
                          </p>
                        )}
                        {item.selectedColor && (
                          <p className="text-sm text-gray-600">
                            Color: <span className="font-medium">{item.selectedColor}</span>
                          </p>
                        )}
                      </div>

                      {/* Precio */}
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">
                          €{item.product.price.toFixed(2)}
                        </p>
                        {item.product.originalPrice && (
                          <p className="text-sm text-gray-500 line-through">
                            €{item.product.originalPrice.toFixed(2)}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Cantidad y eliminar */}
                    <div className="flex justify-between items-center mt-4">
                      <div className="flex items-center border border-gray-300 rounded-lg">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="px-3 py-1 hover:bg-gray-100"
                        >
                          -
                        </button>
                        <span className="px-4 py-1 border-x border-gray-300">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="px-3 py-1 hover:bg-gray-100"
                          disabled={item.quantity >= item.product.stock}
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => removeItem(item.product.id)}
                        className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Eliminar
                      </button>
                    </div>

                    {/* Subtotal del item */}
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-right font-semibold">
                        Subtotal: €{(item.product.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Resumen del pedido */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                  Resumen del Pedido
                </h2>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal ({items.length} {items.length === 1 ? 'artículo' : 'artículos'})</span>
                    <span className="font-medium">€{subtotal.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between text-gray-600">
                    <span>Envío</span>
                    <span className="font-medium">
                      {shipping === 0 ? (
                        <span className="text-green-600">GRATIS</span>
                      ) : (
                        `€${shipping.toFixed(2)}`
                      )}
                    </span>
                  </div>

                  {shipping > 0 && subtotal < 50 && (
                    <div className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
                      ¡Añade €{(50 - subtotal).toFixed(2)} más para envío gratis!
                    </div>
                  )}

                  <div className="flex justify-between text-gray-600">
                    <span>IVA (21%)</span>
                    <span className="font-medium">€{tax.toFixed(2)}</span>
                  </div>

                  <div className="border-t border-gray-200 pt-3 mt-3">
                    <div className="flex justify-between">
                      <span className="text-lg font-bold">Total</span>
                      <span className="text-2xl font-bold text-blue-600">
                        €{total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  onClick={handleCheckout}
                  className="mb-4"
                >
                  Proceder al Pago
                </Button>

                <Link href="/productos">
                  <Button variant="outline" size="md" fullWidth>
                    Seguir Comprando
                  </Button>
                </Link>

                {/* Información adicional */}
                <div className="mt-6 pt-6 border-t border-gray-200 space-y-3 text-sm text-gray-600">
                  <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Pago seguro SSL</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Devoluciones gratis en 30 días</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Garantía de satisfacción</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer
        siteName="Sneakers Pro"
        description="Tu tienda de confianza para zapatillas de calidad."
        sections={[]}
        socialLinks={[]}
      />
    </div>
  );
}
