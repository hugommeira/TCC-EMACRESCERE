# Auditoria de segurança e proteção de dados

> **Situação em 05/10/2026.** As propostas deste documento (8c CPF cifrado, 8d
> log de leitura do prontuário, 9b limite de login por IP, item 10 validade da
> sessão) **ainda não foram implementadas** — continuam valendo como estão.
>
> Depois deste levantamento, uma revisão independente de todo o código (02/10)
> achou e corrigiu três falhas (commit `1d1dc85`):
> - a fila em tempo real (`/api/queue/sse`) não exigia médico **aprovado**: um
>   médico recém-cadastrado (pendente) lia nome, alergias e queixa dos pacientes;
> - as **notas internas** do médico chegavam ao paciente por quatro caminhos
>   (duas rotas da API, a página da sala e o evento em tempo real);
> - o `callbackUrl` do login aceitava endereço externo (redirecionamento para
>   outro site); agora só aceita caminho interno (`lib/redirect.ts`).
>
> Os logins sociais (03/10) seguem regras próprias: papel sempre `PATIENT`,
> e-mail obrigatório e, no Google, só e-mail verificado (`lib/oauth-profile.ts`).
> Fica como risco aceito, por ser um TCC sem usuários reais: as contas de
> demonstração têm senha pública (`Demo@12345`) e são recriadas a cada deploy.

Levantamento do estado atual dos itens 8, 9 e 10 da revisão crítica.
**Nada aqui foi implementado** — é diagnóstico e proposta, para revisão antes
de mexer no backend.

Data do levantamento: 12/09/2026 (código da época: `1c4a107` + ajustes locais que não foram enviados). Revalidar os números de linha antes de citar na monografia.

---

## Resumo para a banca

| # | Tema | Estado | Ação proposta |
|---|------|--------|---------------|
| 8a | Controle de acesso por papel | ✅ Implementado e correto | Nenhuma |
| 8b | CPF fora das respostas de API | ✅ Implementado | Nenhuma |
| 8c | CPF em texto plano no banco | ⚠️ Lacuna | Hash + máscara (médio) |
| 8d | Log de *leitura* de prontuário | ❌ Ausente | `AuditAction` novo (baixo) |
| 9a | Rate limiting | ✅ Implementado | Nenhuma |
| 9b | Limite de login por IP | ⚠️ Só por e-mail | Chave dupla (baixo) |
| 9c | Buckets em memória na Vercel | ⚠️ Limitação conhecida | Documentar |
| 10a | Expiração da sessão | ⚠️ 30 dias (padrão) | `maxAge` explícito (baixo) |
| 10b | Vazamento de token em log | ✅ Nenhum encontrado | Nenhuma |

Três dos quatro pontos que a revisão assumia estarem ausentes **já estavam
implementados**. As lacunas reais são 8c, 8d, 9b e 10a.

---

## Item 8 — Proteção de dados sensíveis

### O que já está correto

**Controle de acesso por papel, em duas camadas.** O middleware
([`lib/auth.config.ts:15`](../lib/auth.config.ts)) só distingue autenticado de
anônimo — sozinho, ele deixaria um paciente abrir `/dashboard/admin`. Mas cada
layout aplica o papel antes de renderizar:

- `app/dashboard/patient/layout.tsx` → `requireRole("PATIENT")`
- `app/dashboard/doctor/layout.tsx` → `requireRole("DOCTOR")`
- `app/dashboard/admin/layout.tsx` → checa `ADMIN` ou `SUPER_ADMIN` e redireciona

**Propriedade verificada, não só papel.** Não basta ser médico para abrir um
prontuário — é preciso ser o médico *daquela consulta*:

```ts
// services/api/consultation.ts:70
const isParticipant =
  consultation.patientId === requesterId ||
  consultation.doctorId  === requesterId;
if (!isParticipant) throw new ForbiddenError();
```

O mesmo vale para a escrita (`app/api/consultations/[id]/prontuario/route.ts:26`
exige `role === "DOCTOR"` **e** `c.doctorId === session.user.id`).

**CPF nunca sai pela API.** `stripPartyPii()`
([`services/api/consultation.ts:257`](../services/api/consultation.ts)) remove o
CPF de paciente, médico e remetente de mensagem antes de serializar. Vale
destacar isso na defesa: é uma decisão de minimização de dados no ponto certo.

