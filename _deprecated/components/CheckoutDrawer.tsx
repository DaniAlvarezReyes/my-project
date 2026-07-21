'use client';
import React, { useState, useEffect, useRef } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { supabase } from '@/lib/supabase';
import { useLoyaltyPoints } from '@/components/LoyaltyPoints';
import { useRouter } from 'next/navigation';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

type PaymentMethod = 'stripe' | 'paypal';

interface CheckoutDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CheckoutDrawer({ isOpen, onClose }: CheckoutDrawerProps) {
  const router = useRouter();
  const { items, subtotal, shipping, total, clearCart } = useCart();
  const { user } = useAuth();
  const toast = useToast();
  const loyaltyData = useLoyaltyPoints();
  const [loyaltyApplied, setLoyaltyApplied] = useState(false);

  const [step, setStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('stripe');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [discount, setDiscount] = useState(0);
  const [finalTotal, setFinalTotal] = useState(total);
  const paypalContainerRef = useRef<HTMLDivElement>(null);
  const paypalLoadedRef = useRef(false);

  const [shippingInfo, setShippingInfo] = useState({
    name: '', lastName: '', email: '', phone: '',
    street: '', city: '', state: '', postalCode: '', country: 'España',
  });

  useEffect(() => {
    if (user) {
      setShippingInfo(prev => ({
        ...prev,
        name: (user as any).name || prev.name,
        lastName: (user as any).lastName || prev.lastName,
        email: user.email || prev.email,
        phone: (user as any).phone || prev.phone,
      }));
    }
  }, [user]);

  const loyaltyDiscount = loyaltyApplied && loyaltyData?.discount ? loyaltyData.discount : 0;

  useEffect(() => {
    setFinalTotal(Math.max(0, total - discount - loyaltyDiscount));
  }, [total, discount, loyaltyDiscount]);

  // Reset step when drawer opens
  useEffect(() => {
    if (isOpen) { setStep(1); setError(''); }
  }, [isOpen]);

  // Lock scroll when open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Load PayPal SDK
  useEffect(() => {
    if (!isOpen || step !== 2 || paymentMethod !== 'paypal' || paypalLoadedRef.current) return;
    const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
    if (!clientId) return;
    const existingScript = document.getElementById('paypal-sdk-drawer');
    if (existingScript) { existingScript.remove(); paypalLoadedRef.current = false; }
    const script = document.createElement('script');
    script.id = 'paypal-sdk-drawer';
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=EUR&locale=es_ES`;
    script.async = true;
    script.onload = () => { paypalLoadedRef.current = true; renderPayPalButtons(); };
    document.body.appendChild(script);
  }, [isOpen, step, paymentMethod]);

  useEffect(() => {
    if (isOpen && step === 2 && paymentMethod === 'paypal' && paypalLoadedRef.current) {
      setTimeout(renderPayPalButtons, 150);
    }
  }, [paymentMethod, step, isOpen]);

  const renderPayPalButtons = () => {
    if (!paypalContainerRef.current || !(window as any).paypal) return;
    paypalContainerRef.current.innerHTML = '';
    (window as any).paypal.Buttons({
      style: { layout: 'vertical', shape: 'rect', label: 'pay', height: 48 },
      createOrder: async () => {
        setError('');
        try {
          const orderId = await createSupabaseOrder('paypal');
          const res = await fetch('/api/paypal/create-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId, amount: finalTotal, items }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error);
          localStorage.setItem('pendingOrderId', orderId);
          return data.paypalOrderId;
        } catch (err: any) {
          setError(err.message || 'Error al crear orden PayPal');
          throw err;
        }
      },
      onApprove: async (data: any) => {
        setLoading(true);
        try {
          const orderId = localStorage.getItem('pendingOrderId');
          const res = await fetch('/api/paypal/capture-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paypalOrderId: data.orderID, orderId }),
          });
          const result = await res.json();
          if (!res.ok) throw new Error(result.error);
          clearCart();
          onClose();
          router.push(`/checkout/success?order_id=${orderId}&method=paypal`);
        } catch (err: any) {
          setError(err.message || 'Error al capturar pago PayPal');
          setLoading(false);
        }
      },
      onError: (err: any) => {
        console.error('PayPal error:', err);
        setError('Error en el proceso de PayPal');
      },
    }).render(paypalContainerRef.current);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setShippingInfo({ ...shippingInfo, [e.target.name]: e.target.value });
  };

  const createSupabaseOrder = async (method: string): Promise<string> => {
    if (!user?.id) {
      throw new Error('Debes iniciar sesión para realizar un pedido.');
    }

    // Validate stock before creating order
    for (const item of items) {
      const { data: product } = await supabase
        .from('products')
        .select('stock, name, in_stock')
        .eq('id', item.product.id)
        .maybeSingle();
      if (product && (!product.in_stock || product.stock < item.quantity)) {
        throw new Error(`"${product.name}" no tiene stock suficiente (disponible: ${product.stock ?? 0})`);
      }
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        status: 'pending',
        subtotal, shipping,
        tax: 0,
        total: finalTotal,
        payment_method: method,
        shipping_address: JSON.stringify(shippingInfo),
      })
      .select()
      .maybeSingle();
    if (orderError) throw new Error(orderError.message);
    if (!order) throw new Error('No se pudo crear el pedido. Inténtalo de nuevo.');
    const orderItems = items.map(item => ({
      order_id: order.id,
      product_id: item.product.id,
      quantity: item.quantity,
      price: item.product.price,
      selected_size: item.selectedSize || null,
      selected_color: item.selectedColor || null,
    }));
    const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
    if (itemsError) throw new Error('Error al guardar los artículos del pedido.');
    if (appliedCoupon) {
      await supabase.rpc('increment_coupon_uses', { coupon_id: appliedCoupon.id })
        .then(({ error }) => { if (error) console.warn('Coupon increment failed:', error.message); });
    }
    return order.id;
  };

  const handleStripeCheckout = async () => {
    setLoading(true);
    setError('');
    try {
      const orderId = await createSupabaseOrder('card');
      localStorage.setItem('pendingOrderId', orderId);
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, orderId, amount: finalTotal, shippingCost: shipping }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const stripe = await stripePromise;
      if (!stripe) throw new Error('No se pudo cargar el procesador de pagos. Recarga e inténtalo de nuevo.');
      if (!data.sessionId) throw new Error('No se recibió sesión de pago de Stripe.');
      const { error: stripeErr } = await stripe.redirectToCheckout({ sessionId: data.sessionId });
      if (stripeErr) throw stripeErr;
    } catch (err: any) {
      setError(err.message || 'Error al procesar el pago');
      setLoading(false);
    }
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) { toast.warning('Ingresa un código de cupón'); return; }
    try {
      const { data: coupon, error } = await supabase
        .from('coupons').select('*').eq('code', couponCode.toUpperCase()).eq('active', true).maybeSingle();
      if (error || !coupon) { toast.error('Cupón inválido o no activo'); return; }
      if (coupon.min_purchase && subtotal < coupon.min_purchase) { toast.warning(`Compra mínima: €${coupon.min_purchase}`); return; }
      const amt = coupon.discount_type === 'percentage' ? (subtotal * coupon.discount_value) / 100 : coupon.discount_value;
      setAppliedCoupon(coupon);
      setDiscount(amt);
      toast.success(`Cupón aplicado: -€${amt.toFixed(2)}`);
    } catch { toast.error('Error aplicando cupón'); }
  };

  const validateShipping = () => {
    if (!shippingInfo.name || !shippingInfo.email || !shippingInfo.street || !shippingInfo.city || !shippingInfo.postalCode) {
      setError('Completa los campos obligatorios (*)');
      return false;
    }
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(shippingInfo.email)) {
      setError('Introduce un email válido');
      return false;
    }
    setError('');
    return true;
  };

  const inputCls = 'w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent dark:border-neutral-700 dark:bg-neutral-800 dark:text-white placeholder-gray-400 transition';

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed inset-y-0 right-0 z-50 flex flex-col bg-white dark:bg-neutral-900 shadow-2xl transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        style={{ width: 'min(520px, 100vw)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-neutral-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="p-2 -ml-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <h2 className="text-base font-bold">Tramitar pedido</h2>
          </div>
          {/* Step indicator */}
          <div className="flex items-center gap-2">
            {[1, 2].map((s) => (
              <React.Fragment key={s}>
                <div className={`flex items-center gap-1.5 ${s <= step ? 'text-black dark:text-white' : 'text-gray-400'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-colors ${s < step ? 'bg-black dark:bg-white text-white dark:text-black' : s === step ? 'bg-black dark:bg-white text-white dark:text-black' : 'bg-gray-200 dark:bg-neutral-700 text-gray-500'}`}>
                    {s < step ? (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                    ) : s}
                  </div>
                  <span className="text-[11px] font-medium hidden sm:block">{s === 1 ? 'Envío' : 'Pago'}</span>
                </div>
                {s < 2 && <div className={`w-8 h-px transition-colors ${step >= 2 ? 'bg-black dark:bg-white' : 'bg-gray-200 dark:bg-neutral-700'}`} />}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {/* Order mini-summary at top */}
          <div className="px-6 py-3 bg-gray-50 dark:bg-neutral-800/50 border-b border-gray-100 dark:border-neutral-800">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">{items.length} {items.length === 1 ? 'artículo' : 'artículos'}</span>
              <div className="flex items-center gap-3">
                {discount > 0 && <span className="text-green-600 font-medium">-€{discount.toFixed(2)}</span>}
                <span className="font-bold text-base">€{finalTotal.toFixed(2)}</span>
              </div>
            </div>
            {/* Coupon row */}
            {!appliedCoupon ? (
              <div className="flex gap-2 mt-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="Código de cupón"
                  className="flex-1 px-2.5 py-1.5 text-xs border border-gray-200 dark:border-neutral-700 dark:bg-neutral-800 rounded-lg focus:ring-1 focus:ring-black"
                />
                <button onClick={applyCoupon} className="px-3 py-1.5 bg-gray-900 dark:bg-white text-white dark:text-black text-xs rounded-lg font-medium hover:opacity-80">
                  Aplicar
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between mt-2 bg-green-50 dark:bg-green-900/20 px-3 py-1.5 rounded-lg">
                <span className="text-xs font-mono font-bold text-green-700 dark:text-green-400">{appliedCoupon.code} · -€{discount.toFixed(2)}</span>
                <button onClick={() => { setAppliedCoupon(null); setDiscount(0); setCouponCode(''); }} className="text-red-500 text-sm hover:text-red-700">×</button>
              </div>
            )}
          </div>

          <div className="px-6 py-5 space-y-5">
            {/* Error */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 p-3 rounded-xl flex items-center gap-2 text-sm">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {error}
              </div>
            )}

            {/* STEP 1 — Shipping address */}
            {step === 1 && (
              <div className="space-y-4 animate-fadeIn">
                <h3 className="text-sm font-bold uppercase tracking-wide text-gray-900 dark:text-white">Dirección de envío</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Nombre *</label>
                    <input className={inputCls} name="name" value={shippingInfo.name} onChange={handleInputChange} placeholder="Juan" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Apellidos *</label>
                    <input className={inputCls} name="lastName" value={shippingInfo.lastName} onChange={handleInputChange} placeholder="García" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 sm:col-span-1">
                    <label className="text-xs text-gray-500 mb-1 block">Email *</label>
                    <input className={inputCls} type="email" name="email" value={shippingInfo.email} onChange={handleInputChange} placeholder="tu@email.com" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Teléfono</label>
                    <input className={inputCls} name="phone" value={shippingInfo.phone} onChange={handleInputChange} placeholder="+34 600 000 000" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Dirección *</label>
                  <input className={inputCls} name="street" value={shippingInfo.street} onChange={handleInputChange} placeholder="Calle Gran Vía, 28, 3º A" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-3 sm:col-span-1">
                    <label className="text-xs text-gray-500 mb-1 block">Código Postal *</label>
                    <input className={inputCls} name="postalCode" value={shippingInfo.postalCode} onChange={handleInputChange} placeholder="28001" />
                  </div>
                  <div className="col-span-3 sm:col-span-1">
                    <label className="text-xs text-gray-500 mb-1 block">Ciudad *</label>
                    <input className={inputCls} name="city" value={shippingInfo.city} onChange={handleInputChange} placeholder="Madrid" />
                  </div>
                  <div className="col-span-3 sm:col-span-1">
                    <label className="text-xs text-gray-500 mb-1 block">Provincia</label>
                    <input className={inputCls} name="state" value={shippingInfo.state} onChange={handleInputChange} placeholder="Madrid" />
                  </div>
                </div>

                {/* Shipping summary */}
                <div className="bg-gray-50 dark:bg-neutral-800 rounded-xl p-4 space-y-2 text-sm">
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Subtotal</span><span>€{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Envío</span>
                    <span className={shipping === 0 ? 'text-green-600 font-medium' : ''}>{shipping === 0 ? 'GRATIS' : `€${shipping.toFixed(2)}`}</span>
                  </div>
                  <div className="flex justify-between font-bold pt-2 border-t border-gray-200 dark:border-neutral-700">
                    <span>Total</span><span>€{finalTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2 — Payment */}
            {step === 2 && (
              <div className="space-y-4 animate-fadeIn">
                {/* Address summary (editable) */}
                <div className="bg-gray-50 dark:bg-neutral-800 rounded-xl p-4">
                  <div className="flex items-start justify-between">
                    <div className="text-sm text-gray-600 dark:text-gray-400 space-y-0.5">
                      <p className="font-semibold text-gray-900 dark:text-white">{shippingInfo.name} {shippingInfo.lastName}</p>
                      <p>{shippingInfo.street}</p>
                      <p>{shippingInfo.postalCode} {shippingInfo.city}{shippingInfo.state ? `, ${shippingInfo.state}` : ''}</p>
                      <p>{shippingInfo.email}</p>
                    </div>
                    <button onClick={() => setStep(1)} className="text-xs font-medium text-black dark:text-white underline underline-offset-2 flex-shrink-0 ml-4">
                      Editar
                    </button>
                  </div>
                </div>

                <h3 className="text-sm font-bold uppercase tracking-wide text-gray-900 dark:text-white">Método de pago</h3>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setPaymentMethod('stripe')}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${paymentMethod === 'stripe' ? 'border-black dark:border-white bg-black/5 dark:bg-white/10' : 'border-gray-200 dark:border-neutral-700 hover:border-gray-400'}`}
                  >
                    <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center mb-2">
                      <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M3 10h18v7a3 3 0 01-3 3H6a3 3 0 01-3-3v-7zm0-3v-.5A2.5 2.5 0 015.5 4h13A2.5 2.5 0 0121 6.5V7H3z" /></svg>
                    </div>
                    <p className="text-sm font-semibold">Tarjeta</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Visa, MC, Amex</p>
                  </button>
                  <button
                    onClick={() => setPaymentMethod('paypal')}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${paymentMethod === 'paypal' ? 'border-black dark:border-white bg-black/5 dark:bg-white/10' : 'border-gray-200 dark:border-neutral-700 hover:border-gray-400'}`}
                  >
                    <div className="w-9 h-9 bg-[#003087] rounded-lg flex items-center justify-center mb-2">
                      <span className="text-white font-bold text-xs">PP</span>
                    </div>
                    <p className="text-sm font-semibold">PayPal</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Tu cuenta PayPal</p>
                  </button>
                </div>

                {paymentMethod === 'stripe' && (
                  <button
                    onClick={handleStripeCheckout}
                    disabled={loading}
                    className="w-full py-4 bg-black dark:bg-white text-white dark:text-black font-bold text-sm rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                        Procesando...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                        Pagar €{finalTotal.toFixed(2)} de forma segura
                      </>
                    )}
                  </button>
                )}

                {paymentMethod === 'paypal' && (
                  <div>
                    {process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ? (
                      <div ref={paypalContainerRef} className="min-h-[52px]" />
                    ) : (
                      <div className="text-center py-4 bg-gray-50 dark:bg-neutral-800 rounded-xl">
                        <p className="text-sm text-gray-500">PayPal no configurado</p>
                        <button onClick={() => setPaymentMethod('stripe')} className="mt-2 text-sm text-black dark:text-white font-medium underline underline-offset-2">
                          Pagar con tarjeta →
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Security badges */}
                <div className="flex items-center justify-center gap-5 text-xs text-gray-400 pt-2">
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    Pago 100% seguro
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                    Protección al comprador
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer CTA */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-neutral-800 flex-shrink-0 bg-white dark:bg-neutral-900">
          {step === 1 && !user && (
            <button
              onClick={() => { onClose(); router.push('/auth/login?redirect=/carrito'); }}
              className="w-full py-4 bg-black dark:bg-white text-white dark:text-black font-bold text-sm rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              Iniciar sesión para comprar
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>
            </button>
          )}
          {step === 1 && user && (
            <button
              onClick={() => validateShipping() && setStep(2)}
              className="w-full py-4 bg-black dark:bg-white text-white dark:text-black font-bold text-sm rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              Continuar al pago
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          )}
          {step === 2 && paymentMethod === 'stripe' && (
            <button
              onClick={handleStripeCheckout}
              disabled={loading}
              className="w-full py-4 bg-black dark:bg-white text-white dark:text-black font-bold text-sm rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
            >
              {loading ? (
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  Pagar con tarjeta · €{finalTotal.toFixed(2)}
                </>
              )}
            </button>
          )}
          {step === 2 && paymentMethod === 'paypal' && (
            <p className="text-center text-xs text-neutral-400 py-2">Usa los botones de PayPal de arriba para completar el pago.</p>
          )}
        </div>
      </div>
    </>
  );
}
