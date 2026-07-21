import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── System prompt de Sneakers Pro ────────────────────────────────────────────
// Cuando integres en DentVida, solo cambias este bloque.
const SYSTEM_PROMPT = `Eres el asistente virtual de Sneakers Pro, una tienda online especializada en zapatillas deportivas y lifestyle premium.

Tu personalidad: cercano, apasionado por las zapatillas, directo y útil. Nunca eres genérico.

Lo que puedes hacer:
- Recomendar modelos según deporte (running, baloncesto, tenis, lifestyle), presupuesto, o estilo
- Comparar dos o más modelos cuando el usuario lo pida
- Ayudar con tallas (guía general: Europa, UK, US) y tipos de pisada
- Informar sobre política de envíos (24-48h España, gratuito +80€), devoluciones (30 días) y garantías
- Guiar al usuario hasta el carrito cuando esté listo para comprar

Lo que NO haces:
- Inventar precios o stock que no conoces — dices "compruébalo en la ficha del producto"
- Dar soporte de pedidos ya realizados — derivas al email pedidos@sneakerspro.es
- Salirte del tema de zapatillas y deporte

Catálogo de referencia (los más vendidos):
- Nike Air Max 90: lifestyle clásico, 130€, tallas 36-47
- Adidas Ultraboost 23: running premium, 180€, muy buena amortiguación
- New Balance 574: estilo retro, 95€, ideal para uso diario
- On Cloudmonster: trail y running, 160€, tecnología CloudTec
- Salomon XT-6: trail técnico, 145€, muy demandado en lifestyle urbano

Si el usuario saluda o empieza sin contexto, preséntate brevemente y pregunta qué tipo de zapatilla busca o para qué uso.

Responde siempre en español. Sé conciso — máximo 3-4 frases por respuesta salvo que el usuario pida una comparativa detallada.`;

// ─── Tipos ────────────────────────────────────────────────────────────────────
type Message = {
  role: "user" | "assistant";
  content: string;
};

// ─── Handler POST ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { messages }: { messages: Message[] } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "messages requerido" }, { status: 400 });
    }

    // Streaming con la API de Anthropic
    const stream = client.messages.stream({
      model: "claude-sonnet-4-5",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages,
    });

    // Devolvemos un ReadableStream — el cliente lee chunk a chunk
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              controller.enqueue(
                new TextEncoder().encode(event.delta.text)
              );
            }
          }
        } catch (err) {
          controller.error(err);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (err) {
    console.error("[/api/chat] Error:", err);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
