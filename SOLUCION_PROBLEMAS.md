# 🔧 SOLUCIÓN DE LOS 4 PROBLEMAS PRINCIPALES

## PROBLEMAS REPORTADOS Y SOLUCIONES

---

## 1️⃣ PROBLEMA: Stripe Webhook con Localhost

### ❌ Error
```
Stripe no acepta http://localhost:3000 en webhooks de producción
```

### ✅ SOLUCIÓN A: Usar Stripe CLI (Recomendado para desarrollo)

#### Paso 1: Instalar Stripe CLI

**MacOS:**
```bash
brew install stripe/stripe-brew/stripe
```

**Windows:**
Descarga de: https://github.com/stripe/stripe-cli/releases/latest

**Linux:**
```bash
wget https://github.com/stripe/stripe-cli/releases/download/v1.19.4/stripe_1.19.4_linux_x86_64.tar.gz
tar -xvf stripe_1.19.4_linux_x86_64.tar.gz
sudo mv stripe /usr/local/bin
```

#### Paso 2: Autenticar

```bash
stripe login
```

Se abrirá tu navegador para autorizar.

#### Paso 3: Forward Events a Localhost

```bash
stripe listen --forward-to localhost:3000/api/webhook
```

Verás algo como:
```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxx
```

#### Paso 4: Copiar el Secret

Copia el `whsec_xxxxxxxxxxxxx` y pégalo en `.env.local`:

```env
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

#### Paso 5: Mantener Abierto

Deja esta terminal abierta mientras desarrollas. Los eventos de Stripe se reenviarán automáticamente.

---

### ✅ SOLUCIÓN B: Sin Webhook (Alternativa Simple)

Si no quieres usar Stripe CLI, puedes guardar los pedidos directamente desde el cliente.

#### Modificar Checkout

En `src/app/checkout/page.tsx`, después de que Stripe confirme el pago:

```typescript
// Después del pago exitoso en Stripe
const handleSuccess = async (sessionId: string) => {
  // Guardar pedido directamente en Supabase
  const { data: order } = await supabase
    .from('orders')
    .insert({
      user_id: user.id,
      status: 'processing',
      subtotal,
      shipping,
      tax,
      total,
      payment_method: 'card',
      payment_intent_id: sessionId,
      shipping_address: shippingInfo,
    })
    .select()
    .single();

  if (order) {
    // Guardar items
    const orderItems = items.map(item => ({
      order_id: order.id,
      product_id: item.product.id,
      quantity: item.quantity,
      price: item.product.price,
      selected_size: item.selectedSize,
      selected_color: item.selectedColor,
    }));

    await supabase.from('order_items').insert(orderItems);
  }
};
```

---

## 2️⃣ PROBLEMA: Usuario No Aparece en Supabase

### ❌ Error
```
Registro exitoso pero usuario no aparece en Supabase Authentication
```

### ✅ SOLUCIÓN

#### Paso 1: Verificar Email Confirmation

Por defecto, Supabase requiere confirmación de email.

**Opción A: Desactivar en desarrollo**

1. Ve a Supabase Dashboard
2. **Authentication** > **Settings**
3. Desactiva "Enable email confirmations"
4. Guarda cambios

**Opción B: Verificar email**

Cuando te registres, revisa tu bandeja de entrada. Supabase envía un email de confirmación.

#### Paso 2: Verificar Trigger

Asegúrate que ejecutaste `supabase/schema.sql` completo. Debe incluir:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Usuario')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

#### Paso 3: Actualizar AuthContext

El AuthContext debe usar Supabase Auth, no localStorage.

**Verifica en `src/context/AuthContext.tsx`:**

```typescript
import { supabase } from '@/lib/supabase';

