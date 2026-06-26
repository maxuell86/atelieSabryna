# Plano de Deploy — Custo Zero Inicial

## Stack Gratuita

| Camada | Serviço | Plano | Cartão? | Limitações |
|---|---|---|---|---|
| Frontend (Next.js) | Vercel Hobby | Grátis | ❌ | 100 GB banda, 100K invocações/mês, sem uso comercial explícito |
| Backend (NestJS) | Render Free Web Service | Grátis | ❌ | 0.1 CPU, 512 MB RAM, 750 h/mês, dorme após 15 min sem tráfego |
| Banco (PostgreSQL) | Supabase Free | Grátis | ❌ | 500 MB, projeto pausa após 7 dias inativo |
| Storage (uploads) | Supabase Storage | Grátis | Incluso | 1 GB de arquivos |
| Email | Resend Free | Grátis | ❌ | 100 emails/dia |
| Domínio | subdomain.vercel.app | Grátis | — | Subdomínio Vercel |
| CDN/SSL | Cloudflare Free | Grátis | ❌ | SSL, DNS, proxy |
| Keep-alive | Cron-job.org ou Keeper | Grátis | ❌ | Ping a cada 5 min para evitar sleep |

---

## Passo a Passo

### 1. Supabase — Banco + Storage

1. Acessar https://supabase.com e criar conta (sem cartão)
2. Criar novo projeto (nome: `atelie-sabryna`, região mais próxima)
3. Anotar a **Database URL** (`Settings → Database → Connection string`)
4. No menu **Storage**, criar bucket `service-photos` (público)
5. Gerar Service Role Key (`Settings → API → service_role key`) para uploads

### 2. Backend — Ajustes no código

Antes do deploy, adaptar:

**Migrar uploads (substituir multer diskStorage por Supabase Storage)**

Arquivo a modificar: `agendamento-backend/src/theme/theme.controller.ts` (upload de foto do serviço)

```typescript
// Em vez de salvar em disco, enviar para Supabase Storage
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

async uploadToSupabase(file: Express.Multer.File): Promise<string> {
  const { data } = await supabase.storage
    .from('service-photos')
    .upload(`uploads/${Date.now()}-${file.originalname}`, file.buffer, {
      contentType: file.mimetype,
    })
  return `${process.env.SUPABASE_URL}/storage/v1/object/public/service-photos/${data.path}`
}
```

**Integrar Resend para forgot-password**

Arquivo: `agendamento-backend/src/auth/auth.service.ts`

```typescript
import { Resend } from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY);

// No método forgotPassword, após gerar o token:
await resend.emails.send({
  from: 'Ateliê Sabryna <onboarding@resend.dev>',
  to: email,
  subject: 'Recuperação de senha',
  html: `<a href="${process.env.FRONTEND_URL}/reset-password?token=${token}">Clique aqui para redefinir sua senha</a>`,
});
```

**Atualizar CORS**

Arquivo: `agendamento-backend/src/main.ts`

```typescript
app.enableCors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'https://atelie-sabryna.vercel.app',
  ],
});
```

**Variáveis de ambiente (.env.production)**

```
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
JWT_SECRET=<gerar hash forte, ex: openssl rand -hex 64>
PORT=3333
FRONTEND_URL=https://atelie-sabryna.vercel.app
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...
RESEND_API_KEY=re_...
```

### 3. Deploy do Backend no Render

1. Criar conta em https://render.com (GitHub login)
2. Dashboard → **New Web Service**
3. Conectar repositório GitHub → selecionar `agendamento-backend`
4. Configurar:
   - **Name**: `atelie-sabryna-api`
   - **Region**: Ohio (US) ou Singapore (mais perto do Brasil)
   - **Runtime**: Docker
   - **Branch**: `main`
   - **Health Check Path**: `/api`
5. Adicionar **Environment Variables** (as do .env.production)
6. **Service Type**: Free
7. Criar → Render vai buildar e fazer deploy automaticamente
8. URL gerada: `https://atelie-sabryna-api.onrender.com`

### 4. Deploy do Frontend no Vercel

1. Criar conta em https://vercel.com (GitHub login)
2. **Add New → Project**
3. Importar repositório → selecionar `agendamento-frontend`
4. **Environment Variables**:
   - `NEXT_PUBLIC_API_URL=https://atelie-sabryna-api.onrender.com/api`
5. Deploy
6. URL gerada: `https://atelie-sabryna.vercel.app`

### 5. Migrar Banco (rodar schema no Supabase)

No terminal local:

```bash
cd agendamento-backend
npx prisma db push --accept-data-loss
# ou, se quiser migração limpa:
npx prisma migrate deploy
```

### 6. Manter o App Acordado

O Render Free dorme após 15 min sem tráfego (cold start de ~30s).

Soluções gratuitas:
- **Cron-job.org**: Criar job que faz GET em `https://atelie-sabryna-api.onrender.com/api` a cada 14 min
- **UptimeRobot** (grátis): Monitoramento + ping a cada 5 min
- **Cloudflare Workers** (100k req/dia grátis): Worker que faz fetch a cada 14 min

Para o Supabase não pausar (7 dias), acessar o dashboard ou criar um cron semanal que execute uma query.

---

## Limitações Reais

| Problema | Impacto | Mitigação |
|---|---|---|
| Cold start 30-60s | Primeiro acesso do dia demora | Ping a cada 14 min |
| Supabase pausa 7 dias | Fica offline se sem uso | Cron job semanal de health check |
| Vercel Hobby sem uso comercial | Política de fair use | Ignorado até ter receita |
| 500 MB banco | ~10.000 agendamentos | Upgrade quando necessário |
| 1 GB storage | Centenas de fotos | Limpar fotos antigas ou upgrade |

## Upgrade Path (quando começar a lucrar)

| Serviço | Preço | Benefício |
|---|---|---|
| Render Starter | $7/mês | Sem cold start, 512 MB RAM dedicado |
| Vercel Pro | $20/mês | Uso comercial permitido, 1 TB banda |
| Supabase Pro | $25/mês | 8 GB banco, sem pause, backup automático |
| Plano mínimo viável | $7/mês | Só Render Starter + manter resto grátis |
| Plano completo | $52/mês | Todos Pro |

---

## Checklist

- [ ] Conta Supabase criada
- [ ] Bucket `service-photos` configurado
- [ ] Variáveis de ambiente de produção definidas
- [ ] Código adaptado (storage, email, CORS)
- [ ] Backend em deploy no Render
- [ ] Frontend em deploy no Vercel
- [ ] Prisma rodado contra Supabase
- [ ] Teste E2E contra produção (rodar `npm run test:e2e` com API_URL de produção)
- [ ] Cron de keep-alive configurado
- [ ] Fluxo completo testado: agendamento público → WhatsApp → dashboard
