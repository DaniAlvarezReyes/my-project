import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIP } from '@/lib/rateLimit';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

const SYSTEM_PROMPT = `Eres el asistente virtual de Sneakers Pro, una tienda online de zapatillas premium.

Tu personalidad:
- Amable, directo y experto en zapatillas
- Respondes en español siempre
- Respuestas cortas y útiles (máximo 3 frases a no ser que te pidan más)
- Usas emojis con moderación

Lo que sabes:
- Envío gratis en pedidos +50€
- Devoluciones gratis 30 días
- Pago seguro con Visa, Mastercard y PayPal
- Precios con IVA incluido
- Marcas: Nike, Adidas, New Balance, Puma, Asics, Reebok, Vans, Converse
- Categorías: Running, Lifestyle, Basketball, Training, Fútbol, Skateboarding
- Horario atención: Lunes a Viernes 9-18h

Lo que puedes hacer:
- Recomendar zapatillas según uso (correr, gym, casual, etc.)
- Ayudar a elegir talla
- Resolver dudas sobre envíos, devoluciones y pagos
- Sugerir combinaciones y looks

Lo que NO haces:
- No inventas productos específicos con precios exactos (di que consulten la tienda)
- No procesas pagos ni pedidos
- No accedes a datos de cuenta del usuario`;

export async function POST(request: NextRequest) {
  // Check API key is configured
  if (!ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: 'Asistente no configurado. Añade ANTHROPIC_API_KEY en .env.local' },
      { status: 503 }
    );
  }

  // Rate limit: 10 messages per minute per IP
  const ip = getClientIP(request);
  const { allowed } = checkRateLimit(`ai:${ip}`, { maxRequests: 10, windowMs: 60_000 });
  if (!allowed) {
    return NextResponse.json({ error: 'Demasiados mensajes. Espera un momento.' }, { status: 429 });
  }

  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Mensaje requerido' }, { status: 400 });
    }

    // Keep only last 10 messages to control token usage
    const trimmedMessages = messages.slice(-10);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 300,
        system: SYSTEM_PROMPT,
        messages: trimmedMessages,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Anthropic API error:', err);
      return NextResponse.json({ error: 'Error del asistente' }, { status: 500 });
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || 'Lo siento, no pude procesar tu mensaje.';

    return NextResponse.json({ message: text });
  } catch (error) {
    console.error('AI assistant error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
