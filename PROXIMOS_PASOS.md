# 🚀 Próximos Pasos: De Básico a Avanzado

## Roadmap Completo

```
✅ PASO 1: Entender la estructura ← ESTÁS AQUÍ
↓
📄 PASO 2: Crear nuevas páginas
↓
🔗 PASO 3: Añadir navegación entre páginas
↓
🛒 PASO 4: Crear carrito de compra
↓
💳 PASO 5: Integrar pasarela de pago (Stripe)
↓
🎨 PASO 6: Personalizar diseño
↓
🚀 PASO 7: Desplegar online
```

---

## 📄 PASO 2: Crear Nuevas Páginas

### Cómo funciona el routing en Next.js

```
src/app/
├── page.tsx              → localhost:3000/
├── productos/
│   └── page.tsx          → localhost:3000/productos
├── contacto/
│   └── page.tsx          → localhost:3000/contacto
└── about/
    └── page.tsx          → localhost:3000/about
```

**Cada carpeta = 1 ruta**
**Cada page.tsx = contenido de esa ruta**

### Ejemplo 1: Crear página de Productos

**Paso 1:** Crea la carpeta y archivo
```bash
mkdir -p src/app/productos
touch src/app/productos/page.tsx
```

**Paso 2:** Añade el contenido
```tsx
// src/app/productos/page.tsx
import { NavBar } from '@/components/NavBar';
import { Footer } from '@/components/Footer';

export default function ProductosPage() {
  return (
    <div>
      <NavBar siteName="Sneakers Pro" links={[...]} />
      
      <div className="max-w-7xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold mb-8">
          Todos los Productos
        </h1>
        <p>Aquí irán todos tus productos...</p>
      </div>
      
      <Footer />
    </div>
  );
}
```

**Paso 3:** Visita localhost:3000/productos

### Ejemplo 2: Crear página de Contacto

```tsx
// src/app/contacto/page.tsx
import { NavBar } from '@/components/NavBar';
import { Footer } from '@/components/Footer';
import { TextField } from '@/components/TextField';
import { Button } from '@/components/Button';

export default function ContactoPage() {
  return (
    <div>
      <NavBar siteName="Sneakers Pro" links={[...]} />
      
      <div className="max-w-2xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold mb-8">Contacto</h1>
        
        <form className="space-y-4">
          <TextField
            label="Nombre"
            placeholder="Tu nombre"
            fullWidth
          />
          <TextField
            label="Email"
            type="email"
            placeholder="tu@email.com"
            fullWidth
          />
          <textarea 
            className="w-full border rounded p-2"
            placeholder="Tu mensaje"
            rows={5}
          />
          <Button variant="primary" size="lg" fullWidth>
            Enviar Mensaje
          </Button>
        </form>
      </div>
      
      <Footer />
    </div>
  );
}
```

---

## 🔗 PASO 3: Añadir Navegación

### Opción 1: Links en NavBar

**Edita:** `src/app/page.tsx`

```tsx
<NavBar
  siteName="Sneakers Pro"
  links={[
    { label: 'Inicio', href: '/' },
    { label: 'Productos', href: '/productos' },      // ← Nuevo
    { label: 'Ofertas', href: '/ofertas' },          // ← Nuevo
    { label: 'Contacto', href: '/contacto' },        // ← Nuevo
  ]}
  ctaText="Mi Cuenta"
  ctaHref="/cuenta"
/>
```

### Opción 2: Links con Next.js Link

```tsx
import Link from 'next/link';

<Link href="/productos" className="text-blue-600 hover:underline">
  Ver todos los productos
</Link>
```

### Opción 3: Navegación programática

```tsx
'use client';
import { useRouter } from 'next/navigation';

export default function MiComponente() {
  const router = useRouter();
  
  const irAProductos = () => {
    router.push('/productos');
  };
  
  return (
    <button onClick={irAProductos}>
      Ir a Productos
    </button>
  );
}
```

---

## 🛒 PASO 4: Crear Carrito de Compra

### Arquitectura del Carrito

```
1. Estado global del carrito (Context API)
   ↓
2. Añadir/quitar productos
   ↓
3. Calcular total
   ↓
4. Persistir en localStorage
   ↓
5. Mostrar en página de carrito
```

### Paso 4.1: Crear Context para el Carrito

```tsx
// src/context/CartContext.tsx
'use client';
import React, { createContext, useContext, useState } from 'react';

type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
};

type CartContextType = {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  total: number;
  clearCart: () => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  
  const addItem = (item: CartItem) => {
    setItems(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i =>
          i.id === item.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };
  
  const removeItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };
  
  const updateQuantity = (id: string, quantity: number) => {
    setItems(prev =>
      prev.map(i => (i.id === id ? { ...i, quantity } : i))
    );
  };
  
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  
  const clearCart = () => setItems([]);
  
  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, total, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart debe usarse dentro de CartProvider');
  return context;
};
```

### Paso 4.2: Envolver la App con el Provider

```tsx
// src/app/layout.tsx
import { CartProvider } from '@/context/CartContext';

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <CartProvider>
          {children}
        </CartProvider>
      </body>
    </html>
  );
}
```

### Paso 4.3: Usar el Carrito