**Senhas com bcrypt cost 12** (`services/api/user.ts:59`), e o `authorize()`
executa `bcrypt.compare` mesmo quando o usuário não existe, usando um hash
dummy, para não vazar quais e-mails estão cadastrados por diferença de tempo
(`lib/auth.ts:14`).

**Audit log existe** (`model AuditLog` no schema; `lib/audit.ts`), com autor,
ação, entidade, estado anterior/posterior, IP e user-agent.

### Lacuna 8c — CPF em texto plano

```prisma
// prisma/schema.prisma:115
cpf String? @unique
```

Quem tiver acesso de leitura ao banco (dump, backup, console do Neon) lê todos
os CPFs. É o dado mais sensível do schema depois do prontuário.

**Proposta mínima viável.** Guardar dois campos em vez de um:

- `cpfHash String? @unique` — SHA-256 do CPF com um pepper de env var. Continua
  servindo à checagem de duplicidade, que é o único uso real hoje.
- `cpfMask String?` — `***.***.789-00`, para exibição na interface.

O CPF em claro deixa de existir no banco. O impacto é contido porque a busca
por CPF hoje só acontece no cadastro. **Custo:** uma migration com backfill e
ajuste em `registerPatient`/`registerDoctor`. Meio dia de trabalho.

**Alternativa mais barata:** deixar como está e documentar na monografia que o
Neon cifra os dados em repouso (AES-256) e o acesso é restrito por credencial.
É uma resposta defensável se o prazo apertar, mas mais fraca.

### Lacuna 8d — não há log de *leitura* de prontuário

`AuditAction` (`lib/audit.ts:47`) cobre escritas — `PRESCRIPTION_CREATED`,
`CONSULTATION_COMPLETED`, `USER_LOGIN`… Não há nenhuma ação de **acesso**.
Hoje não é possível responder "quem abriu o prontuário do paciente X e quando",
que é exatamente a pergunta que a LGPD e a banca fazem.

**Proposta.** É a correção de melhor relação valor/esforço da lista:

1. Duas constantes novas em `AuditAction`:
   ```ts
   PRONTUARIO_VIEWED:   "prontuario.viewed",
   PATIENT_DATA_VIEWED: "patient_data.viewed",
   ```
2. Uma chamada `auditLog({...})` no `GET` de
   `app/api/consultations/[id]/route.ts`, logo após o `getConsultationById`
   passar na verificação de participante.
3. Opcional: uma aba no painel admin listando os acessos.

`auditLog` já é fire-and-forget com erro silenciado, então não há risco de
quebrar o fluxo se a escrita do log falhar. **Custo:** ~1 hora.

⚠️ Um detalhe a considerar: o `GET` é chamado com frequência pelo painel da
sala de consulta. Convém registrar o primeiro acesso de cada par
(usuário, consulta) por janela de tempo, ou a tabela cresce rápido.

---

## Item 9 — Rate limiting

### Já implementado

`lib/security.ts` traz um limitador de janela deslizante, verificação de origem
contra CSRF e uma tabela de limites por rota:

```ts
// lib/security.ts:118
export const RL = {
  login:          { limit: 5,  windowSec: 60 },
  register:       { limit: 3,  windowSec: 60 * 5 },
  forgotPassword: { limit: 3,  windowSec: 60 * 15 },
  // …
};
```

Aplicado em `/api/users/register` (`route.ts:17`, por IP) e dentro do
`authorize()` do NextAuth (`lib/auth.ts:65`, 5 tentativas a cada 15 min).

### Lacuna 9b — login limitado por e-mail, não por IP

```ts
// lib/auth.ts:65
rateLimit({ key: `login:${email.toLowerCase()}`, limit: 5, windowSec: 60 * 15 });
```

Isso barra força bruta contra **uma** conta. Não barra *password spraying*: um
atacante que tente `Senha123` contra mil e-mails diferentes nunca estoura o
limite, porque cada e-mail tem seu próprio bucket.

**Proposta.** Somar uma segunda chave por IP na mesma função:

```ts
const ip = getClientIp(req);
if (!rateLimit({ key: `login-ip:${ip}`, limit: 20, windowSec: 60 * 15 }).ok) return null;
```

