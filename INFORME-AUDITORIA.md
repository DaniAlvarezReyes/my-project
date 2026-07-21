# Informe de auditoría — Sneakers Pro (simple-store)

Fecha: 21/07/2026 · Auditoría completa de código, compilación y coherencia funcional.

Estado final: **`tsc --noEmit` sin errores · `next build` completa las 46 páginas sin fallos.**

---

## 1. Errores arreglados (ya aplicados en el código)

### 1.1 El build de producción estaba roto (2 errores)
- **`src/app/productos/[id]/layout.tsx`** — En Next.js 15 `params` es una `Promise`. `generateMetadata` usaba la firma antigua (`params.id` directo) y el build fallaba con error de tipos. Corregido con `await params`.
- **`src/app/auth/reset-password/page.tsx`** — Usaba `useSearchParams()` sin envolver en `<Suspense>`, lo que abortaba el prerender de la página y tiraba todo el build. Además esa variable **no se usaba en ningún sitio**: era código muerto. Eliminada.

> Con solo estos dos arreglos, `npm run build` pasa de fallar a compilar entero.

### 1.2 Dependencia fantasma
- **`package.json`** — `/api/chat/route.ts` importa `@anthropic-ai/sdk`, pero el paquete no estaba declarado en `package.json` (estaba instalado "a mano" en `node_modules`). En cualquier instalación limpia (`rm -rf node_modules && npm install`, Vercel, otro PC) el proyecto no compilaría. Añadido a dependencies. **Ejecuta `npm install` una vez.**

### 1.3 PayPal era un callejón sin salida
- El servidor (`create-order`/`capture-order`) leía `PAYPAL_CLIENT_ID`, pero `.env.example` y el cliente usan `NEXT_PUBLIC_PAYPAL_CLIENT_ID`. Aunque configuraras todo según el ejemplo, el servidor siempre fallaría con "credentials not configured". Ahora ambas rutas aceptan cualquiera de los dos nombres, y `.env.example` lo documenta.
- Además `getPayPalAccessToken` no comprobaba la respuesta: si las credenciales eran malas devolvía `undefined` y el error aparecía más tarde en un sitio confuso. Ahora falla con mensaje claro.
- Nota: tu `.env.local` actual **no tiene ninguna variable de PayPal**, así que PayPal seguirá desactivado (la web ya lo indica con un aviso) hasta que las añadas.

### 1.4 Los descuentos no se cobraban (incoherencia grave)
El checkout mostraba cupones y puntos de fidelidad descontados del total… pero:
- **Stripe** construía la sesión solo con precios de BD + envío: el cliente veía "Total 89 €" y **se le cobraban 99 €**.
- **PayPal** hacía lo contrario: confiaba ciegamente en `amount` y en los precios que enviaba el navegador — cualquiera podía manipular la petición y **pagar 1 € por unas zapatillas de 180 €**.

Solución aplicada — nueva librería compartida **`src/lib/orderPricing.ts`**:
- Recalcula todo en servidor: precios desde la tabla `products`, envío (gratis ≥ 50 €), cupón validado contra la tabla `coupons` y puntos de fidelidad recalculados desde los pedidos reales del usuario.
- `/api/checkout` (Stripe) aplica el descuento como cupón Stripe de un solo uso: lo cobrado coincide exactamente con lo mostrado.
- `/api/paypal/create-order` usa el mismo cálculo con `breakdown.discount`.
- Ambas rutas sincronizan `subtotal/shipping/total` validados en la fila de `orders`.
- El cliente (`checkout/page.tsx`) ahora envía `couponCode` y `useLoyalty` en lugar de importes, con refs para evitar closures obsoletos en los callbacks de PayPal.

### 1.5 Otros arreglos menores
- **Footer** — los iconos de Instagram/Twitter apuntaban a `href="#"` (callejón sin salida). Ahora enlazan a perfiles reales con `target="_blank"`, `rel="noopener"` y `aria-label`.
- **`productos/[id]/page.tsx`** — las "fotos de la comunidad" leían la columna `author_name`, pero los comentarios se guardan con `user_name`: el autor jamás se habría mostrado. Unificado a `user_name`.