```tsx
'use client';
import { useCart } from '@/context/CartContext';

export default function ProductosPage() {
  const { addItem } = useCart();
  
  const handleAddToCart = (product) => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      image: product.image,
    });
    alert('Producto añadido al carrito!');
  };
  
  return (
    <ProductCard
      product={product}
      onAddToCart={() => handleAddToCart(product)}
    />
  );
}
```

### Paso 4.4: Crear Página de Carrito

```tsx
// src/app/carrito/page.tsx
'use client';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/Button';

export default function CarritoPage() {
  const { items, removeItem, updateQuantity, total } = useCart();
  
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold mb-8">Tu Carrito</h1>
      
      {items.length === 0 ? (
        <p>Tu carrito está vacío</p>
      ) : (
        <>
          {items.map(item => (
            <div key={item.id} className="flex gap-4 mb-4 p-4 border rounded">
              <img src={item.image} alt={item.name} className="w-20 h-20 object-cover" />
              <div className="flex-1">
                <h3 className="font-semibold">{item.name}</h3>
                <p>€{item.price.toFixed(2)}</p>
                <input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => updateQuantity(item.id, parseInt(e.target.value))}
                  min="1"
                  className="border rounded px-2 py-1 w-20"
                />
              </div>
              <button onClick={() => removeItem(item.id)} className="text-red-600">
                Eliminar
              </button>
            </div>
          ))}
          
          <div className="text-right mt-8">
            <p className="text-2xl font-bold">Total: €{total.toFixed(2)}</p>
            <Button variant="primary" size="lg" className="mt-4">
              Proceder al Pago
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
```

---

## 💳 PASO 5: Integrar Stripe (Pasarela de Pago)

### Paso 5.1: Instalar Stripe

```bash
npm install @stripe/stripe-js stripe
```

### Paso 5.2: Configurar Variables de Entorno

```bash
# .env.local
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_tu_clave_aqui
STRIPE_SECRET_KEY=sk_test_tu_clave_secreta_aqui
```

### Paso 5.3: Crear API Route para Checkout

```tsx
// src/app/api/checkout/route.ts
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

export async function POST(request: Request) {
  try {
    const { items } = await request.json();
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: items.map((item: any) => ({
        price_data: {
          currency: 'eur',
          product_data: {
            name: item.name,
            images: [item.image],
          },
          unit_amount: Math.round(item.price * 100), // En centavos
        },
        quantity: item.quantity,
      })),
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_URL}/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/carrito`,
    });
    
    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    return NextResponse.json({ error: 'Error creando sesión' }, { status: 500 });
  }
}
```

### Paso 5.4: Botón de Pago en el Carrito

```tsx
'use client';
import { loadStripe } from '@stripe/stripe-js';
import { useCart } from '@/context/CartContext';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function CarritoPage() {
  const { items } = useCart();
  
  const handleCheckout = async () => {
    const stripe = await stripePromise;
    
    const response = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    });
    
    const { sessionId } = await response.json();
    await stripe!.redirectToCheckout({ sessionId });
  };
  
  return (
    <button onClick={handleCheckout}>
      Proceder al Pago con Stripe
    </button>
  );
}
```

---

## 🎨 PASO 6: Personalizar Diseño

### Cambiar Colores Globales

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#3B82F6',
          dark: '#2563EB',
          light: '#60A5FA',
        },
        secondary: '#1E40AF',
        accent: '#F59E0B',
      }
    }
  }
};
```

Usa: `bg-primary`, `bg-primary-dark`, `text-primary-light`

### Crear Tema Oscuro

```tsx
// src/app/layout.tsx
<body className="bg-gray-900 text-white">  ← Modo oscuro
  {children}
</body>
```

---

## 🚀 PASO 7: Desplegar Online

### Opción 1: Vercel (Recomendado - Gratis)

1. Sube tu código a GitHub
2. Ve a https://vercel.com
3. Importa tu repositorio
4. ¡Despliega!

Automático en cada push a GitHub.

### Opción 2: Netlify

Igual que Vercel, muy fácil.

---

## 📋 Checklist de Desarrollo

```
✅ Estructura básica entendida
⬜ Crear página de productos
⬜ Crear página de contacto
⬜ Añadir navegación funcional
⬜ Implementar carrito de compra
⬜ Integrar Stripe
⬜ Añadir base de datos (opcional)
⬜ Optimizar imágenes
⬜ Hacer responsive
⬜ Testear todo
⬜ Desplegar online
```

---

## 💡 Consejos Pro

1. **Comienza simple**: No intentes hacer todo de golpe
2. **Prueba frecuentemente**: Cada cambio, refresca el navegador
3. **Git es tu amigo**: Haz commits frecuentes
4. **Usa TypeScript**: Te ayudará a evitar errores
5. **Mobile first**: Diseña primero para móvil

---

## 🆘 Recursos Útiles

- **Next.js Docs**: https://nextjs.org/docs
- **Tailwind Docs**: https://tailwindcss.com/docs
- **Stripe Docs**: https://stripe.com/docs
- **React Docs**: https://react.dev

---

**¿Por cuál de estos pasos quieres empezar?** Dime y te lo explico paso a paso con código completo 😊
