# 🛍️ SNEAKERS PRO - E-COMMERCE COMPLETO

**Tienda online 100% funcional con Next.js, Supabase, Stripe y TypeScript**

[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Tailwind](https://img.shields.io/badge/Tailwind-3-38bdf8)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ecf8e)](https://supabase.com/)
[![Stripe](https://img.shields.io/badge/Stripe-Payments-008cdd)](https://stripe.com/)

---

## ⚡ INSTALACIÓN RÁPIDA (3 pasos)

```bash
npm install                # 1. Instalar dependencias
cp .env.example .env.local # 2. Copiar variables de entorno
npm run dev                # 3. Ejecutar
```

**Abre**: http://localhost:3000

**Usuario demo**: `demo@sneakerspro.com` / `demo123`

📖 **Setup completo**: Ver la sección [⚙️ Configuración](#️-configuración) más abajo

---

## ✨ FUNCIONALIDADES

### ✅ Implementadas y Funcionando

- 🔐 **Autenticación** - Registro, login, sesiones
- 🛍️ **Catálogo** - 17 productos en 6 categorías
- 🔍 **Filtros** - Por categoría, marca, precio
- 📦 **Detalle** - Galería, tallas, colores
- 🛒 **Carrito** - Cálculo de IVA y envío
- 💳 **Stripe** - Pagos reales integrados
- 🗄️ **Supabase** - Base de datos PostgreSQL
- 📱 **Responsive** - Mobile, tablet, desktop
- 📄 **15+ páginas** - Todas funcionando

---

## 🗂️ PÁGINAS

| Página | Ruta | Estado |
|--------|------|--------|
| Inicio | `/` | ✅ |
| Productos | `/productos` | ✅ |
| Detalle | `/productos/[id]` | ✅ |
| Carrito | `/carrito` | ✅ |
| Checkout | `/checkout` | ✅ |
| Éxito | `/checkout/success` | ✅ |
| Login | `/auth/login` | ✅ |
| Registro | `/auth/register` | ✅ |
| Perfil | `/cuenta` | ✅ |
| Pedidos | `/cuenta/pedidos` | ✅ |
| Contacto | `/contacto` | ✅ |
| Legal | `/legal/*` | ✅ |

---

## 🛠️ STACK TECNOLÓGICO

```
Frontend:  Next.js 15 + TypeScript + Tailwind CSS
Backend:   Next.js API Routes
Base de Datos:  Supabase (PostgreSQL)
Autenticación:  Supabase Auth
Pagos:     Stripe
Estado:    React Context API
Hosting:   Vercel (recomendado)
```

---

## 📦 ESTRUCTURA

```
src/
├── app/                # Páginas (15+)
├── components/         # UI Components (10+)
├── context/            # Auth + Cart
├── data/               # 17 productos, 6 categorías
├── lib/                # Supabase client
└── types/              # TypeScript types

supabase/
├── schema.sql          # Schema completo
└── seed-products.sql   # Datos
```

---

## ⚙️ CONFIGURACIÓN

### 1. Supabase (Base de Datos)

```bash
# 1. Crear proyecto en https://supabase.com
# 2. Ejecutar supabase/schema.sql en SQL Editor
# 3. Ejecutar supabase/seed-products.sql
# 4. Obtener credenciales
```

### 2. Stripe (Pagos)

```bash
# 1. Crear cuenta en https://stripe.com
# 2. Obtener API keys (modo test)
# 3. Configurar webhook /api/webhook
```

### 3. Variables de Entorno

Edita `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 🧪 TESTING

**Tarjeta de prueba Stripe:**
- Número: `4242 4242 4242 4242`
- Fecha: Cualquier futura
- CVC: Cualquier 3 dígitos

**Usuario demo:**
- Email: `demo@sneakerspro.com`
- Password: `demo123`

---

## 🚀 DESPLIEGUE

### Vercel (Gratis)

```bash
# 1. Push a GitHub
git add . && git commit -m "Deploy" && git push

# 2. Importa en https://vercel.com
# 3. Configura variables de entorno
# 4. ¡Listo!
```

---

## 📚 DOCUMENTACIÓN

- `README.md` - Guía completa (este archivo)
- `supabase/schema.sql` - Esquema de la base de datos
- `supabase/seed-products.sql` - Datos de ejemplo

---

## 🎨 PERSONALIZACIÓN

**Colores**: `tailwind.config.js`
**Productos**: `src/data/products.ts`
**NavBar**: `src/components/MainNav.tsx`

---

## ✅ CHECKLIST

Antes de lanzar:

- [ ] Supabase configurado
- [ ] Stripe en modo producción
- [ ] Variables en Vercel
- [ ] Webhook actualizado
- [ ] Prueba de compra
- [ ] Dominio configurado

---

## 📈 PROYECTO EN NÚMEROS

- 15+ páginas funcionales
- 10+ componentes reutilizables
- 17 productos de ejemplo
- 6 categorías organizadas
- ~5,000 líneas de código
- 100% TypeScript
- 100% responsive

---

## 🎯 LO QUE PUEDES HACER YA

✅ Registrar usuarios
✅ Navegar productos
✅ Filtrar y ordenar
✅ Añadir al carrito
✅ Procesar pagos (Stripe)
✅ Ver historial
✅ Gestionar perfil

---

## 🆘 PROBLEMAS COMUNES

**Error: Module not found**
```bash
rm -rf node_modules && npm install
```

**Webhook no funciona**
```bash
stripe listen --forward-to localhost:3000/api/webhook
```

**Más ayuda**: Revisa la sección [⚙️ Configuración](#️-configuración)

---

## 🎉 ¡LISTO PARA VENDER!

Tu tienda tiene:
- ✅ Pagos reales con Stripe
- ✅ Base de datos persistente
- ✅ Autenticación segura
- ✅ UI profesional

**Próximo paso**: Configura Supabase y Stripe (sección [⚙️ Configuración](#️-configuración))

---

Hecho con ❤️ para emprendedores