---

## 2. La base de datos estaba incompleta → `supabase/schema-extra.sql` (nuevo)

Es la mayor incoherencia del proyecto: **el código usa ~22 tablas pero `schema.sql` solo crea 5**. Siguiendo el README, la mitad de la tienda fallaría en silencio (los `catch` vacíos lo ocultan). Faltaban:

- La columna **`profiles.role`** — de la que depende TODO el panel `/admin` y el AuthContext.
- **Checkout de invitados** — el código inserta pedidos con `user_id: null`, pero la columna era `NOT NULL` y las políticas RLS lo impedían.
- Tablas: `cart_items`, `coupons`, `favorites`, `reviews`, `product_comments`, `product_color_variants`, `product_sizes`, `returns`, `notifications`, `newsletter_subscribers`, `newsletter_campaigns`, `price_alerts`, `stock_alerts`, `contact_messages`, `ab_experiments`, `ab_assignments`.
- El RPC **`increment_coupon_uses`** que llama el checkout.
- Los **triggers de stock** (`fn_decrement_product_stock`, restaurar al cancelar) que el código menciona en comentarios como si existieran.
- El **bucket de Storage `product-images`** que usa `ImageUploader`.
- `handle_new_user` no guardaba `last_name` aunque el registro lo envía.

Todo eso está ahora en `supabase/schema-extra.sql`, idempotente, con RLS e índices, más un cupón de prueba `BIENVENIDA10` (10 %, compra mínima 30 €). **Ejecútalo en Supabase > SQL Editor después de schema.sql.**

---

## 3. Incoherencias detectadas — ✅ TODAS APLICADAS (21/07/2026)

> Los puntos 1-8 se aplicaron tal cual. Detalle de cómo quedó cada uno al final de la lista.

1. **Tres chatbots de IA distintos.** `/api/ai/chat` es el que usa la web (lee productos reales de BD ✓). `/api/chat` y `/api/ai-assistant` no los usa nadie, y `/api/chat` además contradice la tienda: dice "envío gratis +80 €" (la web dice +50 €) y tiene un catálogo inventado (On Cloudmonster, Salomon…). *Propuesta: borrar los dos endpoints sin uso.*
2. **Newsletter inalcanzable.** Existe el componente `Newsletter.tsx` y un panel admin completo de campañas, pero el formulario no está montado en ninguna página: nadie puede suscribirse jamás. *Propuesta: añadir `<Newsletter />` al Footer o a la home.*
3. **Notificaciones que nadie ve.** El admin puede enviar notificaciones a usuarios, pero `NotificationBell` no está montado en el MainNav: los usuarios no tienen forma de verlas. *Propuesta: montar la campana en MainNav.*
4. **Puntos de fidelidad infinitos.** Los puntos se calculan sumando pedidos pagados, pero canjearlos no los consume: el mismo descuento se puede aplicar en cada compra (y además crece). *Propuesta: tabla `loyalty_redemptions` o columna `loyalty_discount` en `orders` para descontar puntos ya gastados.*
5. **Componentes huérfanos** (0 usos): `ChatWidget`, `CheckoutDrawer`, `CustomCursor`, `ImageCarousel`, `QuickView`, `ReviewGallery`, `ProductComments`*, `Hero`, `NavBar` (versión antigua, la web usa `MainNav`) y `context/AuthContext_old_backup.tsx`. *(`ProductComments` es curioso: la ficha de producto lee sus fotos "de comunidad" pero el formulario para crearlas no está montado.)* *Propuesta: borrarlos o montarlos.*
6. **Archivos basura en la raíz**: `simple-store.zip`, `simple-store (2).zip`, `src.zip`, `tsconfig.tsbuildinfo`. Y la carpeta **`my-project/`** es un proyecto Plasmic independiente (otra tienda distinta, en inglés, con su propio package.json) mezclado dentro de este. *Propuesta: sacarla a su propia carpeta o borrarla.*
7. **README desactualizado**: habla de 15 páginas y solo Stripe; en realidad hay 30+ páginas, PayPal, asistente IA, comparador, A/B testing y un panel admin de 9 secciones. El usuario demo `demo@sneakerspro.com` no existe en ningún seed.
8. **Emails simulados**: webhook de Stripe y captura de PayPal solo hacen `console.log` del email de confirmación. *Propuesta: integrar Resend (gratis hasta 3.000/mes) — es ~30 líneas.*
9. **Producción multi-instancia**: el rate-limit es en memoria (se resetea por instancia en Vercel) y `validateOrigin` acepta peticiones sin cabecera Origin. Correcto para empezar; con tráfico real, Upstash Redis + verificación de sesión.
10. **Reseñas**: la política RLS actual permite a cualquiera actualizar `helpful_count` (así lo hace el código cliente). Con crecimiento, moverlo a un RPC `increment_helpful(review_id)`.

