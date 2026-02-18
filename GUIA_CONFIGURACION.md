# 🚀 GUÍA COMPLETA DE CONFIGURACIÓN

## SNEAKERS PRO - Setup Completo con Supabase + Stripe

---

## 📋 ÍNDICE

1. [Instalación Inicial](#1-instalación-inicial)
2. [Configurar Supabase](#2-configurar-supabase)
3. [Configurar Stripe](#3-configurar-stripe)
4. [Variables de Entorno](#4-variables-de-entorno)
5. [Probar Todo](#5-probar-todo)
6. [Desplegar a Producción](#6-desplegar-a-producción)

---

## 1️⃣ INSTALACIÓN INICIAL

### Paso 1.1: Instalar Dependencias

```bash
cd simple-store
npm install
```

Esto instalará:
- `@supabase/supabase-js` - Cliente de Supabase
- `@stripe/stripe-js` - Cliente de Stripe
- `stripe` - SDK de Stripe para el servidor
- Next.js, React, Tailwind CSS

### Paso 1.2: Verificar Instalación

```bash
npm run dev
```

Abre http://localhost:3000 - Debería cargar (sin base de datos aún)

---

## 2️⃣ CONFIGURAR SUPABASE

### Paso 2.1: Crear Cuenta en Supabase

1. Ve a https://supabase.com
2. Clic en "Start your project"
3. Regístrate con GitHub o email
4. Crea una nueva organización (gratis)

### Paso 2.2: Crear Proyecto

1. Clic en "New Project"
2. Rellena:
   - **Name**: `sneakers-pro` (o el que quieras)
   - **Database Password**: Genera una segura y guárdala
   - **Region**: Europe (West) - más cerca de España
   - **Pricing Plan**: Free (suficiente para empezar)
3. Clic en "Create new project"
4. **Espera 2-3 minutos** mientras se crea

### Paso 2.3: Obtener Credenciales

Una vez creado el proyecto:

1. Ve a **Settings** (⚙️ icono abajo a la izquierda)
2. Clic en **API**
3. Copia:
   - **Project URL**: `https://xxx.supabase.co`
   - **anon/public key**: `eyJhbGc...` (clave larga)

### Paso 2.4: Crear Base de Datos

1. En Supabase, ve a **SQL Editor** (icono `</>` en el sidebar)
2. Clic en **New Query**
3. Copia TODO el contenido de `supabase/schema.sql`
4. Pégalo en el editor
5. Clic en **Run** (o Cmd/Ctrl + Enter)
6. Deberías ver: "Success. No rows returned"

### Paso 2.5: Poblar con Productos

1. En el mismo **SQL Editor**, crea **New Query**
2. Copia TODO el contenido de `supabase/seed-products.sql`
3. Pégalo y clic en **Run**
4. Deberías ver: "Success. 17 rows affected"

### Paso 2.6: Verificar Datos

1. Ve a **Table Editor** (icono de tabla en sidebar)
2. Selecciona tabla `products`
3. Deberías ver 17 productos

✅ **Supabase configurado!**

---

## 3️⃣ CONFIGURAR STRIPE

### Paso 3.1: Crear Cuenta en Stripe

1. Ve a https://dashboard.stripe.com/register
2. Regístrate con email
3. Completa el proceso de verificación
4. **Activa el modo Test** (toggle arriba a la derecha - debe decir "Test mode")

### Paso 3.2: Obtener API Keys

1. En el Dashboard, ve a **Developers** > **API keys**
2. Copia:
   - **Publishable key**: `pk_test_...`
   - **Secret key**: `sk_test_...` (clic en "Reveal test key")

### Paso 3.3: Configurar Webhook

**¿Qué es un webhook?** Stripe te notifica cuando un pago se completa.

1. Ve a **Developers** > **Webhooks**
2. Clic en **Add endpoint**
3. **Endpoint URL**: 
   - En desarrollo local: `http://localhost:3000/api/webhook`
   - En producción: `https://tudominio.com/api/webhook`
4. **Events to send**:
   - Clic en "Select events"
   - Busca y selecciona:
     - `checkout.session.completed`
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
5. Clic en **Add endpoint**
6. Copia el **Signing secret** (empieza con `whsec_...`)

### Paso 3.4: Probar con Tarjetas de Test

Stripe proporciona tarjetas de prueba:

**✅ Pago exitoso:**
- Número: `4242 4242 4242 4242`
- Fecha: Cualquier futura
- CVC: Cualquier 3 dígitos
- Código postal: Cualquiera

**❌ Pago rechazado:**
- Número: `4000 0000 0000 0002`

✅ **Stripe configurado!**

---

## 4️⃣ VARIABLES DE ENTORNO

### Paso 4.1: Crear archivo .env.local

En la raíz del proyecto (donde está `package.json`):

```bash
cp .env.example .env.local
```

O créalo manualmente:

```bash
touch .env.local
```

### Paso 4.2: Rellenar Variables

Abre `.env.local` y pega:

```env
# SUPABASE (copiar de Supabase Dashboard > Settings > API)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...tu-clave-aqui

# STRIPE (copiar de Stripe Dashboard > Developers > API keys)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# STRIPE WEBHOOK (copiar de Stripe Dashboard > Developers > Webhooks)
STRIPE_WEBHOOK_SECRET=whsec_...

# URL DE LA APP
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**⚠️ IMPORTANTE:** 
- NO subas `.env.local` a Git (ya está en `.gitignore`)
- En producción, usa las keys de producción (no test)

### Paso 4.3: Reiniciar Servidor

```bash
# Detén el servidor (Ctrl+C)
# Inicia de nuevo
npm run dev
```

✅ **Variables configuradas!**

---

## 5️⃣ PROBAR TODO

### Test 1: Registrar Usuario

1. Ve a http://localhost:3000
2. Clic en "Iniciar Sesión"
3. Clic en "Regístrate gratis"
4. Completa el formulario
5. ✅ Deberías ver la página principal logueado

**Verificar en Supabase:**
- Ve a **Authentication** en Supabase
- Deberías ver tu usuario
- Ve a **Table Editor** > **profiles**
- Deberías ver tu perfil

### Test 2: Añadir al Carrito

1. En la página principal, clic en "Añadir al Carrito" en un producto
2. ✅ Debería aparecer alerta "Producto añadido"
3. Mira el icono del carrito (arriba derecha)
4. ✅ Debería mostrar "1"
5. Clic en el icono del carrito
6. ✅ Deberías ver tu producto con cálculos (subtotal, IVA, total)

### Test 3: Proceso de Checkout con Stripe

1. En el carrito, clic en "Proceder al Pago"
2. Completa el formulario de envío
3. Clic en "Pagar €XXX"
4. ✅ Deberías ser redirigido a Stripe Checkout
5. Usa la tarjeta de test: `4242 4242 4242 4242`
6. Completa el pago
7. ✅ Deberías ver página de "Pago Completado"
8. ✅ El carrito debería estar vacío

**Verificar en Supabase:**
- Ve a **Table Editor** > **orders**
- Deberías ver tu pedido
- Ve a **order_items**
- Deberías ver los items del pedido

**Verificar en Stripe:**
- Ve a **Payments** en Stripe Dashboard
- Deberías ver tu pago

### Test 4: Ver Pedidos

1. Ve a "Mi Cuenta" > "Mis Pedidos"
2. ✅ Deberías ver tu pedido (cuando conectes Supabase al frontend)

---

## 6️⃣ DESPLEGAR A PRODUCCIÓN

### Opción A: Vercel (Recomendado - Gratis)

#### Paso 6.1: Subir a GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/sneakers-pro.git
git push -u origin main
```

#### Paso 6.2: Conectar con Vercel

1. Ve a https://vercel.com
2. Regístrate con GitHub
3. Clic en "Add New Project"
4. Importa tu repositorio `sneakers-pro`
5. Clic en "Deploy"

#### Paso 6.3: Configurar Variables de Entorno en Vercel

1. En Vercel, ve a tu proyecto > **Settings** > **Environment Variables**
2. Añade TODAS las variables de `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `NEXT_PUBLIC_APP_URL` = `https://tu-app.vercel.app`
3. Clic en "Save"
4. Redeploy: **Deployments** > tres puntos > **Redeploy**

#### Paso 6.4: Actualizar Webhook de Stripe

1. En Stripe Dashboard > **Webhooks**
2. Añade nuevo endpoint:
   - **URL**: `https://tu-app.vercel.app/api/webhook`
   - **Events**: Los mismos que antes
3. Actualiza `STRIPE_WEBHOOK_SECRET` en Vercel con el nuevo secret

✅ **¡App en producción!**

---

## 🎯 RESUMEN DE CREDENCIALES

Deberías tener:

✅ **Supabase:**
- Project URL
- Anon key

✅ **Stripe:**
- Publishable key (pk_test_...)
- Secret key (sk_test_...)
- Webhook secret (whsec_...)

✅ **Configuración:**
- `.env.local` con todas las variables
- Supabase con tablas creadas
- Productos insertados
- Webhook de Stripe configurado

---

## 🆘 SOLUCIÓN DE PROBLEMAS

### Error: "Supabase client not configured"

**Causa:** Variables de entorno no cargadas

**Solución:**
```bash
# Verifica que .env.local existe
cat .env.local

# Reinicia el servidor
npm run dev
```

### Error: "Stripe publishable key not found"

**Causa:** Variables de Stripe no configuradas

**Solución:**
- Verifica que las keys empiezan con `pk_test_` y `sk_test_`
- Asegúrate de estar en modo "Test" en Stripe
- Reinicia servidor

### Webhook no recibe eventos

**Causa:** Stripe no puede alcanzar localhost

**Solución en desarrollo:**
```bash
# Instala Stripe CLI
brew install stripe/stripe-brew/stripe  # Mac
# o descarga de https://stripe.com/docs/stripe-cli

# Login
stripe login

# Forward events a localhost
stripe listen --forward-to localhost:3000/api/webhook
```

### Error al insertar productos

**Causa:** Schema no ejecutado correctamente

**Solución:**
1. Ve a Table Editor en Supabase
2. Verifica que existan las tablas
3. Si no, ejecuta `schema.sql` de nuevo

---

## 📚 RECURSOS ÚTILES

- **Supabase Docs**: https://supabase.com/docs
- **Stripe Docs**: https://stripe.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Testing Stripe**: https://stripe.com/docs/testing

---

## ✅ CHECKLIST FINAL

Antes de lanzar a producción:

- [ ] Supabase configurado con todas las tablas
- [ ] Productos insertados en Supabase
- [ ] Stripe en modo Test funcionando
- [ ] Webhook de Stripe configurado
- [ ] Variables de entorno configuradas
- [ ] App desplegada en Vercel
- [ ] Webhook de producción actualizado
- [ ] Cambiar Stripe a modo Live
- [ ] Probar compra en producción
- [ ] Configurar dominio personalizado (opcional)

---

**🎉 ¡Felicidades! Tu tienda e-commerce está lista para vender.**

¿Dudas? Revisa la documentación o contáctame.
