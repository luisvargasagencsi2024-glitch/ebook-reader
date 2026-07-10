@echo off
title E-book Reader
cd /d "%~dp0"

echo ====================================
echo  Iniciando E-book Reader...
echo ====================================
echo.

echo [1/1] Iniciando servidor (puerto 4000)...
start "Servidor" cmd /c "cd /d "%~dp0backend" && npm run start:full"

echo.
echo ====================================
echo  Servidor iniciado: http://localhost:4000
echo ====================================
echo.
echo  Cerra esta ventana para salir.
echo.
pause > nul
