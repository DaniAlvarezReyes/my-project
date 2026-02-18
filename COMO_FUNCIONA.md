# 📚 Guía Completa: Cómo Funciona Todo

## 🏗️ Arquitectura Simple

```
USUARIO ve la web
        ↓
    page.tsx (página principal)
        ↓
Usa componentes de /components
        ↓
Que tienen estilos de Tailwind
        ↓
Todo renderizado por Next.js
```

---

## 📁 Cada Archivo Explicado

### 1️⃣ `src/app/page.tsx` - LA PÁGINA PRINCIPAL

**Qué es:** El código de tu página de inicio (lo que ves en localhost:3000)

**Qué hace:**
```tsx
export default function Home() {
  // Aquí defines qué se muestra
  return (
    <div>
      <NavBar />      ← Barra de navegación arriba
      <Hero />        ← Sección grande de bienvenida
      <Productos />   ← Grid de productos
      <Footer />      ← Pie de página
    </div>
  );
}
```

**Cómo personalizarlo:**
```tsx
// Cambiar título del Hero
<Hero title="TU NUEVO TÍTULO AQUÍ" />

// Cambiar productos
const productos = [
  {
    name: "Tu Producto",
    price: 99.99,
    image: "/tu-imagen.jpg"
  }
];
```

---

### 2️⃣ `src/app/layout.tsx` - EL CONTENEDOR GENERAL

**Qué es:** El "envoltorio" de TODAS tus páginas

**Qué hace:**
```tsx
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}  ← Aquí se renderiza cada página
      </body>
    </html>
  );
}
```

**Para qué sirve:**
- Define la fuente (Inter)
- Configura el idioma (lang="es")
- Añade metadatos SEO
- Se aplica a TODAS las páginas

---

### 3️⃣ `src/app/globals.css` - ESTILOS GLOBALES

**Qué es:** Configuración base de Tailwind

```css
@tailwind base;       ← Estilos reset de Tailwind
@tailwind components; ← Componentes de Tailwind
@tailwind utilities;  ← Clases utility de Tailwind

body {
  font-family: 'Inter', sans-serif;  ← Fuente global
}
```

**Cuándo editarlo:** Casi nunca. Solo si quieres CSS personalizado global.

---

### 4️⃣ `src/components/` - COMPONENTES REUTILIZABLES

**Estructura de cada componente:**
```
Button/
├── Button.tsx    ← El código del componente
└── index.ts      ← Exporta el componente
```

**Ejemplo: Button.tsx**
```tsx
export const Button = ({ children, onClick }) => {
  return (
    <button 
      className="bg-blue-600 text-white px-4 py-2 rounded"
      onClick={onClick}
    >
      {children}
    </button>
  );
};
```

**Cómo usarlo en page.tsx:**
```tsx
import { Button } from '@/components/Button';

<Button onClick={() => alert('Hola')}>
  Click me
</Button>
```

---

### 5️⃣ `tailwind.config.js` - CONFIGURACIÓN DE ESTILOS

**Qué es:** Donde personalizas colores, fuentes, etc.

```js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6',    // Tu color principal
        secondary: '#1E40AF',  // Tu color secundario
        accent: '#F59E0B',     // Tu color de acento
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
};
```

**Cómo usar tus colores:**
```tsx
<div className="bg-primary text-white">
  Esto será azul (#3B82F6)
</div>
```

---

### 6️⃣ `next.config.js` - CONFIGURACIÓN DE NEXT.JS

**Qué es:** Configuración del framework

```js
module.exports = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',  // Permitir imágenes de aquí
      },
    ],
  },
};
```

**Cuándo editarlo:**
- Añadir dominios de imágenes externas
- Configurar redirects
- Variables de entorno

---

### 7️⃣ `package.json` - DEPENDENCIAS

**Qué es:** Lista de librerías que usa tu proyecto

```json
{
  "dependencies": {
    "next": "15.1.6",      // Framework
    "react": "^19.0.0",    // Librería UI
    "react-dom": "^19.0.0" // Para renderizar
  }
}
```

**Scripts disponibles:**
```bash
npm run dev    # Modo desarrollo
npm run build  # Compilar para producción
npm run start  # Iniciar en producción
```

