'use client';
import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { MainNav } from '@/components/MainNav';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/Button';
import { useCart } from '@/context/CartContext';

function PaymentCancelledBanner() {
  const searchParams = useSearchParams();
  if (searchParams.get('payment_cancelled') !== 'true') return null;
  return (
    <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-xl px-5 py-4 flex items-center gap-3">
      <svg className="w-5 h-5 text-yellow-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      <div>
        <p className="text-sm font-semibold text-yellow-800">Pago no completado</p>
        <p className="text-xs text-yellow-700 mt-0.5">Tu carrito sigue guardado. Puedes intentarlo de nuevo cuando quieras.</p>
      </div>
    </div>
  );
}

const FREE_SHIPPING_THRESHOLD = 50;

function UrgencyBadge({ stock }: { stock?: number }) {
  if (!stock || stock > 5) return null;
  if (stock === 1) return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse inline-block" />
      ¡Última unidad!
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
      <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse inline-block" />
      Quedan solo {stock}
    </span>
  );
}


function variantOptions(product: any): { sizes: string[]; colors: string[] } {
  const cv: any[] = product?.color_variants || [];
  const sizesFromVariants = [...new Set(cv.flatMap((v: any) => (v.sizes || []).map((s: any) => s.size ?? s)))].filter(Boolean) as string[];
  const colorsFromVariants = cv.map((v: any) => v.color_name).filter(Boolean) as string[];
  const sizes = (sizesFromVariants.length > 0 ? sizesFromVariants : (product?.sizes || [])) as string[];
  const colors = (colorsFromVariants.length > 0 ? colorsFromVariants : (product?.colors || [])) as string[];
  return { sizes, colors };
}

