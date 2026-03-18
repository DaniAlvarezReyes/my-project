'use client';
import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { MainNav } from '@/components/MainNav';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { supabase } from '@/lib/supabase';
import { useLoyaltyPoints } from '@/components/LoyaltyPoints';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

type PaymentMethod = 'stripe' | 'paypal';

function CheckoutContent() {
  const router = useRouter();
  const { items, subtotal, shipping, total, clearCart } = useCart();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const toast = useToast();
  const loyaltyData = useLoyaltyPoints();
  const [loyaltyApplied, setLoyaltyApplied] = useState(false);

  const [step, setStep] = useState(1); // 1=shipping, 2=payment
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

  // Prefill with user data
  useEffect(() => {
    if (user) {
      setShippingInfo(prev => ({
        ...prev,
        name: user.name || prev.name,
        lastName: user.lastName || prev.lastName,
        email: user.email || prev.email,
        phone: user.phone || prev.phone,
      }));
    }
  }, [user]);

  useEffect(() => {
    if (items.length === 0) router.push('/carrito');
  }, [items.length]);

  const loyaltyDiscount = loyaltyApplied && loyaltyData?.discount ? loyaltyData.discount : 0;

  useEffect(() => {
    setFinalTotal(Math.max(0, total - discount - loyaltyDiscount));
  }, [total, discount, loyaltyDiscount]);

  // Load PayPal SDK when payment step is reached and paypal is selected
  useEffect(() => {
    if (step !== 2 || paymentMethod !== 'paypal' || paypalLoadedRef.current) return;
    
    const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
    if (!clientId) return;

    const existingScript = document.getElementById('paypal-sdk');
    if (existingScript) {
      existingScript.remove();
      paypalLoadedRef.current = false;
    }

    const script = document.createElement('script');
    script.id = 'paypal-sdk';
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=EUR&locale=es_ES`;
    script.async = true;
    script.onload = () => {
      paypalLoadedRef.current = true;
      renderPayPalButtons();
    };
    document.body.appendChild(script);
  }, [step, paymentMethod]);

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

  // Re-render PayPal buttons when switching back to paypal
  useEffect(() => {
    if (step === 2 && paymentMethod === 'paypal' && paypalLoadedRef.current) {
      setTimeout(renderPayPalButtons, 100);
    }
  }, [paymentMethod, step]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShippingInfo({ ...shippingInfo, [e.target.name]: e.target.value });
  };

  const createSupabaseOrder = async (method: string): Promise<string> => {
    // Validate stock
    for (const item of items) {
      try {
        const { data: product } = await supabase
          .from('products')
          .select('stock, name, in_stock')
          .eq('id', item.product.id)
          .maybeSingle();
        if (product && (!product.in_stock || product.stock < item.quantity)) {
          throw new Error(`"${product.name}" sin stock suficiente (disponible: ${product.stock})`);
        }
      } catch (err: any) {
        if (err.message?.includes('stock')) throw err;
      }
    }

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user?.id || null,
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

    // Insert order items
    const orderItems = items.map(item => ({
      order_id: order.id,
      product_id: item.product.id,
      quantity: item.quantity,
      price: item.product.price,
      selected_size: item.selectedSize || null,
      selected_color: item.selectedColor || null,
    }));
    await supabase.from('order_items').insert(orderItems);

    // Decrement stock safely
    for (const item of items) {
      try {
        const { data: current } = await supabase
          .from('products')
          .select('stock')
          .eq('id', item.product.id)
          .maybeSingle();
        if (current && current.stock != null) {
          await supabase
            .from('products')
            .update({ stock: Math.max(0, current.stock - item.quantity) })
            .eq('id', item.product.id);
        }
      } catch {}
    }

    // Use coupon
    if (appliedCoupon) {
      await supabase.from('coupons').update({ uses: (appliedCoupon.uses || 0) + 1 }).eq('id', appliedCoupon.id);
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
      if (stripe && data.sessionId) {
        const { error: stripeErr } = await stripe.redirectToCheckout({ sessionId: data.sessionId });
        if (stripeErr) throw stripeErr;
      }
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
      if (coupon.uses >= coupon.max_uses) { toast.error('Cupón no disponible'); return; }
      const amt = coupon.discount_type === 'percentage' ? (subtotal * coupon.discount_value) / 100 : coupon.discount_value;
      setAppliedCoupon(coupon);
      setDiscount(amt);
      toast.success(`Cupón aplicado: -€${amt.toFixed(2)}`);
    } catch { toast.error('Error aplicando cupón'); }
  };

  const removeCoupon = () => { setAppliedCoupon(null); setDiscount(0); setCouponCode(''); };

  const validateShipping = () => {
    if (!shippingInfo.name || !shippingInfo.email || !shippingInfo.street || !shippingInfo.city || !shippingInfo.postalCode) {
      setError('Completa todos los campos obligatorios');
      return false;
    }
    setError('');
    return true;
  };

  if (items.length === 0) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <MainNav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>1</div>
            <span className={`ml-2 text-sm font-medium ${step >= 1 ? 'text-blue-600' : 'text-gray-500'}`}>Envío</span>
          </div>
          <div className={`w-16 h-0.5 mx-3 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`} />
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>2</div>
            <span className={`ml-2 text-sm font-medium ${step >= 2 ? 'text-blue-600' : 'text-gray-500'}`}>Pago</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-3">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Step 1: Shipping */}
            <div className={`bg-white rounded-xl shadow-sm border transition-all ${step === 1 ? 'border-blue-200' : 'border-gray-100'}`}>
              <div className="flex items-center justify-between p-5 border-b">
                <h2 className="text-lg font-bold">Dirección de Envío</h2>
                {step > 1 && (
                  <button onClick={() => setStep(1)} className="text-sm text-blue-600 hover:text-blue-800 font-medium">Editar</button>
                )}
              </div>

              {step === 1 ? (
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <TextField label="Nombre *" name="name" value={shippingInfo.name} onChange={handleInputChange} required fullWidth />
                    <TextField label="Apellidos *" name="lastName" value={shippingInfo.lastName} onChange={handleInputChange} required fullWidth />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <TextField label="Email *" type="email" name="email" value={shippingInfo.email} onChange={handleInputChange} required fullWidth />
                    <TextField label="Teléfono" name="phone" value={shippingInfo.phone} onChange={handleInputChange} fullWidth />
                  </div>
                  <TextField label="Dirección *" name="street" value={shippingInfo.street} onChange={handleInputChange} required fullWidth placeholder="Calle, número, piso..." />
                  <div className="grid grid-cols-3 gap-4">
                    <TextField label="Ciudad *" name="city" value={shippingInfo.city} onChange={handleInputChange} required fullWidth />
                    <TextField label="Provincia" name="state" value={shippingInfo.state} onChange={handleInputChange} fullWidth />
                    <TextField label="CP *" name="postalCode" value={shippingInfo.postalCode} onChange={handleInputChange} required fullWidth />
                  </div>
                  <Button variant="primary" size="lg" fullWidth onClick={() => validateShipping() && setStep(2)}>
                    Continuar al pago
                  </Button>
                </div>
              ) : (
                <div className="p-5 text-sm text-gray-600">
                  <p className="font-medium text-gray-900">{shippingInfo.name} {shippingInfo.lastName}</p>
                  <p>{shippingInfo.street}</p>
                  <p>{shippingInfo.city}, {shippingInfo.state} {shippingInfo.postalCode}</p>
                  <p>{shippingInfo.email} {shippingInfo.phone && `· ${shippingInfo.phone}`}</p>
                </div>
              )}
            </div>

            {/* Step 2: Payment */}
            {step >= 2 && (
              <div className="bg-white rounded-xl shadow-sm border border-blue-200 animate-fadeIn">
                <div className="p-5 border-b">
                  <h2 className="text-lg font-bold">Método de Pago</h2>
                </div>
                <div className="p-5 space-y-4">
                  {/* Payment method selector */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setPaymentMethod('stripe')}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${
                        paymentMethod === 'stripe'
                          ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-200'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
                          <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M3 10h18v7a3 3 0 01-3 3H6a3 3 0 01-3-3v-7zm0-3v-.5A2.5 2.5 0 015.5 4h13A2.5 2.5 0 0121 6.5V7H3z" /></svg>
                        </div>
                        <div>
                          <p className="font-semibold text-sm">Tarjeta de Crédito</p>
                          <p className="text-xs text-gray-500">Visa, MC, Amex</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 ml-13">
                        <span className="text-xs text-gray-400">+ Google Pay, Apple Pay</span>
                      </div>
                    </button>

                    <button
                      onClick={() => setPaymentMethod('paypal')}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${
                        paymentMethod === 'paypal'
                          ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-200'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-[#003087] rounded-lg flex items-center justify-center">
                          <span className="text-white font-bold text-sm">PP</span>
                        </div>
                        <div>
                          <p className="font-semibold text-sm">PayPal</p>
                          <p className="text-xs text-gray-500">Paga con tu cuenta</p>
                        </div>
                      </div>
                    </button>
                  </div>

                  {/* Stripe pay button */}
                  {paymentMethod === 'stripe' && (
                    <div className="pt-2">
                      <Button
                        variant="primary"
                        size="lg"
                        fullWidth
                        onClick={handleStripeCheckout}
                        disabled={loading}
                      >
                        {loading ? (
                          <span className="flex items-center justify-center gap-2">
                            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                            Procesando...
                          </span>
                        ) : (
                          `Pagar €${finalTotal.toFixed(2)} con tarjeta`
                        )}
                      </Button>
                      <p className="text-xs text-gray-400 text-center mt-2">
                        Serás redirigido a Stripe para completar el pago de forma segura
                      </p>
                    </div>
                  )}

                  {/* PayPal buttons container */}
                  {paymentMethod === 'paypal' && (
                    <div className="pt-2">
                      {process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ? (
                        <>
                          <div ref={paypalContainerRef} className="min-h-[52px]" />
                          <p className="text-xs text-gray-400 text-center mt-2">
                            Se abrirá una ventana de PayPal para completar el pago
                          </p>
                        </>
                      ) : (
                        <div className="text-center py-6 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-500 mb-2">PayPal no está configurado todavía</p>
                          <p className="text-xs text-gray-400">Añade NEXT_PUBLIC_PAYPAL_CLIENT_ID en .env.local</p>
                          <button
                            onClick={() => setPaymentMethod('stripe')}
                            className="mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Pagar con tarjeta →
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Security badges */}
                  <div className="flex items-center justify-center gap-4 pt-4 border-t mt-4">
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                      Pago seguro SSL
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                      Protección al comprador
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right column: Order summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sticky top-20 space-y-4">
              <h2 className="text-lg font-bold">Resumen del Pedido</h2>

              <div className="max-h-64 overflow-y-auto space-y-3 pr-1">
                {items.map(item => (
                  <div key={item.id} className="flex gap-3">
                    <div className="w-14 h-14 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      <img src={item.product.images?.[0]} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.product.name}</p>
                      <p className="text-xs text-gray-500">
                        x{item.quantity}
                        {item.selectedSize && ` · T.${item.selectedSize}`}
                        {item.selectedColor && ` · ${item.selectedColor}`}
                      </p>
                    </div>
                    <span className="text-sm font-bold flex-shrink-0">€{(item.product.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-2 pt-3 border-t text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal (IVA incluido)</span><span>€{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Envío</span>
                  <span>{shipping === 0 ? <span className="text-green-600 font-medium">GRATIS</span> : `€${shipping.toFixed(2)}`}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600 font-medium">
                    <span>Cupón ({appliedCoupon?.code})</span><span>-€{discount.toFixed(2)}</span>
                  </div>
                )}
                {loyaltyDiscount > 0 && (
                  <div className="flex justify-between text-amber-600 font-medium">
                    <span>Puntos fidelidad</span><span>-€{loyaltyDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>Total</span><span className="text-blue-600">€{finalTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Coupon */}
              <div className="pt-3 border-t">
                {!appliedCoupon ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="Código de cupón"
                      className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button onClick={applyCoupon} className="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 font-medium">
                      Aplicar
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-green-50 p-3 rounded-lg">
                    <div>
                      <span className="font-mono font-bold text-green-800 text-sm">{appliedCoupon.code}</span>
                      <span className="text-xs text-green-600 ml-2">-€{discount.toFixed(2)}</span>
                    </div>
                    <button onClick={removeCoupon} className="text-red-500 hover:text-red-700 text-lg">×</button>
                  </div>
                )}
              </div>

              {/* Loyalty Points */}
              {loyaltyData && loyaltyData.discount > 0 && (
                <div className="pt-3 border-t">
                  {!loyaltyApplied ? (
                    <div className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🏆</span>
                          <div>
                            <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">Puntos de fidelidad</p>
                            <p className="text-xs text-amber-700 dark:text-amber-400">{loyaltyData.totalPoints} pts · Nivel {loyaltyData.level}</p>
                          </div>
                        </div>
                        <span className="text-lg font-bold text-green-600">-€{loyaltyData.discount}</span>
                      </div>
                      <button
                        onClick={() => { setLoyaltyApplied(true); toast.success(`¡Descuento de €${loyaltyData.discount} aplicado!`); }}
                        className="w-full py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition-colors"
                      >
                        Canjear €{loyaltyData.discount} en descuento
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span>🏆</span>
                        <span className="text-sm font-medium text-amber-800 dark:text-amber-300">Puntos canjeados</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-green-600">-€{loyaltyDiscount.toFixed(2)}</span>
                        <button onClick={() => setLoyaltyApplied(false)} className="text-red-500 hover:text-red-700 text-sm">×</button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Guarantees */}
              <div className="pt-3 border-t space-y-2">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Envío gratis en pedidos +50€
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Devoluciones gratis 30 días
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Garantía de satisfacción
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>}>
      <CheckoutContent />
    </Suspense>
  );
}
