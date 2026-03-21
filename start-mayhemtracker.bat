@echo off
setlocal

cd /d "%~dp0"

where pnpm >nul 2>nul
if errorlevel 1 (
  echo pnpm n'est pas disponible dans le PATH.
  echo Installe Node.js puis pnpm, puis relance ce script.
  exit /b 1
)

echo Lancement de Mayhem Tracker...
pnpm dev
