RELATÓRIO COMPLETO DO PROJETO
1. VISÃO GERAL
Plataforma SaaS de agendamento online para maquiadoras (profissionais de beleza). Permite que a profissional gerencie serviços, clientes e agendamentos em um dashboard privado, e que clientes façam agendamentos via página pública sem necessidade de cadastro.
Stack: NestJS 11 + Prisma 6 + PostgreSQL (backend), Next.js 15.5 + React 19 + Tailwind v4 + shadcn/ui (frontend)
2. PASSO A PASSO PARA RODAR O PROJETO COMPLETO

   2.1. Pré-requisitos
   - Node.js 20+ (recomendado 22+)
   - Docker Desktop (ou PostgreSQL nativo)
   - npm 10+

   2.2. Iniciar banco PostgreSQL (via Docker)
   docker run -d --name atelie-pg ^
     -e POSTGRES_USER=postgres ^
     -e POSTGRES_PASSWORD=postgres ^
     -e POSTGRES_DB=atelie ^
     -p 5433:5432 postgres:16-alpine

   O banco local usa porta 5433 para evitar conflito com PostgreSQL nativo que usa 5432.

   2.3. Backend
   cd agendamento-backend
   npm ci
   npx prisma db push
   npx prisma generate
   npm run start:dev
   # Swagger UI: http://localhost:3333/api/docs
   # Backend: http://localhost:3333/api

   2.4. Frontend
   cd agendamento-frontend
   npm ci
   npm run dev
   # Frontend: http://localhost:3000

   2.5. Docker completo (alternativa aos passos 2.2 a 2.4)
   docker compose up -d --build   # Na raiz do projeto

   2.6. Testar fluxo completo (passo a passo)
   1) Acessar http://localhost:3000/register
   2) Criar conta profissional (ex: "Maria Makeup", maria@teste.com, "123456", "11999999999")
   3) Login automático redireciona para /dashboard
   4) No menu lateral, ir em "Disponibilidade"
   5) Adicionar períodos: ex. 09:00 às 12:00 com slots de 30min
   6) Ir em "Serviços" → "Novo Serviço" (ex: "Maquiagem Social" R$ 150,00)
   7) No canto inferior da sidebar, clicar no link público (ex: /agende/maria-makeup-a3b2)
   8) Passo 1: selecionar data e horário disponível
   9) Passo 2: selecionar o serviço
   10) Passo 3: informar nome e telefone → "Confirmar Agendamento"
   11) WhatsApp da maquiadora abre automaticamente com os dados do agendamento
   12) Voltar ao /dashboard para ver o agendamento na seção "Agendamentos Recentes"
3. ARQUITETURA DO BANCO (PostgreSQL)
Modelo completo em prisma/schema.prisma (134 linhas):
  User (users)                      Professional (tenant)
  ├── id UUID PK
  ├── nome VARCHAR(255)
  ├── email VARCHAR(255) UNIQUE
  ├── slug VARCHAR(100) UNIQUE       ← Link público (ex: "maria-makeup-a3b2")
  ├── senha VARCHAR(255)             ← bcrypt hash
  ├── telefone VARCHAR(50)
  ├── reset_token VARCHAR(255)?      ← Recuperação de senha
  ├── reset_expires TIMESTAMPTZ?
  │
  ├──< Service (services)
  │     ├── nome, descricao, preco (Decimal), valor_sinal (Decimal)
  │     ├── foto_url?, ativo?
  │     └── Relacionamentos: User, Appointment[]
  │
  ├──< Client (clients)
  │     ├── nome, telefone, email?, observacoes?
  │     └── Relacionamentos: User, Appointment[]
  │
  ├──< Appointment (appointments)
  │     ├── data (Date), horario (VARCHAR(5) "HH:MM"), status (enum)
  │     ├── valor_servico, valor_sinal (Decimal), viewed (Boolean)
  │     ├── expires_at TIMESTAMPTZ?    ← Para liberar horário não confirmado
  │     ├── Relacionamentos: User, Client, Service, Payment?
  │     │
  │     └──< Payment (payments)        ← Modelo preparado para PagBank PIX
  │           ├── transaction_id?, gateway='pagbank', payment_method?
  │           ├── amount, pix_qrcode?, pix_copy_paste?
  │           └── status (enum: PENDING, PAID, EXPIRED, CANCELLED, REFUNDED)
  │
  └──< AvailabilityBlock (availability_blocks) ← NOVO
        ├── data (Date), horario_inicio (VARCHAR(5)), horario_fim (VARCHAR(5))
        ├── duracao_minutos (Int) — duração de cada slot gerado
        └── Relacionamentos: User
