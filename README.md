# 🛍️ SNEAKERS PRO — E-COMMERCE COMPLETO

**Tienda online con Next.js 15, Supabase, Stripe, PayPal, asistente IA y panel de administración**

[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Tailwind](https://img.shields.io/badge/Tailwind-3-38bdf8)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ecf8e)](https://supabase.com/)
[![Stripe](https://img.shields.io/badge/Stripe-Payments-008cdd)](https://stripe.com/)

---

## ⚡ INSTALACIÓN RÁPIDA

```bash
npm install                # 1. Instalar dependencias
cp .env.example .env.local # 2. Copiar variables de entorno (editar después)
npm run dev                # 3. Ejecutar
```

**Abre**: http://localhost:3000

⚠️ Para que todo funcione necesitas configurar Supabase y ejecutar **los dos** archivos SQL (ver [Configuración](#️-configuración)).

---

## ✨ FUNCIONALIDADES

### Tienda
- 🔐 Autenticación completa (registro, login, recuperar contraseña, OAuth callback)
- 🛍️ Catálogo con filtros por categoría, marca y precio + búsqueda con autocompletado
- 📦 Ficha de producto con galería, lightbox, variantes de color, tallas, guía de tallas
- ⭐ Reseñas con votos "útil" + comentarios con fotos de la comunidad
- 🛒 Carrito sincronizado con Supabase (invitado → usuario al iniciar sesión)
- 💳 Pagos con **Stripe** y **PayPal** (precios y descuentos validados en servidor)
- 🎟️ Cupones de descuento + 🏆 puntos de fidelidad (canje persistente)
- 📊 Comparador de productos, vistos recientemente, productos relacionados
- 🔔 Notificaciones in-app, alertas de precio y de stock, newsletter
- 🤖 Asistente IA (Claude) con contexto del catálogo real
- 📱 PWA + responsive + modo oscuro + A/B testing

### Panel de administración (`/admin`, requiere `role = 'admin'`)
Dashboard con gráficas · Productos · Pedidos · Usuarios · Reseñas · Devoluciones · Cupones · Newsletter · Notificaciones

---

## 🛠️ STACK

```
Frontend:   Next.js 15 (App Router) + TypeScript + Tailwind CSS
Backend:    Next.js API Routes
BD/Auth:    Supabase (PostgreSQL + RLS)
Pagos:      Stripe Checkout + PayPal Orders API
IA:         Anthropic Claude (asistente de compras)
Emails:     Resend (opcional; simulados por consola si no se configura)
Testing:    Playwright (tests/checkout-flow.spec.ts)
```

---

## ⚙️ CONFIGURACIÓN

### 1. Supabase

1. Crea un proyecto en https://supabase.com
2. En **SQL Editor** ejecuta, en este orden:
   - `supabase/schema.sql` (tablas base)
   - `supabase/schema-extra.sql` (resto de tablas, rol admin, triggers de stock, RPCs, bucket de imágenes)
   - `supabase/seed-products.sql` (productos de ejemplo)
3. Copia URL y claves a `.env.local`

Para convertir un usuario en admin:
```sql
UPDATE profiles SET role = 'admin' WHERE email = 'tu@email.com';
```

### 2. Stripe

1. Cuenta en https://stripe.com → API keys (modo test) a `.env.local`
2. Webhook apuntando a `/api/webhook` (eventos `checkout.session.*` y `payment_intent.payment_failed`)
3. En local: `stripe listen --forward-to localhost:3000/api/webhook`

### 3. PayPal (opcional)

Crea una app en https://developer.paypal.com y añade a `.env.local`:
`NEXT_PUBLIC_PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_MODE=sandbox`

### 4. IA y emails (opcionales)

- `ANTHROPIC_API_KEY` → activa el asistente IA
- `RESEND_API_KEY` + `EMAIL_FROM` → emails de confirmación reales (si no, se simulan por consola)

---

## 🧪 TESTING

**Tarjeta de prueba Stripe**: `4242 4242 4242 4242` · fecha futura · CVC cualquiera

**Cupón de prueba** (creado por schema-extra.sql): `BIENVENIDA10` (−10 %, compra mínima 30 €)

```bash
npx playwright test   # E2E del flujo de checkout
```

---

## 📦 ESTRUCTURA

```
src/
├── app/               # Páginas (30+) + API routes (checkout, paypal, webhook, ai)
│   └── admin/         # Panel de administración (9 secciones)
├── components/        # 30+ componentes UI
├── context/           # Auth, Cart, Favorites, Theme, Toast
├── data/              # Productos y categorías estáticos (fallback)
├── lib/               # supabase, orderPricing, email, security, rateLimit, i18n…
└── types/             # Tipos TypeScript

supabase/
├── schema.sql         # Tablas base
├── schema-extra.sql   # ⚠️ OBLIGATORIO: resto del esquema (ejecutar tras schema.sql)
└── seed-products.sql  # Datos de ejemplo

_deprecated/           # Código retirado en la auditoría (borrable)
my-project/            # Proyecto Plasmic independiente (no forma parte de la tienda)
```

---

## 🚀 DESPLIEGUE (Vercel)

1. Push a GitHub e importa el repo en https://vercel.com
2. Configura TODAS las variables de `.env.local` en Vercel
3. Actualiza `NEXT_PUBLIC_APP_URL` al dominio real y el webhook de Stripe

Checklist: Supabase con ambos SQL ejecutados · Stripe en producción · webhook actualizado · compra de prueba · dominio.

---

## 📄 NOTAS

- La auditoría completa del código está en `INFORME-AUDITORIA.md`.
- El rate-limit es en memoria: para varias instancias usa Upstash Redis.
- `_deprecated/` contiene componentes y endpoints retirados; puedes borrar la carpeta cuando quieras.