// En register:
const { data: authData, error } = await supabase.auth.signUp({
  email: data.email,
  password: data.password,
  options: {
    data: {
      name: data.name,
      last_name: data.lastName,
    }
  }
});
```

#### Paso 4: Verificar en Dashboard

1. Ve a **Authentication** en Supabase
2. Deberías ver usuarios en la pestaña "Users"
3. Ve a **Table Editor** > **profiles**
4. Verifica que el perfil se creó

#### Paso 5: Debug

Si aún no funciona, revisa la consola del navegador:

```javascript
// Añade esto temporalmente en AuthContext
console.log('Auth result:', authData);
console.log('Auth error:', error);
```

---

## 3️⃣ PROBLEMA: Imágenes No Aparecen

### ❌ Error
```
Imágenes de productos no se cargan o muestran placeholder
```

### ✅ SOLUCIÓN A: Configurar Next.js

#### Paso 1: Verificar next.config.js

Debe tener:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
    ],
  },
};

module.exports = nextConfig;
```

#### Paso 2: Reiniciar Servidor

```bash
# Detén el servidor (Ctrl+C)
npm run dev
```

### ✅ SOLUCIÓN B: Usar <img> en lugar de next/image

Si sigues teniendo problemas, usa `<img>` normal:

En `ProductCard.tsx`:

```jsx
<img
  src={product.images?.[0] || 'https://via.placeholder.com/400x400?text=Sin+Imagen'}
  alt={product.name}
  className="w-full h-full object-cover"
  onError={(e) => {
    e.currentTarget.src = 'https://via.placeholder.com/400x400?text=Error';
  }}
/>
```

### ✅ SOLUCIÓN C: Verificar URLs de Unsplash

Si las imágenes de Unsplash no cargan, verifica que las URLs sean correctas.

**URLs correctas de Unsplash:**
```
✅ https://images.unsplash.com/photo-XXXXX?w=800&h=800&fit=crop
❌ unsplash.com/photo/XXXXX (sin https://images)
```

### ✅ SOLUCIÓN D: Usar Imágenes Locales

Para productos propios:

1. Crea carpeta `public/images/productos/`
2. Guarda imágenes ahí
3. Usa rutas relativas:

```typescript
images: ['/images/productos/nike-air-max.jpg']
```

---

## 4️⃣ PROBLEMA: Páginas Que Faltan

### ❌ Error
```
Algunas páginas mencionadas no existen o dan 404
```

### ✅ LISTA COMPLETA DE PÁGINAS

#### Páginas Implementadas ✅

- `/` - Inicio
- `/auth/login` - Login
- `/auth/register` - Registro
- `/productos` - Listado con filtros
- `/productos/[id]` - Detalle de producto
- `/carrito` - Carrito de compra
- `/checkout` - Proceso de pago
- `/checkout/success` - Pago exitoso
- `/cuenta` - Perfil de usuario
- `/cuenta/pedidos` - Historial
- `/contacto` - Formulario de contacto
- `/legal/privacidad` - Política de privacidad
- `/legal/terminos` - Términos y condiciones
- `/legal/envios` - Información de envíos

#### Páginas Que Puedes Crear ⚠️

**1. Direcciones del Usuario**
```bash
mkdir -p src/app/cuenta/direcciones
# Crear page.tsx para gestionar direcciones
```

**2. Favoritos/Wishlist**
```bash
mkdir -p src/app/cuenta/favoritos
# Crear page.tsx con productos guardados
```

**3. Política de Cookies**
```bash
mkdir -p src/app/legal/cookies
# Crear page.tsx con política de cookies
```

**4. Devoluciones**
```bash
mkdir -p src/app/legal/devoluciones
# Crear page.tsx con política de devoluciones
```

### ✅ CREAR PÁGINA FALTANTE (Ejemplo: Devoluciones)

```bash
mkdir -p src/app/legal/devoluciones
```

Crear `src/app/legal/devoluciones/page.tsx`:

