import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { checkRateLimit, getClientIP } from '@/lib/rateLimit';
import { validateOrigin } from '@/lib/security';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

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
    const { items, orderId, amount, shippingCost } = await request.json();

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'No hay productos en el carrito' }, { status: 400 });
    }

    if (!orderId) {
      return NextResponse.json({ error: 'orderId requerido' }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Build line items from cart
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map((item: any) => ({
      price_data: {
        currency: 'eur',
        product_data: {
          name: item.product.name,
          description: `${item.product.brand}${item.selectedSize ? ` · Talla ${item.selectedSize}` : ''}${item.selectedColor ? ` · ${item.selectedColor}` : ''}`,
          images: item.product.images?.[0] ? [item.product.images[0]] : [],
        },
        unit_amount: Math.round(item.product.price * 100),
      },
      quantity: item.quantity,
    }));

    // Prices already include IVA
    const subtotal = items.reduce((sum: number, item: any) => sum + item.product.price * item.quantity, 0);

    // Session config
    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${baseUrl}/checkout/success?order_id=${orderId}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/carrito`,
      metadata: {
        orderId,
      },
      payment_intent_data: {
        metadata: { orderId },
      },
      // Enable Google Pay, Apple Pay, Link automatically
      payment_method_options: {
        card: {
          setup_future_usage: undefined,
        },
      },
    };

    // Add shipping as option if > 0
    const shippingAmount = shippingCost ?? (subtotal >= 50 ? 0 : 5.99);
    if (shippingAmount > 0) {
      sessionConfig.shipping_options = [
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: { amount: Math.round(shippingAmount * 100), currency: 'eur' },
            display_name: 'Envío estándar (3-5 días)',
          },
        },
      ];
    } else {
      sessionConfig.shipping_options = [
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: { amount: 0, currency: 'eur' },
            display_name: 'Envío gratuito',
          },
        },
      ];
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error: any) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: error.message || 'Error al crear la sesión de pago' },
      { status: 500 }
    );
  }
}
