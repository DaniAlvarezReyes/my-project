import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit, getClientIP } from '@/lib/rateLimit';
import { validateOrigin } from '@/lib/security';
import { priceOrder } from '@/lib/orderPricing';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  // Rate limit: 5 checkout attempts per minute per IP
  const ip = getClientIP(request);
  const { allowed, retryAfterMs } = checkRateLimit(`checkout:${ip}`, { maxRequests: 5, windowMs: 60_000 });
  if (!allowed) {
    return NextResponse.json({ error: 'Demasiados intentos. Espera un momento.' }, { status: 429, headers: { 'Retry-After': String(Math.ceil(retryAfterMs / 1000)) } });
  }

  if (!validateOrigin(request)) {
    return NextResponse.json({ error: 'Origen no autorizado' }, { status: 403 });
  }

  try {
    const { items, orderId, couponCode, useLoyalty } = await request.json();

    if (!orderId) {
      return NextResponse.json({ error: 'orderId requerido' }, { status: 400 });
    }

    // Resolve the user who owns the order (needed to validate loyalty points)
    const { data: orderRow } = await supabaseAdmin
      .from('orders')
      .select('user_id')
      .eq('id', orderId)
      .maybeSingle();

    // Recompute ALL prices server-side (DB prices + validated discounts)
    const { pricing, error: priceError } = await priceOrder(supabaseAdmin, items, {
      couponCode,
      useLoyalty: Boolean(useLoyalty),
      userId: orderRow?.user_id || null,
      excludeOrderId: orderId,
    });
    if (priceError || !pricing) {
      return NextResponse.json({ error: priceError || 'Error al calcular el pedido' }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = pricing.items.map((item) => ({
      price_data: {
        currency: 'eur',
        product_data: {
          name: item.name,
          description: `${item.brand}${item.selectedSize ? ` · Talla ${item.selectedSize}` : ''}${item.selectedColor ? ` · ${item.selectedColor}` : ''}`,
          images: item.image ? [item.image] : [],
        },
        unit_amount: Math.round(item.unitPrice * 100),
      },
      quantity: item.quantity,
    }));

    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${baseUrl}/checkout/success?order_id=${orderId}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/carrito?payment_cancelled=true`,
      metadata: { orderId },
      payment_intent_data: {
        metadata: { orderId },
      },
    };

    // Discounts (coupon + loyalty) — applied as a one-off Stripe coupon so the
    // amount charged matches exactly what the web showed the customer.
    const totalDiscount = pricing.couponDiscount + pricing.loyaltyDiscount;
    if (totalDiscount > 0) {
      const stripeCoupon = await stripe.coupons.create({
        amount_off: Math.round(totalDiscount * 100),
        currency: 'eur',
        duration: 'once',
        name: pricing.couponCode
          ? `Cupón ${pricing.couponCode}${pricing.loyaltyDiscount > 0 ? ' + puntos' : ''}`
          : 'Puntos de fidelidad',
      });
      sessionConfig.discounts = [{ coupon: stripeCoupon.id }];
    } else {
      // allow_promotion_codes cannot be combined with `discounts`
      sessionConfig.allow_promotion_codes = false;
    }

    // Shipping (recomputed server-side)
    sessionConfig.shipping_options = [
      {
        shipping_rate_data: {
          type: 'fixed_amount',
          fixed_amount: { amount: Math.round(pricing.shipping * 100), currency: 'eur' },
          display_name: pricing.shipping > 0 ? 'Envío estándar (3-5 días)' : 'Envío gratuito',
        },
      },
    ];

    const session = await stripe.checkout.sessions.create(sessionConfig);

    // Keep the order row in sync with the server-validated total
    await supabaseAdmin
      .from('orders')
      .update({
        subtotal: pricing.subtotal,
        shipping: pricing.shipping,
        total: pricing.total,
        loyalty_discount: pricing.loyaltyDiscount,
      })
      .eq('id', orderId);

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error: any) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: error.message || 'Error al crear la sesión de pago' },
      { status: 500 }
    );
  }
}
