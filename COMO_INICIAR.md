# 🚀 CÓMO LEVANTAR LA TIENDA CON UN CLICK

## ✅ YA INCLUIDO EN TU PROYECTO

Tu proyecto ahora incluye scripts listos para usar:

### **Windows:**
```
📄 INICIAR_TIENDA.bat
```
**Uso:** Doble click en el archivo

### **Mac/Linux:**
```
📄 iniciar-tienda.sh
```
**Uso:** Doble click o en terminal:
```bash
./iniciar-tienda.sh
```

---

## 🎯 QUÉ HACE EL SCRIPT

1. ✅ Verifica si tienes las dependencias instaladas
2. ✅ Si no las tienes, las instala automáticamente
3. ✅ Levanta el servidor Next.js en puerto 3000
4. ✅ Abre automáticamente tu navegador en http://localhost:3000
5. ✅ Muestra logs del servidor en la consola

---

## 🛠️ CONFIGURACIÓN INICIAL

**Antes de usar por primera vez:**

1. **Crear archivo `.env.local`** en la raíz del proyecto:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=tu_clave_publica_stripe
STRIPE_SECRET_KEY=tu_clave_secreta_stripe
```

2. **Ejecutar SQL en Supabase:**
   - Ve a tu proyecto en Supabase
   - SQL Editor
   - Ejecuta `SETUP_COMPLETO.sql`

3. **Listo!** Ahora ejecuta el script

---

## 📋 USO DIARIO

### **Iniciar la tienda:**

**Windows:**
```
Doble click en INICIAR_TIENDA.bat
```

**Mac/Linux:**
```bash
./iniciar-tienda.sh
```

### **Detener el servidor:**
```
Presiona Ctrl+C en la ventana que se abrió
```

### **Si el puerto 3000 está ocupado:**

**Windows:**
```cmd
netstat -ano | findstr :3000
taskkill /PID [número] /F
```

**Mac/Linux:**
```bash
lsof -i :3000
kill -9 [PID]
```

---

## 🎨 PERSONALIZACIÓN

Si quieres cambiar el puerto (por ejemplo, 3001):

**Edita package.json:**
```json
{
  "scripts": {
    "dev": "next dev -p 3001"
  }
}
```

**Y actualiza el script** para abrir http://localhost:3001

---

## 🔧 TROUBLESHOOTING

### "npm no se reconoce"
**Solución:** Instala Node.js desde https://nodejs.org

### "Error: Cannot find module"
**Solución:**
```bash
# Borra node_modules y reinstala
rm -rf node_modules package-lock.json
npm install
```

### "Puerto ya en uso"
**Solución:** Ver sección "Si el puerto 3000 está ocupado" arriba

### Script no funciona en Mac
**Solución:**
```bash
# Dale permisos de ejecución
chmod +x iniciar-tienda.sh
```

---

## 📚 DOCUMENTACIÓN COMPLETA

Para más opciones avanzadas (ejecutables, Electron, PM2, etc.), consulta:
- `GUIA_EJECUTABLE_WEB.md` - Todas las opciones de deployment
- `GUIA_CLAUDE_CODE_VSCODE.md` - Cómo usar IA para desarrollar

---

## ✅ RESULTADO

Después de ejecutar el script verás:

```
========================================
   SNEAKERS STORE - INICIANDO...
========================================

[✓] Iniciando servidor Next.js en puerto 3000...
[i] La tienda se abrirá automáticamente en tu navegador

========================================
    SERVIDOR ACTIVO
    Presiona Ctrl+C para detener
========================================

▲ Next.js 14.x.x
- Local:        http://localhost:3000
- ready in 1.5s
```

Y tu navegador se abrirá automáticamente con la tienda funcionando. 🎉

---

**¡Así de simple!** Un solo click y todo funciona. 🚀
