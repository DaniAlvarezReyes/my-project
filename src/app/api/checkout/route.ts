import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit, getClientIP } from '@/lib/rateLimit';
import { validateOrigin } from '@/lib/security';

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
    const { items, orderId, amount, shippingCost } = await request.json();

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'No hay productos en el carrito' }, { status: 400 });
    }

    if (!orderId) {
      return NextResponse.json({ error: 'orderId requerido' }, { status: 400 });
    }

    // Fetch real prices from DB — never trust client-sent prices
    const productIds: string[] = items.map((item: any) => item.product.id);
    const { data: dbProducts, error: dbError } = await supabaseAdmin
      .from('products')
      .select('id, name, brand, price, images')
      .in('id', productIds);

    if (dbError || !dbProducts) {
      return NextResponse.json({ error: 'Error al verificar productos' }, { status: 500 });
    }

    const productMap = new Map(dbProducts.map((p: any) => [p.id, p]));

    // Ensure all requested products exist
    for (const item of items) {
      if (!productMap.has(item.product.id)) {
        return NextResponse.json({ error: `Producto no encontrado: ${item.product.id}` }, { status: 400 });
      }
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Build line items using DB prices — NOT client-provided prices
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map((item: any) => {
      const dbProduct = productMap.get(item.product.id);
      return {
        price_data: {
          currency: 'eur',
          product_data: {
            name: dbProduct.name,
            description: `${dbProduct.brand}${item.selectedSize ? ` · Talla ${item.selectedSize}` : ''}${item.selectedColor ? ` · ${item.selectedColor}` : ''}`,
            images: dbProduct.images?.[0] ? [dbProduct.images[0]] : [],
          },
          unit_amount: Math.round(dbProduct.price * 100),
        },
        quantity: item.quantity,
      };
    });

    // Compute subtotal from DB prices
    const subtotal = items.reduce((sum: number, item: any) => {
      const dbProduct = productMap.get(item.product.id);
      return sum + dbProduct.price * item.quantity;
    }, 0);

    // Session config
    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${baseUrl}/checkout/success?order_id=${orderId}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/carrito?payment_cancelled=true`,
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
