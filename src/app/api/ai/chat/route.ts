import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit, getClientIP } from '@/lib/rateLimit';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  const ip = getClientIP(request);
  const { allowed } = checkRateLimit(`ai-chat:${ip}`, { maxRequests: 15, windowMs: 60_000 });
  if (!allowed) {
    return NextResponse.json({ error: 'Demasiados mensajes. Espera un momento.' }, { status: 429 });
  }

  if (!ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'AI no configurado. Añade ANTHROPIC_API_KEY a .env.local' }, { status: 500 });
  }

  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Mensajes no válidos' }, { status: 400 });
    }

    // Fetch products for context
    let productContext = '';
    try {
      const { data: products } = await supabaseAdmin
        .from('products')
        .select('name, brand, price, original_price, category, in_stock, stock, sizes, colors, description')
        .eq('in_stock', true)
        .order('created_at', { ascending: false })
        .limit(50);

      if (products && products.length > 0) {
        productContext = products.map(p =>
          `- ${p.name} (${p.brand}) — €${p.price}${p.original_price ? ` (antes €${p.original_price})` : ''} — Cat: ${p.category} — Tallas: ${(p.sizes || []).join(', ')} — Colores: ${(p.colors || []).join(', ')}${(p.stock || 0) <= 5 ? ' ⚠️ Pocas uds' : ''}`
        ).join('\n');
      }
    } catch (err) {
      console.warn('Could not load products for AI context:', err);
    }

    const systemPrompt = `Eres el asistente de compra de Sneakers Pro, una tienda online de zapatillas premium.

Tu personalidad:
- Amigable, directo, con conocimiento experto en sneakers
- Respondes SIEMPRE en español
- Respuestas cortas y útiles (máximo 3-4 frases)
- Cuando recomiendes un producto, incluye nombre, marca y precio

Catálogo actual:
${productContext || 'No hay productos cargados en este momento.'}

Puedes ayudar con:
- Recomendar zapatillas según actividad (running, casual, basket)
- Guía de tallas
- Comparar productos del catálogo
- Cuidado y limpieza de zapatillas
- Envío (gratis +50€, 2-5 días) y devoluciones (30 días gratis)

NO puedes: procesar pagos, acceder a cuentas de usuarios, inventar productos.`;

    // Clean messages - ensure proper format
    const cleanMessages = messages.slice(-10).map((m: any) => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: String(m.content || ''),
    }));

    const body = {
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      system: systemPrompt,
      messages: cleanMessages,
    };

    console.log('Calling Anthropic API with model:', body.model);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Anthropic API error (${response.status}):`, errorText);

      // If model not found, try fallback model
      if (response.status === 404 || errorText.includes('model')) {
        console.log('Trying fallback model...');
        const fallbackResponse = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({ ...body, model: 'claude-3-5-sonnet-20241022' }),
        });

        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          const reply = fallbackData.content?.[0]?.text || 'No he podido procesar tu mensaje.';
          return NextResponse.json({ reply });
        }

        const fallbackErr = await fallbackResponse.text();
        console.error('Fallback also failed:', fallbackErr);
      }

      return NextResponse.json({
        error: `Error del asistente (${response.status}). Revisa la API key en .env.local`,
        debug: process.env.NODE_ENV === 'development' ? errorText : undefined,
      }, { status: 502 });
    }

    const data = await response.json();
    const reply = data.content?.[0]?.text || 'Lo siento, no he podido procesar tu mensaje.';

    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error('AI chat error:', error?.message || error);
    return NextResponse.json({ error: 'Error interno del asistente' }, { status: 500 });
  }
}