Enums: AppointmentStatus (disponivel, reservado, confirmado, cancelado, expirado), PaymentStatus (PENDING, PAID, EXPIRED, CANCELLED, REFUNDED)
4. BACKEND (NestJS 11)
Arquivos: 36 arquivos .ts em src/, 9 arquivos de teste, 1 E2E.
Módulos e endpoints
Módulo	Prefixo	Autenticação	Endpoints
Auth	/api/auth	❌	POST register, POST login, POST forgot-password, POST reset-password
Services	/api/services	✅ JWT	CRUD completo (sem duracao_minutos)
Clients	/api/clients	✅ JWT	CRUD completo
Appointments	/api/appointments	✅ JWT	CRUD + filtro por data + validação de horário único
Availability	/api/availability	✅ JWT	CRUD + GET /slots?data= (gerar slots)
Public	/api/public/:slug	❌	GET /, GET /services, GET /slots?data=, POST /appointments
Fluxo de autenticação
- Register: cria usuário, gera slug único (nome + sufixo aleatório de 4 chars)
- Login: retorna { access_token: JWT, user: { id, nome, email, slug } }
- JWT com expiração de 7 dias, guarda sub (user.id) e email
- @UseGuards(JwtAuthGuard) + @CurrentUser() decorator injetam usuário nos controllers
- Senhas armazenadas com bcrypt (salt rounds: 10)
Fluxo de recuperação de senha
1. POST /api/auth/forgot-password com { email } → gera token aleatório (64 hex chars) e reset_expires (1h)
2. Em produção: enviaria email. Em dev: retorna token na resposta
3. POST /api/auth/reset-password com { token, senha } → valida token não expirado, atualiza senha
Regras de negócio importantes
- Double-booking prevention: impede criar agendamento para mesmo usuário, data, horário e status ativo (reservado/confirmado)
- Auto-população: valor_servico e valor_sinal são preenchidos automaticamente a partir do serviço se não enviados
- Slug público: único por profissional, usado na página pública de agendamento
- Escopo por tenant: todo CRUD filtra por user_id extraído do JWT
- DTOs com validação: class-validator em todos os endpoints
Swagger
Disponível em http://localhost:3333/api/docs com todos os endpoints documentados e autenticação via "Authorize" (Bearer token).
5. FRONTEND (Next.js 15.5 + App Router + Tailwind v4 + shadcn/ui)
Estrutura de páginas
Rota	Descrição
/login	Login da profissional
/register	Cadastro da profissional
/forgot-password	Solicitar recuperação de senha
/reset-password	Redefinir senha (com token na URL)
/dashboard	Home com cards de estatísticas + agendamentos recentes (com tag "Novo!")
/dashboard/availability	Gerenciar disponibilidade: adicionar períodos (início/fim/duração) + preview dos slots gerados
/dashboard/services	CRUD de serviços (tabela + modal, sem duração)
/dashboard/clients	CRUD de clientes (tabela + modal)
/dashboard/appointments	Calendário diário com create/confirm/cancel
/agende/[slug]	Página pública de agendamento (3 etapas: data/hora → serviço → dados do cliente). Ao confirmar, abre WhatsApp da maquiadora automaticamente com resumo do agendamento
Componentes UI (shadcn/ui)
Button, Card, Dialog, DropdownMenu, Input, Label, Table, Tabs, Sonner (toast)
Auth Flow
- AuthContext gerencia estado global de autenticação
- Token e user salvos no localStorage
- api.ts (ApiClient) injeta token automaticamente em requisições
- Middleware protege rotas /dashboard/* e redireciona /login → /dashboard se logado
- Sidebar no dashboard exibe link público (atelie.app/{slug}) para a página de agendamento
6. TESTES
Unitários (27 testes, todos passando)
Arquivo	Qtd	Cobertura
auth/	0	AuthService não tem spec unitária (testado via E2E)
services/service.spec.ts	6	create, findAll, findOne, NotFound, update, remove
clients/service.spec.ts	6	create, findAll, findOne, NotFound, update, remove
appointments/service.spec.ts	9	create, NotFound x2, Conflict, findAll, findByDate, findOne, NotFound, remove
public/service.spec.ts	1	defined
app.controller.spec.ts	1	getHello
*/controller.spec.ts x4	4	defined (smoke tests)
E2E (integração real com banco, 26+ testes em test/app.e2e-spec.ts)
- Auth: register, duplicate reject, login, invalid password, slug returned
- Services: sem token 401, CRUD completo
- Clients: create, list
- Appointments: create, conflict, list, update status, delete
- Public: página profissional, services, slots, create appointment, conflict
- Password reset: forgot-password, reset-password, login com nova senha, token reutilizado 400
Para rodar E2E:
npm run test:e2e    # Requer PostgreSQL rodando
7. DEPLOYMENT (Docker)
docker-compose.yml na raiz orquestra 3 containers:
- postgres (porta 5432 interna, sem exposição externa)
- backend (porta 3333, multi-stage Dockerfile, Alpine)
- frontend (porta 3000, standalone Next.js)
docker compose up -d --build
Verificar logs: docker compose logs -f [backend|frontend|postgres]
8. VARIÁVEIS DE AMBIENTE
Backend (agendamento-backend/.env)
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/atelie?schema=public"
DIRECT_URL="postgresql://postgres:postgres@localhost:5433/atelie?schema=public"
JWT_SECRET="atelie-dev-jwt-secret-key-2026"
PORT=3333
FRONTEND_URL="http://localhost:3000"
Porta 5433 é para desenvolvimento local (evita conflito com pg nativo 5432). Docker usa 5432.
Frontend (agendamento-frontend/.env)
NEXT_PUBLIC_API_URL="http://localhost:3333/api"
⚠️ O arquivo .env não existe atualmente no frontend. Criar antes de rodar se quiser customizar URL.
9. O QUE JÁ FOI IMPLEMENTADO (6 fases)
- Fase 0: Setup NestJS + Prisma + PostgreSQL + Docker + migration inicial
- Fase 1: Módulos Auth (JWT), Services, Clients, Appointments com CRUD completo
- Fase 2: Dashboard completo: login, register, sidebar, services/clients/appointments CRUD, middleware
- Fase 3: 27 testes unitários + E2E tests
- Fase 4: Dockerfiles multi-stage + docker-compose.yml
- Fase 5: Página pública /agende/[slug] + forgot/reset password + slug automático
- Fase 6:
  * Novo modelo AvailabilityBlock no banco (disponibilidade manual por data/intervalo/duração)
  * Removido duracao_minutos dos serviços (duração agora vem do slot de disponibilidade)
  * Módulo Availability no backend (CRUD + geração de slots)
  * Página /dashboard/availability com calendário, adição/remoção de períodos e preview de slots
  * Fluxo público alterado: 1º escolhe horário → 2º serviço → 3º dados
  * Agendamentos recentes no dashboard com tag "Novo!" para menos de 24h
  * Campo viewed no Appointment para controle de notificação
  * Notificação via WhatsApp — ao confirmar agendamento na página pública, abre WhatsApp da maquiadora automaticamente com dados do cliente, serviço, data/horário e valor
