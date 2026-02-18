import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'No signature found' },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json(
        { error: `Webhook Error: ${err.message}` },
        { status: 400 }
      );
    }

    // Manejar el evento
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;

      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('PaymentIntent succeeded:', paymentIntent.id);
        break;

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object as Stripe.PaymentIntent;
        console.error('Payment failed:', failedPayment.id);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  try {
    const userId = session.metadata?.userId;
    const items = session.payment_intent
      ? JSON.parse(
          (
            await stripe.paymentIntents.retrieve(
              session.payment_intent as string
            )
          ).metadata.items || '[]'
        )
      : [];

    if (!userId) {
      console.error('No userId in session metadata');
      return;
    }

    // Obtener la dirección de envío (si está disponible)
    const shippingAddress = session.shipping_details?.address || session.customer_details?.address;

    // Crear el pedido en Supabase
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: userId,
        status: 'processing',
        subtotal: parseFloat(session.metadata?.subtotal || '0'),
        shipping: parseFloat(session.metadata?.shipping || '0'),
        tax: parseFloat(session.metadata?.tax || '0'),
        total: parseFloat(session.metadata?.total || '0'),
        payment_method: 'card',
        payment_intent_id: session.payment_intent as string,
        shipping_address: shippingAddress || {},
      })
      .select()
      .single();

    if (orderError) {
      console.error('Error creating order:', orderError);
      return;
    }

    // Crear los items del pedido
    if (items.length > 0 && order) {
      const orderItems = items.map((item: any) => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
        selected_size: item.size || null,
        selected_color: item.color || null,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        console.error('Error creating order items:', itemsError);
      }
    }

    console.log('Order created successfully:', order.id);
  } catch (error) {
    console.error('Error in handleCheckoutCompleted:', error);
  }
}
