@echo off
REM ============================================================
REM  Tutor de IA de trigonometria - arranque facil (doble clic)
REM  Abre Backend (FastAPI/uvicorn :8000) + Frontend (Vite :5173)
REM  y luego abre el navegador. Sin claves dentro: usa api\.env
REM  (local, nunca se commitea) y .env.local si existe.
REM ============================================================
setlocal
cd /d "%~dp0"

echo [1/4] Verificando herramientas...
where node >nul 2>nul
if errorlevel 1 (
  echo FALTA node. Instala Node.js 20+ desde https://nodejs.org y reintenta.
  pause
  exit /b 1
)
where npm >nul 2>nul
if errorlevel 1 (
  echo FALTA npm. Reinstala Node.js y reintenta.
  pause
  exit /b 1
)
where python >nul 2>nul
if errorlevel 1 (
  echo FALTA python. Instala Python 3.11+ y reintenta.
  pause
  exit /b 1
)
python -m uvicorn --version >nul 2>nul
if errorlevel 1 (
  echo FALTA uvicorn. Ejecuta:  pip install -r api\requirements.txt
  pause
  exit /b 1
)

echo [2/4] Verificando dependencias del frontend...
if not exist "node_modules" (
  echo Instalando dependencias, solo la primera vez...
  call npm ci
  if errorlevel 1 (
    echo Fallo npm ci. Revisa tu conexion e intentalo de nuevo.
    pause
    exit /b 1
  )
)

if not exist "api\.env" (
  echo AVISO: no existe api\.env. Copialo con:
  echo   copy api\.env.example api\.env
  echo El backend arrancara con valores por defecto: Ollama local.
)

echo [3/4] Levantando Backend :8000 y Frontend :5173...
start "Trig AI - Backend" cmd /k "cd /d ""%~dp0api"" && python -m uvicorn main:app --port 8000"
start "Trig AI - Frontend" cmd /k "cd /d ""%~dp0"" && npm run dev"

echo [4/4] Abriendo el navegador...
REM Espera sin pedir teclado: funciona con doble clic y en cualquier consola.
ping -n 7 127.0.0.1 >nul
start "" http://localhost:5173

echo.
echo Listo: Backend en http://localhost:8000  -  App en http://localhost:5173
echo Cierra las ventanas "Trig AI - Backend" y "Trig AI - Frontend" para detener todo.
endlocal
exit /b 0