```typescript
import { LegalPageLayout } from '@/components/LegalPageLayout';

export default function DevolucionesPage() {
  return (
    <LegalPageLayout title="Política de Devoluciones" lastUpdated="13 de febrero de 2026">
      <h2>Condiciones de Devolución</h2>
      <p>Tienes 30 días desde la recepción del pedido para solicitar una devolución.</p>
      
      <h2>Proceso de Devolución</h2>
      <ol>
        <li>Contacta con nosotros en devoluciones@sneakerspro.com</li>
        <li>Envía el producto en su embalaje original</li>
        <li>Reembolso en 7-14 días laborables</li>
      </ol>

      <h2>Productos No Elegibles</h2>
      <ul>
        <li>Productos usados o dañados</li>
        <li>Productos personalizados</li>
        <li>Artículos en oferta final</li>
      </ul>

      <h2>Costes de Envío</h2>
      <p>Los gastos de envío de devolución corren a cargo del cliente, excepto en caso de producto defectuoso o error en el envío.</p>
    </LegalPageLayout>
  );
}
```

---

## 🎯 CHECKLIST DE VERIFICACIÓN

Después de aplicar las soluciones, verifica:

### Stripe
- [ ] Stripe CLI instalado y corriendo
- [ ] O webhook configurado con dominio real
- [ ] Variable `STRIPE_WEBHOOK_SECRET` en `.env.local`
- [ ] Probado pago con tarjeta `4242 4242 4242 4242`

### Supabase Auth
- [ ] Email confirmations desactivado (desarrollo)
- [ ] Trigger `handle_new_user` ejecutado
- [ ] AuthContext usa `supabase.auth.signUp`
- [ ] Usuario aparece en Authentication > Users
- [ ] Perfil creado en tabla `profiles`

### Imágenes
- [ ] `remotePatterns` configurado en `next.config.js`
- [ ] Servidor reiniciado después de cambiar config
- [ ] URLs de Unsplash correctas (https://images.unsplash.com)
- [ ] Manejo de error con placeholder

### Páginas
- [ ] Todas las páginas mencionadas existen
- [ ] No hay errores 404
- [ ] Navigation funciona correctamente

---

## 🚀 COMANDOS RÁPIDOS

### Reiniciar Todo
```bash
# Limpiar y reinstalar
rm -rf node_modules .next
npm install
npm run dev
```

### Verificar Supabase
```bash
# En consola del navegador
supabase.auth.getSession().then(console.log)
```

### Verificar Variables
```bash
# Ver variables cargadas
cat .env.local
```

### Stripe CLI Debug
```bash
# Ver eventos en tiempo real
stripe listen --forward-to localhost:3000/api/webhook
```

---

## 📞 SOPORTE ADICIONAL

Si los problemas persisten:

1. **Revisa la consola del navegador** (F12 > Console)
2. **Revisa la terminal** donde corre `npm run dev`
3. **Verifica variables** en `.env.local`
4. **Comprueba Supabase Dashboard** para errores de BD

---

## 💡 MEJORAS RECOMENDADAS

### 1. Email Templates Personalizados

En Supabase > Authentication > Email Templates:
- Personaliza el email de confirmación
- Añade tu logo y colores

### 2. Modo Offline

Añade service worker para funcionar sin conexión:

```bash
npm install next-pwa
```

### 3. Analytics

Añade Google Analytics o Plausible:

```bash
npm install @vercel/analytics
```

### 4. Optimización de Imágenes

Usa Next.js Image para mejor performance:

```bash
# Ya incluido en Next.js 15
```

---

## ✅ RESUMEN

| Problema | Solución Principal | Tiempo |
|----------|-------------------|---------|
| Webhook Stripe | Usar Stripe CLI | 5 min |
| Usuario Supabase | Desactivar email confirmation | 2 min |
| Imágenes | Configurar remotePatterns | 3 min |
| Páginas faltantes | Crear manualmente | Variable |

**Tiempo total estimado de fixes**: 10-30 minutos

---

¡Con estas soluciones tu tienda debería funcionar perfectamente! 🚀
