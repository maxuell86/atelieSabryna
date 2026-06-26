@echo off
title Atelie - Dev Environment
set NODE_OPTIONS=--use-openssl-ca
set NODE_TLS_REJECT_UNAUTHORIZED=0

echo ========================================
echo  Verificando PostgreSQL...
echo ========================================
docker start atelie-pg 2>nul || docker run -d --name atelie-pg -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=atelie -p 5433:5432 postgres:16-alpine

echo ========================================
echo  Sincronizando banco (Prisma)
echo ========================================
cd /d "%~dp0agendamento-backend"
call npx prisma generate
call npx prisma db push

echo ========================================
echo  Iniciando Backend (porta 3333)
echo ========================================
start "Backend" cmd /c "title Backend && cd /d %~dp0agendamento-backend && npm run start:dev"

echo ========================================
echo  Iniciando Frontend (porta 3000)
echo ========================================
start "Frontend" cmd /c "title Frontend && cd /d %~dp0agendamento-frontend && npm run dev"

echo.
echo ========================================
echo  URLs:
echo  Backend:      http://localhost:3333/api
echo  Swagger:      http://localhost:3333/api/docs
echo  Frontend:     http://localhost:3000
echo  Aparência:    http://localhost:3000/dashboard/appearance
echo ========================================
echo.
pause