---

## 4. Cómo se aplicó cada propuesta

1. **Endpoints IA duplicados** → `/api/chat` y `/api/ai-assistant` movidos a `_deprecated/` (la eliminación directa fue rechazada, así que se apartaron; borra la carpeta cuando quieras). Queda solo `/api/ai/chat`.
2. **Newsletter** → montado dentro del `Footer`, visible en toda la web. Las suscripciones llegan al panel `/admin/newsletter`.
3. **NotificationBell** → montado en `MainNav` (junto al menú de usuario), con estilo adaptado al nav y modo oscuro.
4. **Puntos de fidelidad** → nueva columna `orders.loyalty_discount` (en `schema-extra.sql`). El servidor descuenta los puntos ya canjeados (pedidos no cancelados) tanto en Stripe como en PayPal, y el hook `useLoyaltyPoints` muestra el saldo real. Ya no hay descuento infinito.
5. **Componentes huérfanos** → movidos a `_deprecated/components/` (ChatWidget, CheckoutDrawer, CustomCursor, ImageCarousel, QuickView, ReviewGallery, Hero, NavBar antiguo) junto con `AuthContext_old_backup.tsx`. **`ProductComments` se montó** en la ficha de producto (bajo las reseñas): ahora las "fotos de la comunidad" tienen origen.
6. **Archivos basura** → zips y `tsconfig.tsbuildinfo` movidos a `_deprecated/`. `my-project/` se dejó intacto (es un proyecto completo; muévelo tú fuera de la carpeta si quieres conservarlo).
7. **README** → reescrito reflejando el proyecto real (30+ páginas, PayPal, IA, admin, ambos SQL, cupón de prueba, Playwright).
8. **Emails** → nuevo `src/lib/email.ts` con Resend (API HTTP, sin SDK). Webhook de Stripe y captura de PayPal envían email real si configuras `RESEND_API_KEY`; si no, siguen simulando por consola. Variables añadidas a `.env.example`.
9. **Rate-limit/origen** → sin cambios (adecuado para una instancia; anotado para producción).
10. **helpful_count** → nuevo RPC `increment_helpful` en `schema-extra.sql` (se eliminó la política que permitía UPDATE libre) y `ReviewSection` lo usa.

Verificación final: `tsc --noEmit` limpio y `next build` genera las 44 páginas sin errores.

## 5. Qué tienes que hacer tú

1. `npm install` (para registrar `@anthropic-ai/sdk` en el lockfile).
2. Ejecutar `supabase/schema-extra.sql` en el SQL Editor de Supabase (obligatorio: incluye ahora `loyalty_discount` e `increment_helpful`).
3. (Opcional) `NEXT_PUBLIC_PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_MODE` en `.env.local` para activar PayPal.
4. (Opcional) `RESEND_API_KEY` y `EMAIL_FROM` para emails de confirmación reales.
5. Cuando lo tengas claro, borra `_deprecated/` (o recupera de ahí lo que quieras conservar).