O obstáculo é que `authorize()` não recebe o `Request` na assinatura do
NextAuth v5 — é preciso puxar o IP via `headers()` do `next/headers`. **Custo:**
~1 hora, incluindo teste.

### Lacuna 9c — buckets em memória

O próprio arquivo já documenta (`lib/security.ts:7`): o `Map` vive no processo
Node. Na Vercel, cada instância serverless tem o seu, então o limite efetivo é
`limite × nº de instâncias`, e um cold start zera os contadores.

**Recomendação: não corrigir agora.** A correção certa é Redis/Upstash — uma
dependência externa nova, com conta e variável de ambiente, pouco antes da
apresentação. O ganho real no tráfego de um TCC é nulo. Vale mais **citar a
limitação na monografia** como decisão consciente de arquitetura, junto com o
caminho de evolução. Isso costuma pontuar melhor que a implementação.

---

## Item 10 — Sessão NextAuth consumida pelo app Flutter

### Achados

**Expiração: 30 dias.** `lib/auth.ts:41` define `session: { strategy: "jwt" }`
sem `maxAge`, então vale o padrão do NextAuth. Para uma aplicação que carrega
dado de saúde, é longo.

*Mitigação já existente*, e ela é boa: o callback `jwt` reconsulta `active` e
`role` no banco a cada 60 segundos (`ACTIVE_RECHECK_MS`) e retorna `null` se o
usuário foi desativado — a sessão morre na hora, sem esperar o token expirar.
Isso cobre o pior cenário de um JWT longo.

**Refresh token:** não se aplica. Com `strategy: "jwt"` não há refresh token
separado para rotacionar; o token é reemitido a cada requisição dentro da
janela. A revalidação de 60s cumpre o papel.

**Vazamento em log: nenhum encontrado.** Varredura por `console.log`/`debug`/
`info` no projeto inteiro: as únicas ocorrências estão em `prisma/seed*.ts`
(scripts de povoamento). Nenhum token, cookie ou senha registrado.

**No app Flutter, o log completo está corretamente isolado:**

```dart
// mobile/lib/services/api_client.dart:36
// Loga request/response completos (inclui credenciais e cookies) —
// só em debug, nunca em release.
if (kDebugMode) {
  dio.interceptors.add(LogInterceptor(/* … */));
}
```

A `DebugLoginTestScreen`, que imprime os cookies salvos na tela, também só é
alcançável sob `kDebugMode` (`screens/startup/access_blocked_screen.dart:56`).
`ApiClient.clearSession()` apaga o cookie jar no logout. Este item está bem
resolvido.

**Observação menor:** `PersistCookieJar` grava em `FileStorage` sem cifra, no
diretório de documentos do app. Em aparelho não rooteado o sandbox do Android
protege; em aparelho rooteado, o cookie é legível. Migrar para
`flutter_secure_storage` resolveria, mas é melhoria opcional.

### Proposta

Uma linha, e é a única mudança de backend que eu recomendaria fazer antes da
apresentação:

```ts
// lib/auth.ts:41
session: {
  strategy: "jwt",
  maxAge: 60 * 60 * 24 * 7,   // 7 dias em vez de 30
  updateAge: 60 * 60 * 24,    // reemite o token no máximo 1x/dia
},
```

**Custo:** 5 minutos. **Risco:** sessões existentes continuam válidas até o
prazo antigo; ninguém é deslogado pela mudança.

⚠️ Testar o app Flutter depois: o cookie jar persistido passa a expirar em 7
dias, e vale confirmar que a tela de sessão inválida aparece como esperado em
vez de um erro cru.

---

## Ordem sugerida

1. **10a** — `maxAge` de 7 dias (5 min, risco baixo, boa resposta pra banca)
2. **8d** — log de leitura de prontuário (~1 h, é o que a LGPD cobra)
3. **9b** — limite de login por IP (~1 h)
4. **8c** — hash de CPF (~meio dia, só se houver folga no prazo)
5. **9c** — não fazer; documentar como decisão de arquitetura

Os itens 1 a 3 somam cerca de duas horas e cobrem as perguntas mais prováveis
da arguição sobre proteção de dados.