export default function CarritoPage() {
  const { items, subtotal, shipping, total, updateQuantity, removeItem, changeVariant } = useCart();

  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const progressPct = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950">
      <MainNav />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Breadcrumb */}
        <nav className="flex mb-8">
          <ol className="inline-flex items-center space-x-1 text-sm text-gray-500">
            <li><Link href="/" className="hover:text-black dark:hover:text-white transition-colors">Inicio</Link></li>
            <li><span className="mx-2">/</span><span className="text-gray-900 dark:text-white font-medium">Carrito</span></li>
          </ol>
        </nav>

        <Suspense>
          <PaymentCancelledBanner />
        </Suspense>

        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Carrito de compra {items.length > 0 && <span className="text-lg font-normal text-gray-400 ml-2">({items.length} {items.length === 1 ? 'artículo' : 'artículos'})</span>}
        </h1>

        {items.length === 0 ? (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl p-12 text-center border border-gray-100 dark:border-neutral-800">
            <svg className="mx-auto h-20 w-20 text-gray-300 dark:text-neutral-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">Tu carrito está vacío</h2>
            <p className="text-gray-500 mb-8">¡Añade productos para empezar a comprar!</p>
            <Link href="/productos">
              <Button variant="primary" size="lg">Ver Productos</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Products list */}
            <div className="lg:col-span-2 space-y-4">
              {/* Free shipping progress */}
              <div className="bg-white dark:bg-neutral-900 rounded-2xl p-5 border border-gray-100 dark:border-neutral-800">
                {remaining > 0 ? (
                  <>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Te faltan <span className="font-bold text-black dark:text-white">€{remaining.toFixed(2)}</span> para envío gratis
                      </span>
                      <span className="text-xs text-gray-400">{Math.round(progressPct)}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-2">Envío gratis en pedidos superiores a €{FREE_SHIPPING_THRESHOLD}</p>
                  </>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-green-600">¡Envío gratis desbloqueado!</p>
                      <p className="text-xs text-gray-400">Tu pedido incluye envío gratuito</p>
                    </div>
                    <div className="ml-auto h-2 flex-1 max-w-[120px] bg-green-100 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full w-full" />
                    </div>
                  </div>
                )}
              </div>

              {/* Items */}
              {items.map((item) => (
                <div key={item.id} className="bg-white dark:bg-neutral-900 rounded-2xl p-5 border border-gray-100 dark:border-neutral-800 flex gap-5 group hover:border-gray-200 dark:hover:border-neutral-700 transition-colors">
                  {/* Image */}
                  <Link href={`/productos/${item.product.id}`} className="flex-shrink-0">
                    <img
                      src={item.product.images?.[0] || 'https://via.placeholder.com/128'}
                      alt={item.product.name}
                      className="w-28 h-28 object-cover rounded-xl bg-gray-100"
                    />
                  </Link>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-0.5">{item.product.brand}</p>
                        <Link href={`/productos/${item.product.id}`}>
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-white leading-snug hover:underline underline-offset-2 line-clamp-2">{item.product.name}</h3>
                        </Link>
                        {(() => {
                          const { sizes, colors } = variantOptions(item.product);
                          return (
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                              {sizes.length > 0 ? (
                                <label className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                  <span className="font-medium">Talla</span>
                                  <select
                                    value={item.selectedSize || ''}
                                    onChange={(e) => changeVariant(item.id, e.target.value || undefined, item.selectedColor)}
                                    className="text-xs bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-200 px-2 py-1 rounded-md font-medium border-0 focus:ring-2 focus:ring-black dark:focus:ring-white cursor-pointer"
                                  >
                                    <option value="">—</option>
                                    {sizes.map((s) => <option key={s} value={s}>{s}</option>)}
                                  </select>
                                </label>
                              ) : item.selectedSize ? (
                                <span className="text-xs bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-md font-medium">T. {item.selectedSize}</span>
                              ) : null}

                              {colors.length > 0 ? (
                                <label className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                  <span className="font-medium">Color</span>
                                  <select
                                    value={item.selectedColor || ''}
                                    onChange={(e) => changeVariant(item.id, item.selectedSize, e.target.value || undefined)}
                                    className="text-xs bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-200 px-2 py-1 rounded-md font-medium border-0 focus:ring-2 focus:ring-black dark:focus:ring-white cursor-pointer"
                                  >
                                    <option value="">—</option>
                                    {colors.map((c) => <option key={c} value={c}>{c}</option>)}
                                  </select>
                                </label>
                              ) : item.selectedColor ? (
                                <span className="text-xs bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-md font-medium">{item.selectedColor}</span>
                              ) : null}

                              <UrgencyBadge stock={item.product.stock} />
                            </div>
                          );
                        })()}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-lg font-bold text-gray-900 dark:text-white">€{(item.product.price * item.quantity).toFixed(2)}</p>
                        {(item.product.originalPrice || (item.product as any).original_price) && (
                          <p className="text-xs text-gray-400 line-through">€{((item.product.originalPrice || (item.product as any).original_price) * item.quantity).toFixed(2)}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-0.5">€{item.product.price.toFixed(2)}/ud</p>
                      </div>
                    </div>

                    {/* Quantity + Remove */}
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center border border-gray-200 dark:border-neutral-700 rounded-xl overflow-hidden">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-9 h-9 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-neutral-800 text-gray-500 transition-colors font-bold"
                        >−</button>
                        <span className="w-10 text-center text-sm font-bold text-gray-900 dark:text-white border-x border-gray-200 dark:border-neutral-700">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-9 h-9 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-neutral-800 text-gray-500 transition-colors font-bold"
                          disabled={item.product.stock !== undefined && item.quantity >= item.product.stock}
                        >+</button>
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              <Link href="/productos" className="flex items-center gap-2 text-sm text-gray-500 hover:text-black dark:hover:text-white transition-colors mt-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                Seguir comprando
              </Link>
            </div>

            {/* Order summary */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-gray-100 dark:border-neutral-800 sticky top-24">
                <h2 className="text-base font-bold text-gray-900 dark:text-white mb-5">Resumen del pedido</h2>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-gray-500 dark:text-gray-400">
                    <span>Subtotal ({items.length} {items.length === 1 ? 'artículo' : 'artículos'})</span>
                    <span className="font-medium text-gray-900 dark:text-white">€{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-500 dark:text-gray-400">
                    <span>Envío estimado</span>
                    <span className={shipping === 0 ? 'font-bold text-green-600' : 'font-medium text-gray-900 dark:text-white'}>
                      {shipping === 0 ? 'GRATIS' : `€${shipping.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-400">IVA incluido en todos los precios</div>
                </div>

                <div className="border-t border-gray-100 dark:border-neutral-800 my-4" />

                <div className="flex justify-between items-baseline mb-6">
                  <span className="text-base font-bold text-gray-900 dark:text-white">Total</span>
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">€{total.toFixed(2)}</span>
                </div>

                <Link href="/checkout" className="block w-full">
                  <button className="w-full py-4 bg-black dark:bg-white text-white dark:text-black font-bold text-sm rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    Tramitar pedido
                  </button>
                </Link>

                <div className="mt-5 pt-5 border-t border-gray-100 dark:border-neutral-800 space-y-2.5">
                  {[
                    { label: 'Pago 100% seguro con SSL' },
                    { label: 'Devoluciones gratis en 30 días' },
                    { label: 'Garantía de satisfacción' },
                  ].map(({ label }) => (
                    <div key={label} className="flex items-center gap-2.5 text-xs text-gray-500 dark:text-gray-400">
                      <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                      {label}
                    </div>
                  ))}
                </div>

                {/* Payment logos */}
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-neutral-800">
                  <p className="text-[10px] text-gray-400 text-center mb-2 uppercase tracking-wider">Métodos de pago aceptados</p>
                  <div className="flex items-center justify-center gap-3">
                    <div className="h-6 px-2 bg-gray-100 dark:bg-neutral-800 rounded flex items-center text-[10px] font-bold text-gray-500">VISA</div>
                    <div className="h-6 px-2 bg-gray-100 dark:bg-neutral-800 rounded flex items-center text-[10px] font-bold text-gray-500">MC</div>
                    <div className="h-6 px-2 bg-gray-100 dark:bg-neutral-800 rounded flex items-center text-[10px] font-bold text-[#003087]">PayPal</div>
                    <div className="h-6 px-2 bg-gray-100 dark:bg-neutral-800 rounded flex items-center text-[10px] font-bold text-gray-500">Amex</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
