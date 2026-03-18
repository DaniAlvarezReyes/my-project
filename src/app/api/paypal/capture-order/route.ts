import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit, getClientIP } from '@/lib/rateLimit';

const PAYPAL_API = process.env.PAYPAL_MODE === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function getPayPalAccessToken() {
  const auth = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString('base64');

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
  try {
    const { paypalOrderId, orderId } = await request.json();

    if (!paypalOrderId || !orderId) {
      return NextResponse.json(
        { error: 'paypalOrderId y orderId requeridos' },
        { status: 400 }
      );
    }

    const accessToken = await getPayPalAccessToken();

    // Capture the PayPal payment
    const response = await fetch(
      `${PAYPAL_API}/v2/checkout/orders/${paypalOrderId}/capture`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();

    if (!response.ok || data.status !== 'COMPLETED') {
      console.error('PayPal capture error:', data);
      return NextResponse.json(
        { error: 'Error al capturar el pago de PayPal' },
        { status: 400 }
      );
    }

    // Update order in Supabase
    const captureId = data.purchase_units?.[0]?.payments?.captures?.[0]?.id;

    const { error: updateError } = await supabaseAdmin
      .from('orders')
      .update({
        status: 'processing',
        payment_method: 'paypal',
        payment_intent_id: captureId || paypalOrderId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('Error updating order:', updateError);
    }

    // Simulate email
    const payerEmail = data.payer?.email_address;
    console.log('📧 [EMAIL SIMULATION] Confirmación de pedido PayPal');
    console.log(`   Para: ${payerEmail}`);
    console.log(`   Pedido: ${orderId}`);
    console.log(`   PayPal Capture: ${captureId}`);
    console.log('   → En producción: Enviar email con Resend/SendGrid');

    return NextResponse.json({
      success: true,
      captureId,
      status: data.status,
    });
  } catch (error: any) {
    console.error('PayPal capture error:', error);
    return NextResponse.json(
      { error: error.message || 'Error al capturar pago' },
      { status: 500 }
    );
  }
}
