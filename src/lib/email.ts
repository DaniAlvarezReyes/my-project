// Transactional emails via Resend (https://resend.com — 3.000 emails/mes gratis).
// Si RESEND_API_KEY no está configurada, se hace log en consola (comportamiento anterior).
// No requiere SDK: usa la API HTTP directamente.

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || 'Sneakers Pro <onboarding@resend.dev>';

interface OrderEmailData {
  to: string;
  orderId: string;
  total: number; // EUR
  paymentMethod: 'Tarjeta' | 'PayPal';
}

export async function sendOrderConfirmationEmail(data: OrderEmailData): Promise<void> {
  const { to, orderId, total, paymentMethod } = data;

  if (!RESEND_API_KEY) {
    console.log('📧 [EMAIL SIMULATION] Confirmación de pedido (configura RESEND_API_KEY para envío real)');
    console.log(`   Para: ${to} · Pedido: ${orderId} · Total: €${total.toFixed(2)} · ${paymentMethod}`);
    return;
  }

  const shortId = orderId.slice(0, 8).toUpperCase();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#171717">
    <h1 style="font-size:20px;letter-spacing:-0.5px;text-transform:uppercase">Sneakers Pro</h1>
    <h2 style="font-size:16px">¡Gracias por tu pedido!</h2>
    <p>Hemos recibido tu pago correctamente y ya estamos preparando tu pedido.</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px">
      <tr><td style="padding:8px 0;color:#737373">Nº de pedido</td><td style="text-align:right;font-weight:bold">#${shortId}</td></tr>
      <tr><td style="padding:8px 0;color:#737373">Método de pago</td><td style="text-align:right">${paymentMethod}</td></tr>
      <tr><td style="padding:8px 0;color:#737373;border-top:1px solid #e5e5e5">Total pagado</td><td style="text-align:right;font-weight:bold;border-top:1px solid #e5e5e5">€${total.toFixed(2)}</td></tr>
    </table>
    <p><a href="${appUrl}/cuenta/pedidos" style="display:inline-block;background:#171717;color:#fff;padding:12px 24px;text-decoration:none;font-size:13px;font-weight:bold;text-transform:uppercase;letter-spacing:1px">Ver mi pedido</a></p>
    <p style="font-size:12px;color:#a3a3a3;margin-top:24px">Envío gratis en pedidos +50€ · Devoluciones gratuitas 30 días<br/>Si tienes dudas responde a este email o escríbenos desde ${appUrl}/contacto</p>
  </div>`;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: [to],
        subject: `Confirmación de pedido #${shortId} — Sneakers Pro`,
        html,
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error('Resend error:', err);
    } else {
      console.log(`📧 Email de confirmación enviado a ${to} (pedido ${shortId})`);
    }
  } catch (err) {
    // El email nunca debe romper el flujo de pago
    console.error('Error enviando email:', err);
  }
}
