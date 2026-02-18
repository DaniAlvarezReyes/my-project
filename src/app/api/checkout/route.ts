import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

export async function POST(request: NextRequest) {
  try {
    const { items, userId } = await request.json();

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'No hay productos en el carrito' },
        { status: 400 }
      );
    }

    // Calcular totales
    const subtotal = items.reduce(
      (sum: number, item: any) => sum + item.product.price * item.quantity,
      0
    );
    const shipping = subtotal >= 50 ? 0 : 5.99;
    const tax = subtotal * 0.21;
    const total = subtotal + shipping + tax;

    // Crear sesión de Stripe Checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: items.map((item: any) => ({
        price_data: {
          currency: 'eur',
          product_data: {
            name: item.product.name,
            description: item.product.brand,
            images: [item.product.images[0]],
            metadata: {
              product_id: item.product.id,
              size: item.selectedSize || '',
              color: item.selectedColor || '',
            },
          },
          unit_amount: Math.round(item.product.price * 100), // Convertir a centavos
        },
        quantity: item.quantity,
      })),
      // Añadir envío como línea separada
      ...(shipping > 0 && {
        shipping_options: [
          {
            shipping_rate_data: {
              type: 'fixed_amount',
              fixed_amount: {
                amount: Math.round(shipping * 100),
                currency: 'eur',
              },
              display_name: 'Envío estándar',
              delivery_estimate: {
                minimum: {
                  unit: 'business_day',
                  value: 3,
                },
                maximum: {
                  unit: 'business_day',
                  value: 5,
                },
              },
            },
          },
        ],
      }),
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/carrito`,
      metadata: {
        userId: userId || '',
        subtotal: subtotal.toFixed(2),
        shipping: shipping.toFixed(2),
        tax: tax.toFixed(2),
        total: total.toFixed(2),
      },
      // Guardar los items en metadata para el webhook
      payment_intent_data: {
        metadata: {
          userId: userId || '',
          items: JSON.stringify(
            items.map((item: any) => ({
              product_id: item.product.id,
              product_name: item.product.name,
              quantity: item.quantity,
              price: item.product.price,
              size: item.selectedSize,
              color: item.selectedColor,
            }))
          ),
        },
      },
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: error.message || 'Error al crear la sesión de pago' },
      { status: 500 }
    );
  }
}