10. PRÓXIMOS PASSOS RECOMENDADOS
Prioridade	Tarefa	Arquivos afetados
🔴 Alta	Integrar PagBank PIX - Modelo Payment já existe no schema, precisa implementar gateway	payments/, prisma/schema.prisma, agende/[slug]/page.tsx
🔴 Alta	Serviço de email - Para notificações de confirmação e recuperação de senha	auth/auth.service.ts, novo mail/ module
🟡 Média	Lembretes automáticos - @nestjs/schedule para enviar lembretes antes do horário	Novo notifications/ module
🟡 Média	Dashboard de relatórios - Gráficos de faturamento, ocupação, clientes recorrentes	dashboard/page.tsx, novo reports/ module
🟢 Baixa	Upload de fotos - Serviços com foto_url, armazenamento S3/Cloudflare R2	services/, Storage SDK
🟢 Baixa	Limpeza de dependências - @supabase/supabase-js, react-hook-form e @hookform/resolvers não são usados	package.json
11. PONTOS DE ATENÇÃO / CONHECIMENTO TÁCITO
- Docker PostgreSQL usa 5432, desenvolvimento local usa 5433 — causou confusão no setup inicial
- PrismaService é Global (@Global()), não precisa importar PrismaModule em cada módulo
- slug é gerado automaticamente na criação do usuário (nome normalizado + 4 chars aleatórios)
- Forgot-password expõe token na resposta em ambientes não-production — intencional para dev
- appointments têm check constraint de horário HH:MM — validado pelo DTO com @Matches(/^\d{2}:\d{2}$/)
- Frontend usa next --turbopack para build — funciona, mas se migrar para webpack padrão, verificar compatibilidade
- Migration add_slug_to_user (20260626020000) tem UPDATE para gerar slugs retroativos — já executado
- Testes E2E dependem de banco PostgreSQL real — não usam banco in-memory
- A rota /agende/[slug] usa params do Next.js 15 (não useParams() hook — faz parte do server component)
- O middleware do Next.js verifica cookie token OU header Authorization — ambos funcionam
- AvailabilityBlock gera slots automaticamente com base no intervalo (início→fim) e duração por slot
- Slots disponíveis na página pública são filtrados subtraindo agendamentos já reservados/confirmados
- O fluxo público foi alterado: 1º escolhe horário → 2º serviço → 3º dados (antes era serviço → horário → dados)
- O campo duracao_minutos foi removido do Service — a duração agora é definida no AvailabilityBlock
- A página de disponibilidade mostra preview em tempo real dos slots que serão gerados antes de salvar
- Agendamentos com menos de 24h aparecem com tag "Novo!" no dashboard
- WhatsApp notification: ao confirmar agendamento na página pública, abre wa.me/{telefone}?text=... em nova aba automaticamente
- O telefone da maquiadora é formatado removendo caracteres não-dígitos e prefixando com 55 (código do Brasil)
- A mensagem enviada via WhatsApp inclui: nome do cliente, data, horário, serviço, valor e contato
12. DIAGRAMA DE ROTAS RESUMIDO
[Cliente]                    [Maquiadora]
    |                             |
    ▼                             ▼
/agende/[slug]              /login → /dashboard
    │                             ├── /dashboard/  (stats + recentes)
    ├── Step 1: Data/Hora         ├── /dashboard/availability (CRUD disponibilidade)
    ├── Step 2: Serviço           ├── /dashboard/services (CRUD sem duração)
    └── Step 3: Dados + Confirm  ├── /dashboard/clients  (CRUD)
           │                     └── /dashboard/appointments (calendário)
           │                              │
           ▼                              ▼
    POST /api/public/:slug      POST /api/appointments (JWT)
    /appointments                /availability (JWT)
    (sem auth)                   /services, /clients (JWT)
                                 └── /auth/forgot-password
                                     /auth/reset-password