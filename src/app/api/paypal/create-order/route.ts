import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIP } from '@/lib/rateLimit';

const PAYPAL_API = process.env.PAYPAL_MODE === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

async function getPayPalAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !secret) {
    throw new Error('PayPal credentials not configured');
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
  return data.access_token;
}

export async function POST(request: NextRequest) {
  const ip = getClientIP(request);
  const { allowed } = checkRateLimit(`paypal-create:${ip}`, { maxRequests: 5, windowMs: 60_000 });
  if (!allowed) return NextResponse.json({ error: 'Demasiados intentos' }, { status: 429 });

  try {
    const { orderId, amount, items } = await request.json();

    if (!orderId || !amount) {
      return NextResponse.json({ error: 'orderId y amount requeridos' }, { status: 400 });
    }

    const accessToken = await getPayPalAccessToken();
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const paypalOrder = {
      intent: 'CAPTURE',
      purchase_units: [{
        reference_id: orderId,
        description: `Sneakers Pro - Pedido`,
        amount: {
          currency_code: 'EUR',
          value: amount.toFixed(2),
          breakdown: {
            item_total: {
              currency_code: 'EUR',
              value: items.reduce((sum: number, item: any) => 
                sum + (item.product.price * item.quantity), 0
              ).toFixed(2),
            },
            tax_total: {
              currency_code: 'EUR',
              value: (items.reduce((sum: number, item: any) => 
                sum + (item.product.price * item.quantity), 0
              ) * 0.21).toFixed(2),
            },
          },
        },
        items: items.map((item: any) => ({
          name: item.product.name.substring(0, 127),
          unit_amount: {
            currency_code: 'EUR',
            value: item.product.price.toFixed(2),
          },
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

    // Find approval URL
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
