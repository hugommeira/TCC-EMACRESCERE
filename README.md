# TeleMed – Plataforma de Telemedicina

Sistema completo de telemedicina com arquitetura modular, pronto para produção.

Design: [Figma do projeto](https://www.figma.com/design/4qVl5xVi3V3eREAm4xELvN/MOUNJARO?node-id=0-1&t=S2NCdtkXR6XwtxAf-1)

## Stack

| Camada       | Tecnologia                      |
|--------------|---------------------------------|
| Framework    | Next.js 14 (App Router)         |
| Linguagem    | TypeScript (strict)             |
| Estilos      | TailwindCSS                     |
| ORM          | Prisma                          |
| Banco        | PostgreSQL (NeonDB serverless)  |
| Auth         | NextAuth v5 (Auth.js)           |
| Pagamentos   | Asaas API                       |
| Realtime     | Server-Sent Events (SSE)        |
| Deploy       | Vercel                          |

## Arquitetura

```
telemedicina/
├── app/                        # Next.js App Router
│   ├── api/                    # Route Handlers
│   │   ├── auth/               # NextAuth
│   │   ├── chat/               # SSE stream + mensagens
│   │   ├── checkout/           # Pagamento Asaas
│   │   ├── consultations/      # CRUD consultas
│   │   ├── prescription/       # Prescrições + validação
│   │   ├── users/              # Cadastro + listagem
│   │   ├── admin/              # Stats admin
│   │   └── webhooks/           # Webhook Asaas
│   ├── auth/                   # Login, registro
│   ├── dashboard/
│   │   ├── patient/            # Painel paciente
│   │   ├── doctor/             # Painel médico
│   │   └── admin/              # Painel admin
│   └── landing/                # Landing page
│
├── components/
│   ├── ui/                     # Button, Input, Badge, Card, Avatar...
│   └── layout/                 # Sidebar, TopBar, DashboardShell
│
├── hooks/                      # useSSE, useChat, useConsultation, useAuth
├── lib/
│   ├── auth.ts                 # NextAuth config
│   ├── prisma.ts               # Singleton Prisma client
│   ├── errors.ts               # Domínio de erros tipados
│   ├── utils.ts                # Formatters, validators, helpers
│   └── validations/            # Zod schemas
│
├── prisma/
│   ├── schema.prisma           # Modelos: User, Consultation, Payment...
│   └── seed.ts                 # Dados iniciais (admin, médico, paciente)
│
├── services/
│   ├── api/                    # Lógica de negócio (consultation, payment...)
│   └── external/               # Integração Asaas
│
└── types/                      # TypeScript types e DTOs
```

## Setup

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env.local
# Preencher DATABASE_URL, NEXTAUTH_SECRET, ASAAS_API_KEY, etc.
```

Para recuperação de senha por e-mail e login com Facebook, ver [Autenticação](#autenticação) abaixo.

### 3. Banco de dados (NeonDB)

```bash
# Criar projeto em https://neon.tech e copiar a connection string

npm run prisma:push      # Push schema para o banco
npm run prisma:generate  # Gerar Prisma Client
npm run prisma:seed      # Popular dados iniciais
```

### 4. Rodar em desenvolvimento

```bash
npm run dev
```

### 5. Verificar tipos e lint

```bash
npm run typecheck
npm run lint
```

## Autenticação

Login por e-mail/senha (Credentials), recuperação de senha por e-mail e login social com Facebook, via NextAuth v5 (Auth.js).

### Recuperação de senha (Resend)

1. Criar conta gratuita em https://resend.com e gerar uma API key.
2. Preencher no `.env.local`:
   ```
   RESEND_API_KEY=re_xxx...
   EMAIL_FROM="TeleMed <onboarding@resend.dev>"
   ```
   `onboarding@resend.dev` funciona sem verificar domínio (bom para dev/teste). Em produção, verifique seu próprio domínio no painel do Resend e use um remetente `@seudominio.com`.
3. Sem `RESEND_API_KEY` configurada, o fluxo de "esqueci minha senha" continua funcionando (token é gerado no banco), mas o e-mail não é enviado — só um aviso aparece no log do servidor.

### Login com Facebook

1. Criar um app em https://developers.facebook.com → adicionar o produto **Facebook Login**.
2. Em **Configurações → Básico**, copiar o **ID do aplicativo** e a **Chave secreta**.
3. Em **Facebook Login → Configurações**, adicionar em "URIs de redirecionamento OAuth válidos":
   - Dev: `http://localhost:3000/api/auth/callback/facebook`
   - Produção: `https://SEU_DOMINIO/api/auth/callback/facebook`
4. Preencher no `.env.local`:
   ```
   FACEBOOK_CLIENT_ID=...
   FACEBOOK_CLIENT_SECRET=...
   ```
5. Sem essas variáveis, o botão "Continuar com Facebook" fica visível mas retorna erro de configuração — configure-as antes de testar esse fluxo.

Uma conta Facebook é automaticamente vinculada a um usuário já existente com o mesmo e-mail (evita contas duplicadas). Novas contas criadas via Facebook recebem o papel `PATIENT`.

## Credenciais de teste (após seed)

| Perfil   | E-mail                      | Senha          |
|----------|-----------------------------|----------------|
| Admin    | admin@telemed.com.br        | Admin@12345    |
| Médico   | dr.silva@telemed.com.br     | Doctor@12345   |
| Paciente | maria@email.com             | Patient@12345  |

## Deploy (Vercel)

```bash
# 1. Configurar variáveis no painel Vercel (ou via CLI)
vercel env pull

# 2. Deploy
vercel --prod
```

O `vercel.json` já está configurado com `prisma generate` no build command.

## Fluxo SSE (Chat)

```
Cliente                     Servidor
  │                              │
  ├── GET /api/chat/{token}/stream ──► ReadableStream (keep-alive)
  │                              │
  ├── POST /api/chat/{token}/messages  (envia msg)
  │                              │
  │                         broadcastToRoom()
  │                              │
  │◄── event: message ───────────┤
  │    data: { id, content, ... }│
```

## Próximas features

- [ ] `feature/auth` – Formulários de login/registro completos
- [ ] `feature/patient-dashboard` – Dashboard com stats reais
- [ ] `feature/doctor-dashboard` – Fila e gestão de consultas
- [ ] `feature/chat` – Interface de chat com SSE
- [ ] `feature/checkout` – Fluxo de pagamento PIX/Cartão/Boleto
- [ ] `feature/prescription` – Emissão e visualização de prescrições
- [ ] `feature/admin-dashboard` – Gestão completa da plataforma
- [ ] `feature/landing` – Landing page completa
