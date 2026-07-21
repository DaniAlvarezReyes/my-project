import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit, getClientIP } from '@/lib/rateLimit';
import { validateOrigin } from '@/lib/security';
import { priceOrder } from '@/lib/orderPricing';

const PAYPAL_API = process.env.PAYPAL_MODE === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function getPayPalAccessToken() {
  // Accept both names: server-only PAYPAL_CLIENT_ID or the public one used by the SDK button
  const clientId = process.env.PAYPAL_CLIENT_ID || process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !secret) {
    throw new Error('PayPal no está configurado (faltan NEXT_PUBLIC_PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET en .env.local)');
  }

  const auth = Buffer.from(`${clientId}:${secret}`).toString('base64');

  const response = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  const data = await response.json();
  if (!response.ok || !data.access_token) {
    throw new Error('No se pudo autenticar con PayPal. Revisa las credenciales.');
  }
  return data.access_token;
}

export async function POST(request: NextRequest) {
  const ip = getClientIP(request);
  const { allowed } = checkRateLimit(`paypal-create:${ip}`, { maxRequests: 5, windowMs: 60_000 });
  if (!allowed) return NextResponse.json({ error: 'Demasiados intentos' }, { status: 429 });

  if (!validateOrigin(request)) {
    return NextResponse.json({ error: 'Origen no autorizado' }, { status: 403 });
  }

  try {
    const { orderId, items, couponCode, useLoyalty } = await request.json();

    if (!orderId) {
      return NextResponse.json({ error: 'orderId requerido' }, { status: 400 });
    }

    // Resolve the user who owns the order (needed to validate loyalty points)
    const { data: orderRow } = await supabaseAdmin
      .from('orders')
      .select('user_id')
      .eq('id', orderId)
      .maybeSingle();

    // Recompute ALL prices server-side — never trust client-sent amounts
    const { pricing, error: priceError } = await priceOrder(supabaseAdmin, items, {
      couponCode,
      useLoyalty: Boolean(useLoyalty),
      userId: orderRow?.user_id || null,
      excludeOrderId: orderId,
    });
    if (priceError || !pricing) {
      return NextResponse.json({ error: priceError || 'Error al calcular el pedido' }, { status: 400 });
    }

    const accessToken = await getPayPalAccessToken();
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Prices include VAT. breakdown: item_total + shipping - discount = amount.value
    const totalDiscount = pricing.couponDiscount + pricing.loyaltyDiscount;

    const amountBreakdown: Record<string, { currency_code: string; value: string }> = {
      item_total: { currency_code: 'EUR', value: pricing.subtotal.toFixed(2) },
    };
    if (pricing.shipping > 0) {
      amountBreakdown.shipping = { currency_code: 'EUR', value: pricing.shipping.toFixed(2) };
    }
    if (totalDiscount > 0.001) {
      amountBreakdown.discount = { currency_code: 'EUR', value: totalDiscount.toFixed(2) };
    }

    const paypalOrder = {
      intent: 'CAPTURE',
      purchase_units: [{
        reference_id: orderId,
        description: 'Sneakers Pro - Pedido',
        amount: {
          currency_code: 'EUR',
          value: pricing.total.toFixed(2),
          breakdown: amountBreakdown,
        },
        items: pricing.items.map((item) => ({
          name: item.name.substring(0, 127),
          unit_amount: { currency_code: 'EUR', value: item.unitPrice.toFixed(2) },
          quantity: String(item.quantity),
          category: 'PHYSICAL_GOODS',
        })),
      }],
      application_context: {
        brand_name: 'Sneakers Pro',
        locale: 'es-ES',
        landing_page: 'NO_PREFERENCE',
        user_action: 'PAY_NOW',
        return_url: `${baseUrl}/checkout/success?order_id=${orderId}&method=paypal`,
        cancel_url: `${baseUrl}/carrito`,
      },
    };

    const response = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paypalOrder),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('PayPal create order error:', data);
      return NextResponse.json(
        { error: data.message || 'Error al crear orden PayPal' },
        { status: response.status }
      );
    }

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

    const approvalUrl = data.links?.find((link: any) => link.rel === 'approve')?.href;

    return NextResponse.json({
      paypalOrderId: data.id,
      approvalUrl,
    });
  } catch (error: any) {
    console.error('PayPal create error:', error);
    return NextResponse.json(
      { error: error.message || 'Error al crear orden PayPal' },
      { status: 500 }
    );
  }
}
