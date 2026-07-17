import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

// Use service role key for webhook (server-side, bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error('Webhook signature failed:', err.message);
      return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handlePaymentSuccess(session);
        break;
      }
      case 'checkout.session.expired': {
        // User abandoned the Stripe checkout — cancel order (trigger restores stock)
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.orderId;
        if (orderId) await cancelOrder(orderId, 'session expired');
        break;
      }
      case 'payment_intent.payment_failed': {
        const pi = event.data.object as Stripe.PaymentIntent;
        const orderId = pi.metadata?.orderId;
        if (orderId) await cancelOrder(orderId, 'payment failed');
        break;
      }
      default:
        console.log(`Unhandled event: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

async function handlePaymentSuccess(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.orderId;

  if (!orderId) {
    console.error('No orderId in session metadata');
    return;
  }

  try {
    // Update the EXISTING order to processing
    const { error } = await supabaseAdmin
      .from('orders')
      .update({
        status: 'processing',
        payment_intent_id: session.payment_intent as string,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (error) {
      console.error('Error updating order:', error);
      return;
    }

    // Simulate email notification (log for now)
    console.log('📧 [EMAIL SIMULATION] Confirmación de pedido');
    console.log(`   Para: ${session.customer_details?.email}`);
    console.log(`   Pedido: ${orderId}`);
    console.log(`   Total: €${(session.amount_total || 0) / 100}`);
    console.log('   → En producción: Enviar email con Resend/SendGrid');

    console.log(`✅ Order ${orderId} updated to processing`);
  } catch (err) {
    console.error('handlePaymentSuccess error:', err);
  }
}

async function cancelOrder(orderId: string, reason: string) {
  try {
    const { error } = await supabaseAdmin
      .from('orders')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', orderId)
      .neq('status', 'cancelled'); // idempotent — don't re-trigger if already cancelled

    if (error) {
      console.error(`cancelOrder error (${reason}):`, error);
      return;
    }
    // Stock is restored automatically by the trigger_restore_stock_on_cancel DB trigger
    console.log(`❌ Order ${orderId} cancelled (${reason})`);
  } catch (err) {
    console.error('cancelOrder error:', err);
  }
}
