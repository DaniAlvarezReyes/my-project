#!/bin/bash

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

clear
echo "========================================"
echo "   SNEAKERS STORE - INICIANDO..."
echo "========================================"
echo ""

# Ir al directorio del script
cd "$(dirname "$0")"

# Verificar node_modules
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}[!] Instalando dependencias por primera vez...${NC}"
    echo "    Esto puede tardar unos minutos..."
    echo ""
    npm install
    echo ""
    echo -e "${GREEN}[✓] Dependencias instaladas${NC}"
    echo ""
fi

echo -e "${GREEN}[✓] Iniciando servidor Next.js en puerto 3000...${NC}"
echo "[i] La tienda se abrirá automáticamente en tu navegador"
echo ""
echo "========================================"
echo "    SERVIDOR ACTIVO"
echo "    Presiona Ctrl+C para detener"
echo "========================================"
echo ""

# Esperar 5 segundos y abrir navegador
sleep 5
# Mac
open http://localhost:3000 2>/dev/null || \
# Linux
xdg-open http://localhost:3000 2>/dev/null &

# Iniciar servidor Next.js
npm run dev
