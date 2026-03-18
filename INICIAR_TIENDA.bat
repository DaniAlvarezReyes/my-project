@echo off
title Sneakers Store - Servidor Local
color 0A

echo ========================================
echo    SNEAKERS STORE - INICIANDO...
echo ========================================
echo.

REM Ir al directorio del proyecto
cd /d "%~dp0"

REM Verificar que existe node_modules
if not exist "node_modules\" (
    echo [!] Instalando dependencias por primera vez...
    echo    Esto puede tardar unos minutos...
    echo.
    call npm install
    echo.
    echo [✓] Dependencias instaladas
    echo.
)

echo [✓] Iniciando servidor Next.js en puerto 3000...
echo [i] La tienda se abrira automaticamente en tu navegador
echo.
echo ========================================
echo    SERVIDOR ACTIVO
echo    Presiona Ctrl+C para detener
echo ========================================
echo.

REM Esperar 5 segundos y abrir navegador
timeout /t 5 /nobreak > nul
start http://localhost:3000

REM Iniciar servidor Next.js
npm run dev

pause