---

## 🎨 Cómo Funciona Tailwind

**Concepto:** Classes en lugar de CSS

**Antes (CSS tradicional):**
```css
.boton {
  background-color: blue;
  color: white;
  padding: 8px 16px;
  border-radius: 4px;
}
```

**Ahora (Tailwind):**
```tsx
<button className="bg-blue-600 text-white px-4 py-2 rounded">
  Click
</button>
```

**Clases más comunes:**
```
COLORES:
bg-blue-600     → Fondo azul
text-white      → Texto blanco
border-red-500  → Borde rojo

ESPACIADO:
p-4             → padding 16px (todos lados)
px-4            → padding horizontal 16px
py-2            → padding vertical 8px
m-4             → margin 16px
gap-4           → espacio entre elementos

TAMAÑO:
w-full          → width: 100%
h-screen        → height: 100vh
text-xl         → font-size grande

FLEXBOX:
flex            → display: flex
items-center    → align-items: center
justify-between → justify-content: space-between

RESPONSIVE:
md:text-2xl     → En pantallas medianas, texto más grande
lg:grid-cols-4  → En pantallas grandes, 4 columnas
```

---

## 🔄 Flujo de Trabajo Típico

### 1. Modificar contenido
```tsx
// src/app/page.tsx
<Hero title="Nuevo título" />  ← Cambias esto
```
→ Guardas → Se recarga automáticamente en el navegador

### 2. Cambiar estilos
```tsx
// Cambias la clase
<div className="bg-red-600">  ← De blue a red
```
→ Guardas → Cambio instantáneo

### 3. Crear nuevo componente
```tsx
// src/components/MiComponente/MiComponente.tsx
export const MiComponente = () => {
  return <div>Hola!</div>;
};
```

```tsx
// src/components/MiComponente/index.ts
export { MiComponente } from './MiComponente';
```

```tsx
// src/app/page.tsx
import { MiComponente } from '@/components/MiComponente';

<MiComponente />
```

---

## 🖼️ Gestión de Imágenes

### Opción 1: Imágenes locales (en tu servidor)

```
public/
├── logo.png
├── hero-bg.jpg
└── products/
    ├── nike.jpg
    └── adidas.jpg
```

**Usar:**
```tsx
<img src="/logo.png" alt="Logo" />
<img src="/products/nike.jpg" alt="Nike" />
```

### Opción 2: Imágenes externas

```js
// next.config.js
remotePatterns: [
  {
    protocol: 'https',
    hostname: 'tucdn.com',
  },
]
```

**Usar:**
```tsx
<img src="https://tucdn.com/imagen.jpg" />
```

### Opción 3: Optimización con Next.js Image

```tsx
import Image from 'next/image';

<Image
  src="/logo.png"
  alt="Logo"
  width={200}
  height={50}
/>
```
→ Next.js optimiza automáticamente

---

## 📊 Resumen Visual

```
Tu Browser
    ↓
localhost:3000
    ↓
Next.js renderiza src/app/page.tsx
    ↓
page.tsx usa componentes de src/components/
    ↓
Componentes tienen clases de Tailwind
    ↓
Tailwind genera CSS según tailwind.config.js
    ↓
CSS se aplica y ves la web bonita
```

---

## 💡 Conceptos Clave

1. **Componentes = Piezas reutilizables**
   - Button, NavBar, Hero, etc.
   - Los usas en múltiples lugares

2. **Tailwind = Estilos con clases**
   - No escribes CSS
   - Usas clases predefinidas

3. **Next.js = Framework React**
   - Maneja el routing (páginas)
   - Optimiza el rendimiento
   - Server-side rendering

4. **TypeScript = JavaScript con tipos**
   - Menos errores
   - Mejor autocompletado
   - Código más seguro

---

## 🎯 Siguiente Paso: ¿Qué Hacer Ahora?

Ahora que entiendes cómo funciona todo, vamos a:

1. ✅ **Crear nuevas páginas** (productos, contacto, etc.)
2. ✅ **Añadir navegación** (links que funcionen)
3. ✅ **Integrar pasarela de pago** (Stripe)
4. ✅ **Añadir carrito de compra**

**¿Por cuál empezamos?** 😊
